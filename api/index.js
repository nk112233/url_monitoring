const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const app = express();
const connectDB = require("./config/db");
connectDB(process.env.MONGO_URI);
const cors = require("cors");
const path = require('path');

//Imported routes
const monitorRoutes = require("./routes/monitorRoutes");
const authRoutes = require("./routes/authRoutes");
const incidentRoutes = require("./routes/incidentRoutes");
const checkRoutes = require("./routes/checkRoutes");
const memberRoutes = require("./routes/memberRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const invitationRoutes = require("./routes/invitationRoutes");
const integrationRoutes = require("./routes/integrationRoutes");

//import the cron jobs
require('./services/sslCheck');
require('./services/availabilityCheck');
require('./services/domainNameCheck');

//Middleware
app.use(express.json());

app.use(express.urlencoded({ extended: false }));

const PORT = process.env.PORT || 5000;

//Cors Configurations
app.use(cors({
origin: ["http://localhost:5173", "https://upguard.onrender.com"],
  credentials: true,
}));
app.use(cookieParser());

// Routes
app.use("/api/v1", authRoutes);
app.use("/api/v1/monitor", monitorRoutes);
app.use("/api/v1/incident", incidentRoutes);
app.use("/api/v1/check", checkRoutes);
app.use("/api/v1/member", memberRoutes);
app.use("/api/v1/notification", notificationRoutes);
app.use("/api/v1/invitation", invitationRoutes);
app.use("/api/v1/integration", integrationRoutes);

//CONNECTING TO THE DATABASE
mongoose.connection.once("open", async () => {
  console.log("connected to MongoDB");
  app.listen(PORT, () => console.log(`server running on port ${PORT}...`));
});

mongoose.connection.on("error", (err) => {
  console.log(err);
});
