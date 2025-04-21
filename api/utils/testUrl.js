const Incident = require("../models/incidentModel");
const Monitor = require("../models/monitorModel");
const User = require('../models/userModel');
const ResponseTime = require('../models/responseTimeModel');
const axios = require("axios");
const sendAlerts = require('../utils/alert');
const { sendSlackNotification } = require('../controllers/integrationController');

// Configuration for retry logic
const MAX_RETRY_ATTEMPTS = 4; // Will attempt 5 times total (initial + 4 retries)
const RETRY_DELAY_MS = 5000; // 5 seconds between retries

// Utility function to wait between retries
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const testUrl = async (monitor) => {
  let retryCount = 0;
  let lastError = null;

  // Try up to MAX_RETRY_ATTEMPTS + 1 times (including initial attempt)
  while (retryCount <= MAX_RETRY_ATTEMPTS) {
    try {
      const startTime = Date.now();
      const response = await axios.get(monitor.url);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Store response time metric
      try {
        await ResponseTime.create({
          monitor: monitor._id,
          responseTime: responseTime
        });
      } catch (err) {
        console.error(`[testUrl] Error saving response time: ${err.message}`);
      }
      
      // Check if status code is not in 2xx range
      if (response.status >= 400) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      
      // Site is up - only update if it was previously down
      const existingIncident = await Incident.findOne({ 
        monitor: monitor._id, 
        resolved: false 
      });
      
      // Only auto-resolve incidents for URL availability monitors (type 1), not for SSL or domain monitors
      if (existingIncident && monitor.alertsTriggeredOn == 1) {
        console.log(`[testUrl] Resolving incident for URL availability monitor ${monitor._id}`);
        
        // Update the incident
        await Incident.findByIdAndUpdate(existingIncident._id, { resolved: true });
        
        // Always update the monitor's availability status
        await Monitor.updateOne(
          { _id: monitor._id },
          { 
            availability: true,
            lastError: null,  // Clear any previous error
            lastIncidentAt: new Date()  // Reset uptime timer when transitioning from down to up
          }
        );
        
        // Get the fully populated monitor to access team ID for Slack notification
        const populatedMonitor = await Monitor.findById(monitor._id).populate('team');
        
        // Send notification to Slack about automatic resolution
        if (populatedMonitor && populatedMonitor.team) {
          const formattedMessage = `✅ *INCIDENT AUTOMATICALLY RESOLVED* ✅\n*Monitor:* ${monitor.url}\n*Issue:* ${existingIncident.cause}\n*Auto-resolved at:* ${new Date().toLocaleString()}\n*Details:* Service is now responding normally`;
          try {
            await sendSlackNotification(populatedMonitor.team, formattedMessage);
            console.log(`[testUrl] Slack notification sent for auto-resolved incident on monitor ${monitor._id}`);
          } catch (slackError) {
            console.error(`[testUrl] Error sending Slack notification for auto-resolution: ${slackError.message}`);
          }
        }
        
        console.log(`[testUrl] Service restored for monitor ${monitor._id}`);
      } else if (!monitor.availability) {
        // Only update availability for URL monitors (type 1), not for SSL or domain monitors
        if (monitor.alertsTriggeredOn == 1) {
          // Service was marked as down but had no incident - fix availability without resetting uptime
          await Monitor.updateOne(
            { _id: monitor._id },
            { 
              availability: true,
              lastError: null  // Clear any previous error
            }
          );
          console.log(`[testUrl] Fixed availability status for URL monitor ${monitor._id}`);
        }
      }
      // If service was already up, do nothing to preserve the existing uptime
      
      // Successfully reached the URL, exit the retry loop
      return;
    } catch (error) {
      lastError = error;
      retryCount++;
      
      // If we still have retries left, wait and try again
      if (retryCount <= MAX_RETRY_ATTEMPTS) {
        console.log(`[testUrl] Attempt ${retryCount}/${MAX_RETRY_ATTEMPTS + 1} failed for ${monitor.url}. Retrying in ${RETRY_DELAY_MS/1000} seconds...`);
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      
      // All retry attempts failed, mark as down
      console.log(`[testUrl] Service down confirmed after ${retryCount} attempts for monitor ${monitor._id}`);
      
      // Only create incidents and send alerts for URL availability monitors (type 1)
      if (monitor.alertsTriggeredOn == 1) {
        // Get status code from error response or custom error
        const statusCode = lastError.response?.status || 
                          (lastError.message.startsWith('HTTP Error:') ? lastError.message.split(':')[1].trim() : 'Unknown');

        console.log(`[testUrl] Error status code: ${statusCode}`);

        const currentDate = new Date().toISOString();
        const user = await User.findById(monitor.user);
        const data = {
          monitorID: monitor._id,
          monitorURL: monitor?.url,
          statusCode: statusCode,
          createdAt: currentDate,
          firstName: user.firstName,
          attempts: retryCount
        };

        // Always update monitor status and error code
        await Monitor.updateOne(
          { _id: monitor._id },
          { 
            availability: false,
            lastError: `Status ${statusCode}`
          }
        );

        // Check for existing UNRESOLVED incident that matches this specific error
        // We only care about unresolved incidents - if there are only resolved ones, we should create a new incident
        const existingIncident = await Incident.findOne({ 
          monitor: monitor._id, 
          resolved: false,
          cause: `Service Down Status ${statusCode}`  // Match specific error
        });

        if (!existingIncident) {
          console.log(`[testUrl] Creating new incident for URL monitor ${monitor._id}`);
          const cause = `Service Down Status ${statusCode}`;
          const details = `HTTP Status ${statusCode} detected for ${monitor.url}`;
          
          // Create the incident
          const incident = await Incident.create({
            monitor: monitor._id,
            user: monitor.user,
            cause,
            details,
            resolved: false
          });
          
          // Set lastIncidentAt only when a new downtime incident occurs
          await Monitor.updateOne(
            { _id: monitor._id },
            {
              lastIncidentAt: new Date()
            }
          );

          // Get the fully populated monitor to access team ID
          const populatedMonitor = await Monitor.findById(monitor._id).populate('team');
          
          // Send notification to Slack if integration exists
          if (populatedMonitor && populatedMonitor.team) {
            const formattedMessage = `🚨 *INCIDENT ALERT* 🚨\n*Monitor:* ${monitor.url}\n*Issue:* ${cause}\n*Details:* ${details}\n*Time:* ${new Date().toLocaleString()}`;
            try {
              await sendSlackNotification(populatedMonitor.team, formattedMessage);
              console.log(`[testUrl] Slack notification sent for URL monitor ${monitor._id}`);
            } catch (slackError) {
              console.error(`[testUrl] Error sending Slack notification: ${slackError.message}`);
            }
          }
          
          console.log(`[testUrl] Updated lastIncidentAt for URL monitor ${monitor._id}`);
          sendAlerts(user.email, data);
          console.log(`[testUrl] Issued service down warning for URL monitor ${monitor._id}`);
        } else {
          // If there's already an unresolved incident for this monitor, just send an alert
          sendAlerts(user.email, data);
          console.log(`[testUrl] Repeated service down warning for URL monitor ${monitor._id}`);
        }
      } else {
        console.log(`[testUrl] Skipping incident creation for non-URL monitor (type: ${monitor.alertsTriggeredOn}) ${monitor._id}`);
      }
    }
  }
};

module.exports = testUrl;