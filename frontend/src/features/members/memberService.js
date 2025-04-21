import axios from "axios";
import { getBaseUrl } from "@/util/getBaseUrl";

const API_URL = `${getBaseUrl()}/api/v1/member`;

// Add new team member
const addMember = async (memberData) => {
  const token = JSON.parse(localStorage.getItem("token"));
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.post(API_URL, memberData, config);
  return response.data;
};

// Get team members
const getMembers = async (teamId) => {
  const token = JSON.parse(localStorage.getItem("token"));
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.get(`${API_URL}/${teamId}`, config);
  return response.data;
};

// Delete team member
const deleteMember = async (memberData) => {
  const token = JSON.parse(localStorage.getItem("token"));
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.post(`${API_URL}/delete`, memberData, config);
  return response.data;
};

// Get invitations
const getInvitations = async () => {
  const token = JSON.parse(localStorage.getItem("token"));
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.get(`${API_URL}/invitations`, config);
  return response.data;
};

// Accept invitation
const acceptInvitation = async (invitationId) => {
  const token = JSON.parse(localStorage.getItem("token"));
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.post(`${API_URL}/invitations/accept/${invitationId}`, {}, config);
  return response.data;
};

// Reject invitation
const rejectInvitation = async (invitationId) => {
  const token = JSON.parse(localStorage.getItem("token"));
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.post(`${API_URL}/invitations/reject/${invitationId}`, {}, config);
  return response.data;
};

const memberService = {
  addMember,
  getMembers,
  deleteMember,
  getInvitations,
  acceptInvitation,
  rejectInvitation,
};

export default memberService; 