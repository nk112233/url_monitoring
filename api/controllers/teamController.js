const Team = require("../models/teamModel");
const User = require("../models/userModel");
const Notification = require("../models/notificationModel");
const Invitation = require("../models/invitationModel");
const asyncHandler = require("express-async-handler");

//@desc   Add new members
//@route  POST /api/v1/member
//@access Private
const addMembers = asyncHandler(async (req, res) => {
  const { teamId, senderId, memberEmail, senderName, teamName } = req.body;

  // Verifying the user exists
  const foundUser = await User.findOne({ email: memberEmail });
  if (!foundUser) {
    return res.status(400).json({ message: "User does not exist" });
  }

  // Finding the related team
  const foundTeam = await Team.findOne({ _id: teamId }).populate({
    path: "admin",
    select: "email",
  });

  // Verifying the user is not already a member or an admin
  const isDuplicateEmail = foundTeam?.members.some(
    (user) => user.email === memberEmail
  );

  if (isDuplicateEmail || foundTeam.admin?.email === memberEmail) {
    return res.status(409).json({ message: "Member already exists" });
  }

  // Sending a notification to the invited member
  await Notification.create({
    sender: senderId,
    receiver: foundUser._id,
    message: `${senderName} invites you to join ${teamName}`,
  });

  // Sending the invitation to the member
  const invitation = await Invitation.create({
    sender: senderId,
    receiver: foundUser._id,
    teamId: teamId,
    status: 'pending'
  });

  // Updating the team with the new member
  await Team.updateOne(
    { _id: teamId },
    { $push: { members: { email: memberEmail, invitation: invitation._id, status: 'pending' } } }
  );

  return res.status(200).json({ message: "Invitation sent successfully" });
});

//@desc   Get all team members 
//@route  GET /api/v1/member/:teamId
//@access Private
const getAllMembers = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const allMembers = await Team.find({ _id: teamId }).select({
    members: 1,
    _id: 0,
  });
  res.status(200).json(allMembers);
});

//@desc   Delete a member along with the invitation
//@route  POST /api/v1/member/delete
//@access Private
const deleteMember = asyncHandler(async (req, res) => {
  const { teamId, memberId, invitation } = req.body;

  // Find and delete the team member
  await Team.findOneAndUpdate(
    { _id: teamId },
    { $pull: { members: { _id: memberId } } },
    { new: true }
  );

  if (invitation) {
    await Invitation.findByIdAndRemove(invitation);
  }

  return res.status(200).json({ message: 'Member deleted successfully', memberId });
});

//@desc   Get all invitations for a user
//@route  GET /api/v1/member/invitations
//@access Private
const getInvitations = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const invitations = await Invitation.find({ 
    receiver: userId,
    status: 'pending'
  })
  .populate('sender', 'name email')
  .populate('teamId', 'name');

  res.status(200).json(invitations);
});

//@desc   Accept an invitation
//@route  POST /api/v1/member/invitations/accept/:id
//@access Private
const acceptInvitation = asyncHandler(async (req, res) => {
  const invitationId = req.params.id;
  const userId = req.user.id;

  const invitation = await Invitation.findById(invitationId);
  if (!invitation) {
    return res.status(404).json({ message: "Invitation not found" });
  }

  if (invitation.receiver.toString() !== userId) {
    return res.status(403).json({ message: "Not authorized" });
  }

  // Update invitation status
  invitation.status = 'accepted';
  await invitation.save();

  // Update team member status
  await Team.updateOne(
    { 
      _id: invitation.teamId,
      "members.invitation": invitationId
    },
    { 
      $set: { "members.$.status": 'active' }
    }
  );

  // Create notification for team admin
  await Notification.create({
    sender: userId,
    receiver: invitation.sender,
    message: `${req.user.name} has accepted your team invitation`,
  });

  res.status(200).json({ message: "Invitation accepted successfully", invitationId });
});

//@desc   Reject an invitation
//@route  POST /api/v1/member/invitations/reject/:id
//@access Private
const rejectInvitation = asyncHandler(async (req, res) => {
  const invitationId = req.params.id;
  const userId = req.user.id;

  const invitation = await Invitation.findById(invitationId);
  if (!invitation) {
    return res.status(404).json({ message: "Invitation not found" });
  }

  if (invitation.receiver.toString() !== userId) {
    return res.status(403).json({ message: "Not authorized" });
  }

  // Update invitation status
  invitation.status = 'rejected';
  await invitation.save();

  // Remove member from team
  await Team.updateOne(
    { _id: invitation.teamId },
    { $pull: { members: { invitation: invitationId } } }
  );

  // Create notification for team admin
  await Notification.create({
    sender: userId,
    receiver: invitation.sender,
    message: `${req.user.name} has declined your team invitation`,
  });

  res.status(200).json({ message: "Invitation rejected successfully", invitationId });
});

module.exports = { 
  addMembers, 
  getAllMembers, 
  deleteMember,
  getInvitations,
  acceptInvitation,
  rejectInvitation
};
