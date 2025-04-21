const SlackIntegration = require('../models/slackIntegrationModel');
const Team = require('../models/teamModel');
const axios = require('axios');

// Create a new Slack integration
exports.createSlackIntegration = async (req, res) => {
  try {
    const { teamId, webhookUrl, channelName } = req.body;

    // Validate webhook URL
    if (!webhookUrl.startsWith('https://hooks.slack.com/services/')) {
      return res.status(400).json({ message: 'Invalid Slack webhook URL' });
    }

    // Check if team exists
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if an integration already exists for this team
    const existingIntegration = await SlackIntegration.findOne({ team: teamId });
    if (existingIntegration) {
      return res.status(400).json({ message: 'Slack integration already exists for this team' });
    }

    // Test the webhook by sending a test message
    try {
      await axios.post(webhookUrl, {
        text: `🔔 UptimeDock has been successfully connected to this channel. You will receive notifications here for your monitoring alerts.`,
      });
    } catch (error) {
      return res.status(400).json({ message: 'Failed to send test message to Slack. Please verify your webhook URL.' });
    }

    // Create the integration
    const slackIntegration = await SlackIntegration.create({
      team: teamId,
      webhookUrl,
      channelName,
    });

    res.status(201).json({
      message: 'Slack integration created successfully',
      integration: slackIntegration,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all Slack integrations for a team
exports.getTeamIntegrations = async (req, res) => {
  try {
    const { teamId } = req.params;
    
    const integrations = await SlackIntegration.find({ team: teamId });
    
    res.status(200).json(integrations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a Slack integration
exports.updateSlackIntegration = async (req, res) => {
  try {
    const { integrationId } = req.params;
    const updates = req.body;
    
    const integration = await SlackIntegration.findById(integrationId);
    if (!integration) {
      return res.status(404).json({ message: 'Slack integration not found' });
    }
    
    const updatedIntegration = await SlackIntegration.findByIdAndUpdate(
      integrationId,
      updates,
      { new: true }
    );
    
    res.status(200).json(updatedIntegration);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a Slack integration
exports.deleteSlackIntegration = async (req, res) => {
  try {
    const { integrationId } = req.params;
    
    const integration = await SlackIntegration.findById(integrationId);
    if (!integration) {
      return res.status(404).json({ message: 'Slack integration not found' });
    }
    
    await SlackIntegration.findByIdAndDelete(integrationId);
    
    res.status(200).json({ message: 'Slack integration deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Send a test message to Slack
exports.testSlackIntegration = async (req, res) => {
  try {
    const { integrationId } = req.params;
    
    const integration = await SlackIntegration.findById(integrationId);
    if (!integration) {
      return res.status(404).json({ message: 'Slack integration not found' });
    }
    
    await axios.post(integration.webhookUrl, {
      text: `🔔 Test notification from UptimeDock. Your Slack integration is working correctly!`,
    });
    
    res.status(200).json({ message: 'Test message sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Utility function to send notifications to Slack (to be used in incident controller)
exports.sendSlackNotification = async (teamId, message) => {
  try {
    console.log(`Looking up Slack integration for team ID: ${teamId}`);
    
    const integration = await SlackIntegration.findOne({ 
      team: teamId,
      isEnabled: true 
    });
    
    if (!integration) {
      console.log(`No Slack integration found for team ID: ${teamId} or integration is disabled`);
      return;
    }
    
    console.log(`Found Slack integration - sending message to webhook`);
    await axios.post(integration.webhookUrl, { text: message });
    console.log(`Successfully sent Slack message`);
  } catch (error) {
    console.error(`Error sending Slack notification: ${error.message}`);
    console.error(`Error details: ${JSON.stringify(error.response?.data || {})}`);
  }
}; 