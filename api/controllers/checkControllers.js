const asyncHandler = require("express-async-handler");
const Monitor = require("../models/monitorModel");
const testUrl = require("../utils/testUrl");

//@desc   Check availability of the website
//@route  GET /api/v1/check
//@access Public
const availabilityCheck = asyncHandler(async (req, res) => {
  const monitors = await Monitor.find({ active: true })
    .select("url alertEmails  userId")
    .populate({ path: "user", select: "firstName" });

  for (const monitor of monitors) {
    await testUrl(monitor);
  }

  res.status(200).json({ message: "Success" });
});

module.exports = { availabilityCheck };
