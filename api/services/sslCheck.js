const cron = require("node-cron");
const asyncHandler = require("express-async-handler");
const SSLCheck = require("../models/sslCheckModel");
const Incident = require("../models/incidentModel");
const User = require('../models/userModel');
const Monitor = require('../models/monitorModel');
const sslAlerts = require("../utils/SSLalert");
const { sendSlackNotification } = require('../controllers/integrationController');

const scheduledSSLExpiryCheck = asyncHandler(async () => {
    console.log("Running SSL expiry check...");
    const sslRecords = await SSLCheck.find();
    const today = new Date();
    const millisecondsPerDay = 24 * 60 * 60 * 1000;

    for (const record of sslRecords) {
        const validTo = new Date(record.validTo);
        const differenceInTime = validTo.getTime() - today.getTime();
        const differenceInDays = Math.ceil(differenceInTime / millisecondsPerDay);
        //If SSL is expiring soon, log an incident
        if (differenceInDays <= parseInt(record.notifyExpiration)) {
            //send email alerts
            const monitorData = await Monitor.findById(record.monitor).populate('team');
            const user = await User.findById(monitorData.user);
            const data = {
                firstName : user.firstName,
                monitorID : record.monitor,
                monitorURL : monitorData.url,
                expiryDays : differenceInDays,
                expiryDate: validTo
            }
            const emailId = user.email;

            // Find any existing incidents for this monitor
            const existingIncident = await Incident.findOne({
                monitor: record.monitor,
                cause: new RegExp(`SSL certificate expires?\\s+in\\s+\\d+\\s+days?`, 'i')
            });

            if(!existingIncident){
                // Create new incident only if no existing incident (resolved or unresolved)
                const cause = `SSL certificate expires in ${differenceInDays} days`;
                const details = `Your SSL certificate for ${monitorData.url} will expire on ${validTo.toLocaleDateString()}`;
                
                const incident = await Incident.create({
                    monitor: record.monitor,
                    cause: cause,
                    details: details,
                    user: monitorData.user,
                    lastAlertSent: new Date(),
                    resolved: false,
                    acknowledged: false
                });
                
                // DIRECTLY replicating the URL monitor pattern
                // Get a fresh fully populated monitor to ensure team ID is correct
                const populatedMonitor = await Monitor.findById(record.monitor).populate('team');
                
                // Send notification to Slack if integration exists
                if (populatedMonitor.team) {
                    const formattedMessage = `🚨 *SSL CERTIFICATE ALERT* 🚨\n*Monitor:* ${monitorData.url}\n*Issue:* ${cause}\n*Details:* ${details}\n*Time:* ${new Date().toLocaleString()}`;
                    try {
                        console.log(`Attempting to send Slack notification - Monitor ID: ${record.monitor}, Team ID: ${populatedMonitor.team}`);
                        await sendSlackNotification(populatedMonitor.team, formattedMessage);
                        console.log(`Slack notification sent for SSL expiry - Monitor ID: ${record.monitor}`);
                    } catch (slackError) {
                        console.error(`Error sending Slack notification for SSL expiry: ${slackError.message}`);
                    }
                } else {
                    console.log(`No team found for monitor ${record.monitor} - cannot send SSL expiry Slack notification`);
                }
                
                sslAlerts(emailId, data);
                console.log(`SSL expiry warning for Monitor ID: ${record.monitor}`);
            }
            else if(!existingIncident.resolved) {
                // For testing: send alerts every 2 minutes instead of 3 hours
                const lastAlertSent = existingIncident.lastAlertSent || existingIncident.createdAt;
                const hoursSinceLastAlert = (today - new Date(lastAlertSent)) / (1000 * 60 * 60);
                
                if (hoursSinceLastAlert >= 0.03) { // About 2 minutes
                    await Incident.findByIdAndUpdate(existingIncident._id, {
                        lastAlertSent: new Date()
                    });
                    
                    // Also send Slack notifications for repeated alerts
                    if (monitorData.team) {
                        const cause = `SSL certificate expires in ${differenceInDays} days`;
                        const details = `Your SSL certificate for ${monitorData.url} will expire on ${validTo.toLocaleDateString()}`;
                        const formattedMessage = `🚨 *SSL CERTIFICATE ALERT* 🚨\n*Monitor:* ${monitorData.url}\n*Issue:* ${cause}\n*Details:* ${details}\n*Time:* ${new Date().toLocaleString()}`;
                        
                        try {
                            console.log(`Attempting to send repeated Slack notification for SSL - Monitor: ${monitorData.url}, Team ID: ${monitorData.team}`);
                            await sendSlackNotification(monitorData.team, formattedMessage);
                            console.log(`Repeated Slack notification sent for SSL - Monitor ID: ${record.monitor}`);
                        } catch (slackError) {
                            console.error(`Error sending repeated Slack notification for SSL: ${slackError.message}`);
                        }
                    }
                    
                    sslAlerts(emailId, data);
                    console.log(`Repeated SSL expiry warning for Monitor ID: ${record.monitor}`);
                }
            }
        }
    }
});

// Run once daily at midnight
// cron.schedule("0 0 * * *", () => {
    cron.schedule("*/2 * * * *", () => {
    scheduledSSLExpiryCheck().catch((error) => {
        console.error("Error in SSL expiry check:", error);
    });
});
// cron.schedule("*/2 * * * *", () => {

module.exports = { scheduledSSLExpiryCheck };
