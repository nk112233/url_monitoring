import { axiosPrivate } from "@/api/axios";


const getAllMembers = async (teamId) => {
  const response = await axiosPrivate.get(`/member/${teamId}`);
  return response.data;
};

const inviteMember = async (memberDetails) => {
  const response = await axiosPrivate.post("/member", {
    teamId: memberDetails.teamId,
    senderId: memberDetails.senderId,
    memberEmail: memberDetails.memberEmail,
    senderName: memberDetails.senderName,
    teamName: memberDetails.teamName
  });
  return response.data;
};

const removeMember = async (memberDetails) => {
  const response = await axiosPrivate.post("/member/delete", {
    teamId: memberDetails.teamId,
    memberId: memberDetails.memberId,
    invitation: memberDetails.invitation
  });
  return response.data;
};

const memberService = {
  getAllMembers,
  inviteMember,
  removeMember
};

export default memberService;
