const mongoose = require("mongoose");
const { Schema } = mongoose;

const responseTimeSchema = new Schema(
  {
    monitor: {
      type: Schema.Types.ObjectId,
      ref: "Monitor",
      required: true,
    },
    responseTime: {
      type: Number,
      required: true,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ResponseTime", responseTimeSchema); 