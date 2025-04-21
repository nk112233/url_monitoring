const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integrationController');
const { protect } = require('../middleware/authMiddleware');

// Create a new Slack integration
router.post('/slack', protect, integrationController.createSlackIntegration);

// Get all integrations for a team
router.get('/team/:teamId', protect, integrationController.getTeamIntegrations);

// Update an integration
router.put('/slack/:integrationId', protect, integrationController.updateSlackIntegration);

// Delete an integration
router.delete('/slack/:integrationId', protect, integrationController.deleteSlackIntegration);

// Test an integration
router.post('/slack/:integrationId/test', protect, integrationController.testSlackIntegration);

module.exports = router; 