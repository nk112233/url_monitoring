const cron = require("node-cron");
const asyncHandler = require("express-async-handler");
const axios = require('axios');
const Monitor = require("../models/monitorModel");
const testUrl = require("../utils/testUrl");

//function to check availability of websites
const scheduledAvailabilityCheck = asyncHandler(async() => {
    console.log("Running availability check...");

    const monitors = await Monitor.find({ active: true, alertsTriggeredOn: 1 })
    .select("url alertEmails userId alertsTriggeredOn")
    .populate({ path: "user", select: "firstName" });

    console.log(`Found ${monitors.length} active URL monitors to check`);

    for (const monitor of monitors) {
        await testUrl(monitor);
    }
});

//Run every minute
cron.schedule("* * * * *", () => {
    scheduledAvailabilityCheck().catch((error) => {
        console.error("Error in Availability check:", error);
    });
});

module.exports = {scheduledAvailabilityCheck};