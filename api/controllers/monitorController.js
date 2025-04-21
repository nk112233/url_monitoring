const Monitor = require("../models/monitorModel");
const Incident = require("../models/incidentModel");
const SSLCheck = require("../models/sslCheckModel");
const User = require('../models/userModel');
const asyncHandler = require("express-async-handler");
const testUrl = require("../utils/testUrl");
const { checkSSLDetails } = require("../services/puppeteer");
const checkDomainNameExpiry = require("../services/domainNameExpiry");
const domainNames = require("../models/domainNameCheckModel");
const sendDomainNameAlert = require("../utils/DomainNameAlerts");
const ResponseTime = require('../models/responseTimeModel');
const { sendSlackNotification } = require("../controllers/integrationController");


function isValidURL(str) {
  var pattern = new RegExp(
    "^(https?:\\/\\/)?" + // protocol
    "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
    "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
    "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
    "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
    "(\\#[-a-z\\d_]*)?$",
    "i"
  ); // fragment locator
  return !!pattern.test(str);
}

//@desc   Get Monitor
//@route  GET /api/v1/monitor/:id
//@access Private
const getMonitor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const monitor = await Monitor.findOne({ _id: id });
  console.log('Found monitor:', monitor);
  console.log('Monitor alertsTriggeredOn:', monitor.alertsTriggeredOn, 'type:', typeof monitor.alertsTriggeredOn);
  
  // Get SSL expiry info if it's an SSL monitor
  let expiryInfo = {};
  if (monitor.alertsTriggeredOn === 3) {
    const sslCheck = await SSLCheck.findOne({ monitor: id });
    console.log('SSL Check found:', sslCheck);
    if (sslCheck) {
      expiryInfo.validTo = sslCheck.validTo;
      expiryInfo.type = "ssl";
      console.log('SSL expiry info:', expiryInfo);
    }
  } else if (monitor.alertsTriggeredOn === 4) {
    const domainCheck = await domainNames.findOne({ monitor: id });
    console.log('Domain Check found:', domainCheck);
    if (domainCheck) {
      expiryInfo.validTo = domainCheck.expiryDate;
      expiryInfo.type = "domain";
      console.log('Domain expiry info:', expiryInfo);
    }
  }
  
  // Get response time metrics
  let responseTimeMetrics = {};
  try {
    // Get last 100 response times to calculate metrics
    const responseTimeData = await ResponseTime.find({ monitor: id })
      .sort({ createdAt: -1 })
      .limit(100);
      
    if (responseTimeData.length > 0) {
      const responseTimes = responseTimeData.map(record => record.responseTime);
      
      // Calculate metrics
      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      const minResponseTime = Math.min(...responseTimes);
      const maxResponseTime = Math.max(...responseTimes);
      
      // Calculate 90th percentile
      const sortedTimes = [...responseTimes].sort((a, b) => a - b);
      const percentile90Index = Math.floor(sortedTimes.length * 0.9);
      const percentile90 = sortedTimes[percentile90Index];
      
      // Get last 24 hours trend (hourly average)
      const last24Hours = new Date();
      last24Hours.setHours(last24Hours.getHours() - 24);
      
      const recentData = await ResponseTime.find({
        monitor: id,
        createdAt: { $gte: last24Hours }
      }).sort({ createdAt: 1 });
      
      // Ensure we have raw response time data for charts
      const responseTimeDataForChart = await ResponseTime.find({ monitor: id })
        .sort({ createdAt: -1 })
        .limit(50)
        .select('responseTime createdAt');
      
      responseTimeMetrics = {
        avgResponseTime,
        minResponseTime,
        maxResponseTime,
        percentile90,
        trend: recentData.slice(-10).map(record => record.responseTime),
        lastResponseTime: responseTimes[0],
        responseTimeData: responseTimeDataForChart // Add raw data for chart
      };
    }
  } catch (error) {
    console.error('Error fetching response time metrics:', error);
  }
  
  const response = { 
    ...monitor.toObject(), 
    expiryInfo,
    responseTimeMetrics 
  };
  
  console.log('Sending monitor with expiry info and metrics:', response);
  res.status(200).json(response);
});

//@desc   Get All Monitor
//@route  GET /api/v1/monitor
//@access Private
const getUserMonitors = asyncHandler(async (req, res) => {
  const allMonitors = await Monitor.find({ user: req.user._id });
  console.log('Found monitors:', allMonitors.length);
  
  // Get expiry info for all monitors
  const monitorsWithExpiry = await Promise.all(allMonitors.map(async (monitor) => {
    console.log('Processing monitor:', monitor._id, 'alertsTriggeredOn:', monitor.alertsTriggeredOn);
    let expiryInfo = {};
    if (monitor.alertsTriggeredOn === 3) {
      const sslCheck = await SSLCheck.findOne({ monitor: monitor._id });
      console.log(`SSL Check for monitor ${monitor._id}:`, sslCheck);
      if (sslCheck) {
        expiryInfo.validTo = sslCheck.validTo;
        expiryInfo.type = "ssl";
        console.log('Added SSL expiry info:', expiryInfo);
      }
    } else if (monitor.alertsTriggeredOn === 4) {
      const domainCheck = await domainNames.findOne({ monitor: monitor._id });
      console.log(`Domain Check for monitor ${monitor._id}:`, domainCheck);
      if (domainCheck) {
        expiryInfo.validTo = domainCheck.expiryDate;
        expiryInfo.type = "domain";
        console.log('Added domain expiry info:', expiryInfo);
      }
    }
    const monitorWithExpiry = { ...monitor.toObject(), expiryInfo };
    console.log(`Monitor ${monitor._id} with expiry:`, monitorWithExpiry);
    return monitorWithExpiry;
  }));

  console.log('Sending all monitors:', monitorsWithExpiry);
  res.status(200).json(monitorsWithExpiry);
});

//@desc   Delete Monitor
//@route  DELETE /api/v1/monitor/:id
//@access Private
const deleteMonitor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deletedMonitor = await Monitor.findOneAndDelete({ _id: id });
  await Incident.deleteMany({ monitor: id });
  await SSLCheck.findOneAndDelete({ monitor : id });
  await domainNames.findOneAndDelete({ monitor : id });

  res.status(200).json({ message: "Monitor deleted successfully", id: deletedMonitor._id });
});

//@desc   Add Monitor
//@route  POST /api/v1/monitor
//@access Private
const addMonitor = asyncHandler(async (req, res) => {
    const { url, user, team, alertsTriggeredOn, notifyExpiration } = req.body;

    if(!url || !user || !team){
        return res.status(400).json({ message: "Provide all required fields" });
    }
    if(!isValidURL(url)){
        return res.status(400).json({ message: "Invalid URL" });
    }
    //Looking for a duplicate url
    const existingMonitor = await Monitor.find({ url, user });

    if(existingMonitor.length > 0 && existingMonitor.some((monitor) => monitor.alertsTriggeredOn == alertsTriggeredOn)){
        return res.status(409).json({ message: "Monitor already present" });
    }

    try {
        // For SSL and Domain monitoring, perform checks before creating the monitor
        if(alertsTriggeredOn == "3"){
            // Check SSL first
            await checkSSLDetails(url, notifyExpiration);
        }
        else if(alertsTriggeredOn == "4"){
            // Check domain expiry first
            await checkDomainNameExpiry(url);
        }

        // Only create monitor if checks pass
        const createdMonitor = await Monitor.create(req.body);
        
        if(createdMonitor.alertsTriggeredOn == "1"){
            await testUrl(createdMonitor);
        }
        else if(alertsTriggeredOn == "3"){
            await checkSSLDetails(url, notifyExpiration, createdMonitor._id, user);
            
            // For SSL monitors, also send a Slack notification when an incident is created
            // Get SSL details to check days until expiry
            const sslDetails = await SSLCheck.findOne({ monitor: createdMonitor._id });
            if (sslDetails) {
                const today = new Date();
                const differenceInDays = Math.ceil((sslDetails.validTo - today) / (1000 * 60 * 60 * 24));
                
                if (differenceInDays <= parseInt(notifyExpiration)) {
                    // Get the populated monitor for the team
                    const populatedMonitor = await Monitor.findById(createdMonitor._id).populate('team');
                    
                    // Send Slack notification if team exists
                    if (populatedMonitor.team) {
                        const cause = `SSL certificate expires in ${differenceInDays} days`;
                        const details = `Your SSL certificate for ${url} will expire on ${sslDetails.validTo.toLocaleDateString()}`;
                        const formattedMessage = `🚨 *SSL CERTIFICATE ALERT* 🚨\n*Monitor:* ${url}\n*Issue:* ${cause}\n*Details:* ${details}\n*Time:* ${new Date().toLocaleString()}`;
                        
                        try {
                            console.log(`Sending Slack notification for new SSL monitor - Team ID: ${populatedMonitor.team}`);
                            await sendSlackNotification(populatedMonitor.team, formattedMessage);
                            console.log(`Slack notification sent for new SSL monitor ${createdMonitor._id}`);
                        } catch (slackError) {
                            console.error(`Error sending Slack notification for new SSL monitor: ${slackError.message}`);
                        }
                    }
                }
            }
        }
        else if(alertsTriggeredOn == "4"){
            //get the expiry date
            const expiryDate = await checkDomainNameExpiry(url);
            const newDomainNameCheck = new domainNames({
                monitor : createdMonitor._id,
                expiryDate,
                notifyExpiration
            });
            await newDomainNameCheck.save();
            //check if the expiry date is in notification period
            const today = new Date();
            const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
            if(daysLeft <= parseInt(notifyExpiration)){
                // Check for existing incidents first
                const existingIncident = await Incident.findOne({
                    monitor: createdMonitor._id,
                    cause: new RegExp(`Domain Name expires?\\s+in\\s+\\d+\\s+days?`, 'i')
                });

                if (!existingIncident) {
                    await Incident.create({
                        monitor: createdMonitor._id,
                        cause: `Domain Name expires in ${daysLeft} days`,
                        user: user,
                        resolved: false,
                        acknowledged: false,
                        lastAlertSent: new Date()
                    });

                    //send email alerts
                    const userData = await User.findById(user);
                    const data = {
                        firstName : userData.firstName,
                        monitorID : createdMonitor._id,
                        monitorURL : url,
                        expiryDays : daysLeft,
                        expiryDate: expiryDate
                    }
                    
                    // Get the fully populated monitor to send Slack notification
                    const populatedMonitor = await Monitor.findById(createdMonitor._id).populate('team');
                    
                    // Send Slack notification if team exists
                    if (populatedMonitor.team) {
                        const cause = `Domain Name expires in ${daysLeft} days`;
                        const details = `Your domain ${url} will expire on ${new Date(expiryDate).toLocaleDateString()}`;
                        const formattedMessage = `🚨 *DOMAIN EXPIRATION ALERT* 🚨\n*Monitor:* ${url}\n*Issue:* ${cause}\n*Details:* ${details}\n*Time:* ${new Date().toLocaleString()}`;
                        
                        try {
                            console.log(`Sending Slack notification for new domain monitor - Team ID: ${populatedMonitor.team}`);
                            await sendSlackNotification(populatedMonitor.team, formattedMessage);
                            console.log(`Slack notification sent for new domain monitor ${createdMonitor._id}`);
                        } catch (slackError) {
                            console.error(`Error sending Slack notification for new domain monitor: ${slackError.message}`);
                        }
                    }
                    
                    sendDomainNameAlert(userData.email, data);
                    console.log(`Issued domain name expiration warning for monitor ${createdMonitor._id}`);
                }
            }
        }

        res.status(201).json({ message: "Monitor created successfully" });
    } catch (error) {
        console.error('Error creating monitor:', error);
        let errorMessage = "Failed to create monitor";
        
        // Provide more specific error messages
        if (alertsTriggeredOn == "3") {
            errorMessage = "Could not verify SSL certificate. Please check if the URL has a valid SSL certificate.";
        } else if (alertsTriggeredOn == "4") {
            errorMessage = "Could not fetch domain expiry information. Please verify the domain name is correct.";
        }
        
        return res.status(400).json({ message: errorMessage });
    }
});

//@desc   Update Monitor
//@route  PATCH /api/v1/monitor/:id
//@access Private
const updateMonitor = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const updatedMonitor = await Monitor.findOneAndUpdate({ _id: id }, req.body, {
    new: true,
    runValidators: true,
  });

  if (!updatedMonitor) {
    return res.status(400).json({ message: "Monitor doesn't exists" });
  } else {
    return res.status(200).json({ message: "Monitor updated successfully" });
  }
});

module.exports = {
  getMonitor,
  getUserMonitors,
  deleteMonitor,
  addMonitor,
  updateMonitor,
};
