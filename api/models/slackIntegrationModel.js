const mongoose = require('mongoose');

const slackIntegrationSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    webhookUrl: {
      type: String,
      required: true,
    },
    channelName: {
      type: String,
      required: true,
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
    notifyIncidents: {
      type: Boolean,
      default: true,
    },
    notifyRecovery: {
      type: Boolean,
      default: true,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SlackIntegration', slackIntegrationSchema); 