const asyncHandler = require("express-async-handler");
const Monitor = require("../models/monitorModel");
const Incident = require("../models/incidentModel");
const User = require("../models/userModel");
const ResponseTime = require("../models/responseTimeModel");
const { sendSlackNotification } = require('./integrationController');

//@desc   Get all incident of a user
//@route  GET /api/v1/incident
//@access Private
const getAllIncidents = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  // Get all incidents for this user, sorted by creation date (newest first)
  const allIncidents = await Incident.find({ user: userId })
    .populate({
      path: "monitor",
      select: "url team availability",
    })
    .sort({ createdAt: -1 });
  
  // Ensure SSL and Domain incidents are not auto-resolved
  for (const incident of allIncidents) {
    // Check if incident is for SSL or Domain but incorrectly marked as resolved
    const isSSL = incident.cause && incident.cause.match(/SSL certificate expires/i);
    const isDomain = incident.cause && incident.cause.match(/Domain Name expires/i);

    // If the incident was created with our new code it should follow the normal flow
    // Only reset if it's showing as resolved without following the workflow
    if ((isSSL || isDomain) && incident.resolved && !incident.acknowledged) {
      // Reset the status - should go through Acknowledge -> Resolve
      await Incident.findByIdAndUpdate(incident._id, {
        resolved: false,
        acknowledged: false
      });
      
      // Update in the response array as well
      incident.resolved = false;
      incident.acknowledged = false;
    }
  }

  res.status(200).json(allIncidents);
});

//@desc   Resolve an incident
//@route  PATCH /api/v1/incident/resolve
//@access Private
const resolveIncident = asyncHandler(async (req, res) => {
  const { incidentId } = req.params;
  
  try {
    const incident = await Incident.findById(incidentId).populate({
      path: "monitor",
      select: "url team"
    });
    
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }
    
    const updatedIncident = await Incident.findOneAndUpdate(
      { _id: incidentId },
      { resolved: true },
      { new: true }
    );
    
    // Send notification about resolution to Slack
    if (incident.monitor && incident.monitor.team) {
      const formattedMessage = `✅ *INCIDENT RESOLVED* ✅\n*Monitor:* ${incident.monitor.url}\n*Issue:* ${incident.cause}\n*Resolved at:* ${new Date().toLocaleString()}`;
      await sendSlackNotification(incident.monitor.team, formattedMessage);
    }
    
    res.status(200).json(updatedIncident);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//@desc   Acknowledge an incident
//@route  PATCH /api/v1/incident/acknowledge
//@access Private
const acknowledgeIncident = asyncHandler(async (req, res) => {
  const { incidentId } = req.params;
  const updatedIncident = await Incident.findOneAndUpdate(
    { _id: incidentId },
    { acknowledged: true },
    { new: true }
  );
  res.status(200).json(updatedIncident);
});

//@desc   Delete an incident
//@route  DELETE /api/v1/incident
//@access Private
const deleteIncident = asyncHandler(async (req, res) => {
  const { incidentId } = req.params;
  const deletedIncident = await Incident.findOneAndDelete({ _id: incidentId });
  res.status(200).json(deletedIncident);
});

//@desc   Get incident analytics with filtering options
//@route  GET /api/v1/incident/analytics
//@access Private
const getIncidentAnalytics = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { startDate, endDate, url } = req.query;
  
  // Build query filters
  const query = { user: userId };
  
  // Apply date range filter if provided
  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  // Get all incidents with filter
  const incidents = await Incident.find(query)
    .populate({
      path: "monitor",
      select: "url availability alertsTriggeredOn lastIncidentAt createdAt"
    })
    .sort({ createdAt: 1 });
  
  // Apply URL filter if provided
  let filteredIncidents = incidents;
  let urlResponseTime = null;
  let responseTimes = [];
  
  if (url) {
    filteredIncidents = incidents.filter(incident => 
      incident.monitor && incident.monitor.url && 
      incident.monitor.url.toLowerCase().includes(url.toLowerCase())
    );
    
    // Check if we're looking for an exact URL
    if (!url.includes('*') && !url.includes(',')) {
      // First, try to find the monitor by its URL directly - this will work even for monitors without incidents
      let monitorId = null;
      
      // Try finding the monitor directly by URL
      const monitor = await Monitor.findOne({ 
        url: { $regex: new RegExp(`^${url.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') },
        user: userId
      });
      
      if (monitor) {
        monitorId = monitor._id;
      } else {
        // Fallback to the old method - get monitor ID from filtered incidents
        const uniqueUrls = [...new Set(filteredIncidents
          .filter(i => i.monitor && i.monitor.url)
          .map(i => i.monitor.url))];
        
        if (uniqueUrls.length === 1) {
          monitorId = filteredIncidents.find(i => i.monitor && i.monitor.url === uniqueUrls[0])?.monitor._id;
        }
      }
      
      if (monitorId) {
        // Set up date range for response times
        const responseTimeQuery = { monitor: monitorId };
        
        if (startDate && endDate) {
          responseTimeQuery.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          };
        }
        
        // Fetch last 10 response times for the current status card
        const recentResponseTimes = await ResponseTime.find({ monitor: monitorId })
          .sort({ createdAt: -1 })
          .limit(10);
        
        if (recentResponseTimes.length > 0) {
          const avgResponseTime = recentResponseTimes.reduce((sum, record) => sum + record.responseTime, 0) / recentResponseTimes.length;
          urlResponseTime = avgResponseTime;
        }
        
        // Fetch response times for trend analysis
        // Limit to 500 records for performance, with even distribution if possible
        responseTimes = await ResponseTime.find(responseTimeQuery)
          .sort({ createdAt: -1 })
          .limit(500)
          .select('responseTime createdAt');
      }
    }
  }
  
  // Generate analytics data
  // Group incidents by day
  const incidentsByDay = {};
  const incidentsByCause = {};
  const incidentsByUrl = {};
  const resolutionTimes = [];
  
  // Group monitors for uptime calculation
  const monitorData = {};
  const uptimeByDate = {};
  
  filteredIncidents.forEach(incident => {
    // Skip if monitor is null (deleted monitors)
    if (!incident.monitor) return;
    
    // Group by day
    const date = new Date(incident.createdAt).toISOString().split('T')[0];
    if (!incidentsByDay[date]) {
      incidentsByDay[date] = 0;
    }
    incidentsByDay[date]++;
    
    // Group by cause
    if (!incidentsByCause[incident.cause]) {
      incidentsByCause[incident.cause] = 0;
    }
    incidentsByCause[incident.cause]++;
    
    // Group by URL
    const url = incident.monitor.url;
    if (!incidentsByUrl[url]) {
      incidentsByUrl[url] = 0;
    }
    incidentsByUrl[url]++;
    
    // Collect monitor data for uptime calculation
    if (!monitorData[url]) {
      monitorData[url] = {
        incidents: [],
        created: incident.monitor.createdAt,
        lastIncidentAt: incident.monitor.lastIncidentAt
      };
    }
    monitorData[url].incidents.push({
      date: date,
      createdAt: incident.createdAt,
      resolvedAt: incident.resolved ? incident.updatedAt : null
    });
    
    // Calculate resolution time for resolved incidents
    if (incident.resolved && incident.createdAt) {
      const createdAt = new Date(incident.createdAt);
      const updatedAt = new Date(incident.updatedAt);
      const resolutionTime = (updatedAt - createdAt) / (1000 * 60 * 60); // in hours
      resolutionTimes.push({
        url: incident.monitor.url,
        resolutionTime,
        date: date
      });
    }
  });
  
  // Calculate uptime percentages
  // Find the earliest monitor creation date to use as start date if not specified
  let monitorStartTimes = Object.values(monitorData)
    .filter(monitor => monitor.created) // Only include monitors with valid creation dates
    .map(monitor => new Date(monitor.created));
  
  // If no monitors found or no valid creation dates, default to a recent time (last 30 days)
  const defaultStartDate = new Date();
  defaultStartDate.setDate(defaultStartDate.getDate() - 30);
  
  const earliestMonitorDate = monitorStartTimes.length > 0 
    ? new Date(Math.min(...monitorStartTimes.map(date => date.getTime())))
    : defaultStartDate;
  
  // Use provided start date or earliest monitor creation date
  const startDateTime = startDate ? new Date(startDate) : earliestMonitorDate;
  const endDateTime = endDate ? new Date(endDate) : new Date(); // current date if not specified
  const totalPeriodHours = (endDateTime - startDateTime) / (1000 * 60 * 60);
  
  // Overall uptime calculation
  let totalDowntime = 0;
  
  // Calculate uptime by date
  const dates = [];
  let currentDate = new Date(startDateTime);
  
  // Generate array of all dates in the range
  while (currentDate <= endDateTime) {
    const dateStr = currentDate.toISOString().split('T')[0];
    dates.push(dateStr);
    uptimeByDate[dateStr] = 100; // Start with 100% uptime
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Calculate downtime for each monitor
  Object.keys(monitorData).forEach(monitorUrl => {
    const monitor = monitorData[monitorUrl];
    
    // Get monitor-specific start time - either global start time or monitor creation time if later
    const monitorStartTime = monitor.created 
      ? Math.max(new Date(monitor.created).getTime(), startDateTime.getTime())
      : startDateTime.getTime();
    
    // For each incident, calculate downtime
    monitor.incidents.forEach(incident => {
      // Skip incidents before the monitor was created or before the start date
      if (new Date(incident.createdAt) < new Date(monitorStartTime)) {
        return;
      }
      
      if (!incident.resolvedAt) {
        // If incident is not resolved, assume downtime until the end of period
        const downtimeHours = (endDateTime - new Date(incident.createdAt)) / (1000 * 60 * 60);
        totalDowntime += downtimeHours;
        
        // Update daily uptime - this is a simplification
        const incidentDate = incident.date;
        if (dates.includes(incidentDate)) {
          const hoursInDay = 24;
          const percentDownForDay = 100 * (downtimeHours / hoursInDay);
          uptimeByDate[incidentDate] = Math.max(0, uptimeByDate[incidentDate] - percentDownForDay);
        }
      } else {
        // Calculate actual downtime for resolved incidents
        const downtimeHours = (new Date(incident.resolvedAt) - new Date(incident.createdAt)) / (1000 * 60 * 60);
        totalDowntime += downtimeHours;
        
        // Update daily uptime
        const incidentDate = incident.date;
        if (dates.includes(incidentDate)) {
          const hoursInDay = 24;
          const percentDownForDay = 100 * (downtimeHours / hoursInDay);
          uptimeByDate[incidentDate] = Math.max(0, uptimeByDate[incidentDate] - percentDownForDay);
        }
      }
    });
  });
  
  // Calculate overall uptime percentage
  const overallUptime = totalPeriodHours > 0 ? 
    Math.max(0, Math.min(100, 100 * (1 - (totalDowntime / totalPeriodHours)))) : 100;
  
  // Generate summary
  const totalIncidents = filteredIncidents.length;
  const resolvedIncidents = filteredIncidents.filter(i => i.resolved).length;
  const acknowledgedIncidents = filteredIncidents.filter(i => i.acknowledged && !i.resolved).length;
  const pendingIncidents = filteredIncidents.filter(i => !i.acknowledged && !i.resolved).length;
  
  const avgResolutionTime = resolutionTimes.length > 0
    ? resolutionTimes.reduce((sum, item) => sum + item.resolutionTime, 0) / resolutionTimes.length
    : 0;
  
  // Generate summary text
  let summaryStartDate;
  if (startDate) {
    summaryStartDate = new Date(startDate).toLocaleDateString();
  } else {
    summaryStartDate = earliestMonitorDate.toLocaleDateString();
  }
  
  let summaryEndDate = endDate ? new Date(endDate).toLocaleDateString() : 'present';
  
  let summary = `From ${summaryStartDate} to ${summaryEndDate}, there were ${totalIncidents} incidents`;
  if (url) {
    summary += ` for URLs containing "${url}"`;
  }
  summary += `. ${resolvedIncidents} resolved, ${acknowledgedIncidents} acknowledged, and ${pendingIncidents} pending.`;
  
  if (resolutionTimes.length > 0) {
    summary += ` Average resolution time: ${avgResolutionTime.toFixed(2)} hours.`;
  }
  
  // Add uptime to summary
  summary += ` Overall uptime: ${overallUptime.toFixed(2)}%.`;
  
  // Most problematic URLs (top 3)
  const sortedUrls = Object.entries(incidentsByUrl)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  if (sortedUrls.length > 0) {
    summary += ` Most affected URLs: ${sortedUrls.map(([url, count]) => `${url} (${count})`).join(', ')}.`;
  }
  
  // Add urlResponseTime and responseTimes to the response
  res.status(200).json({
    incidents: filteredIncidents,
    incidentsByDay,
    incidentsByCause,
    incidentsByUrl,
    uptimeByDate,
    totalIncidents,
    resolvedIncidents,
    acknowledgedIncidents,
    pendingIncidents,
    overallUptime,
    avgResolutionTime,
    summary,
    dateRange: { start: summaryStartDate, end: summaryEndDate },
    urlResponseTime,
    responseTimes
  });
});

//@desc   Create a new incident
//@route  POST /api/v1/incident
//@access Private
const createIncident = asyncHandler(async (req, res) => {
  const { monitorId, cause, details } = req.body;

  try {
    // Find the monitor to get its team ID
    const monitor = await Monitor.findById(monitorId);
    if (!monitor) {
      return res.status(404).json({ message: 'Monitor not found' });
    }

    const incident = await Incident.create({
      monitor: monitorId,
      cause,
      details,
      user: req.user.id
    });

    // Send notification to Slack if integration exists
    const formattedMessage = `🚨 *INCIDENT ALERT* 🚨\n*Monitor:* ${monitor.url}\n*Issue:* ${cause}\n*Details:* ${details || 'No additional details'}\n*Time:* ${new Date().toLocaleString()}`;
    
    // Use the monitor's teamId to send the notification
    if (monitor.team) {
      await sendSlackNotification(monitor.team, formattedMessage);
    }

    res.status(201).json(incident);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = {
  getAllIncidents,
  resolveIncident,
  acknowledgeIncident,
  deleteIncident,
  getIncidentAnalytics,
  createIncident,
};
