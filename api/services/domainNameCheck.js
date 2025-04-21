const cron = require("node-cron");
const asyncHandler = require("express-async-handler");
const domainNames = require('../models/domainNameCheckModel');
const User = require('../models/userModel');
const Incident = require("../models/incidentModel");
const Monitor = require('../models/monitorModel');
const sendDomainNameAlert = require('../utils/DomainNameAlerts');
const { sendSlackNotification } = require('../controllers/integrationController');

const scheduledDomainNameExpiryCheck = asyncHandler(async() =>{
    console.log("Running scheduled Domain Name Expiry expiry check...");
    const domainNameRecords = await domainNames.find();
    console.log(`Found ${domainNameRecords.length} domain name records to check`);
    
    // Diagnostic - check monitor teams
    for(const record of domainNameRecords) {
        const monitorCheck = await Monitor.findById(record.monitor);
        if(monitorCheck) {
            console.log(`Monitor ${record.monitor} has team: ${monitorCheck.team ? monitorCheck.team : 'NO TEAM'}`);
        } else {
            console.log(`Monitor ${record.monitor} not found!`);
        }
    }
    
    const today = new Date();
    
    for(const record of domainNameRecords){
        const expiryDate = new Date(record.expiryDate);
        const daysLeft = Math.floor((expiryDate - today) / (1000 * 3600 * 24));
        
        if(daysLeft <= 30){
            const monitorData = await Monitor.findById(record.monitor).populate('team');
            const user = await User.findById(monitorData.user);
            
            const data = {
                firstName : user.firstName,
                monitorID : record.monitor,
                monitorURL : monitorData.url,
                expiryDays : daysLeft,
                expiryDate: record.expiryDate
            }
            const emailId = user.email;

            // Find any existing unresolved incidents for this monitor
            const existingIncident = await Incident.findOne({
                monitor: record.monitor,
                cause: new RegExp(`Domain Name expires?\\s+in\\s+\\d+\\s+days?`, 'i')
            });

            if(!existingIncident){
                // Create new incident only if no existing incident (resolved or unresolved)
                const cause = `Domain Name expires in ${daysLeft} days`;
                const details = `Your domain ${monitorData.url} will expire on ${new Date(record.expiryDate).toLocaleDateString()}`;
                
                const incident = await Incident.create({
                    monitor: record.monitor,
                    cause: cause,
                    details: details,
                    user: user._id,
                    lastAlertSent: new Date(),
                    resolved: false,
                    acknowledged: false
                });
                
                // DIRECTLY replicating the URL monitor pattern
                // Get a fresh fully populated monitor to ensure team ID is correct
                const populatedMonitor = await Monitor.findById(record.monitor).populate('team');
                
                // Send notification to Slack if integration exists
                if (populatedMonitor.team) {
                    const formattedMessage = `🚨 *DOMAIN EXPIRATION ALERT* 🚨\n*Monitor:* ${monitorData.url}\n*Issue:* ${cause}\n*Details:* ${details}\n*Time:* ${new Date().toLocaleString()}`;
                    try {
                        console.log(`Attempting to send Slack notification - Monitor ID: ${record.monitor}, Team ID: ${populatedMonitor.team}`);
                        await sendSlackNotification(populatedMonitor.team, formattedMessage);
                        console.log(`Slack notification sent for domain expiration - Monitor ID: ${record.monitor}`);
                    } catch (slackError) {
                        console.error(`Error sending Slack notification for domain expiration: ${slackError.message}`);
                    }
                } else {
                    console.log(`No team found for monitor ${record.monitor} - cannot send domain expiry Slack notification`);
                }
                
                sendDomainNameAlert(emailId, data);
                console.log(`Issued domain name expiration warning for monitor ${record.monitor}`);
            }
            else if(!existingIncident.resolved) {
                // For testing: send alerts every 2 minutes instead of 3 hours
                const lastAlertSent = existingIncident.lastAlertSent || existingIncident.createdAt;
                const hoursSinceLastAlert = (today - new Date(lastAlertSent)) / (1000 * 60 * 60);
                
                if (hoursSinceLastAlert >= 0.03) { // About 2 minutes
                    await Incident.findByIdAndUpdate(existingIncident._id, {
                        lastAlertSent: new Date()
                    });
                    
                    // Also get a fresh monitor instance for repeated Slack notifications
                    const populatedMonitor = await Monitor.findById(record.monitor).populate('team');
                    
                    // Send notification to Slack for repeated alerts too
                    if (populatedMonitor.team) {
                        const cause = `Domain Name expires in ${daysLeft} days`;
                        const details = `Your domain ${monitorData.url} will expire on ${new Date(record.expiryDate).toLocaleDateString()}`;
                        const formattedMessage = `🔄 *REPEATED DOMAIN ALERT* 🔄\n*Monitor:* ${monitorData.url}\n*Issue:* ${cause}\n*Details:* ${details}\n*Time:* ${new Date().toLocaleString()}`;
                        
                        try {
                            console.log(`Attempting to send repeated Slack notification - Monitor ID: ${record.monitor}, Team ID: ${populatedMonitor.team}`);
                            await sendSlackNotification(populatedMonitor.team, formattedMessage);
                            console.log(`Repeated Slack notification sent for domain - Monitor ID: ${record.monitor}`);
                        } catch (slackError) {
                            console.error(`Error sending repeated Slack notification for domain: ${slackError.message}`);
                        }
                    }
                    
                    sendDomainNameAlert(emailId, data);
                    console.log(`Repeated domain name expiration warning for monitor ${record.monitor}`);
                }
            }
        }
    }    
})

// Run once daily at midnight
// cron.schedule("0 0 * * *", () => {
    cron.schedule("*/2 * * * *", () => {
    scheduledDomainNameExpiryCheck().catch((error) => {
        console.error("Error in domain name expiry check:", error);
    });
});

// Note: Testing immediate run has been removed for production
// cron.schedule("*/2 * * * *", () => {
module.exports = { scheduledDomainNameExpiryCheck };
