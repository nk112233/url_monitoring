const express = require("express");
const { 
  addMembers, 
  getAllMembers, 
  deleteMember,
  getInvitations,
  acceptInvitation,
  rejectInvitation
} = require("../controllers/teamController");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

// Member routes
router.post("/", protect, addMembers);
router.post("/delete", protect, deleteMember);
router.get("/:teamId", protect, getAllMembers);

// Invitation routes
router.get("/invitations", protect, getInvitations);
router.post("/invitations/accept/:id", protect, acceptInvitation);
router.post("/invitations/reject/:id", protect, rejectInvitation);

module.exports = router;
