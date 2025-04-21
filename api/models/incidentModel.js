const mongoose = require("mongoose");

const { Schema } = mongoose;

const incidentSchema = new Schema(
  {
    monitor: {
      type: Schema.Types.ObjectId,
      ref: "Monitor",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cause: {
      type: String,
      required: true,
    },
    acknowledged: {
      type: Boolean,
      default: false,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    lastAlertSent: {
      type: Date,
      default: Date.now,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Incident", incidentSchema);
