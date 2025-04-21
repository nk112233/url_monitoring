import React, { useState, useEffect } from 'react';
import styles from './TeamMembers.module.scss';
import { FaUserPlus } from 'react-icons/fa';
import MemberCard from '../../components/MemberCard';
import InviteMemberModal from '../../components/InviteMemberModal';
import { useDispatch, useSelector } from 'react-redux';
import { getTeamMembers, removeMember } from '../../redux/slices/teamSlice';
import LoadingSkeleton from '../../components/LoadingSkeleton';

const TeamMembers = () => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const dispatch = useDispatch();
  const { members, isLoading, error } = useSelector((state) => state.team);

  useEffect(() => {
    dispatch(getTeamMembers());
  }, [dispatch]);

  const handleRemoveMember = (memberId) => {
    if (window.confirm('Are you sure you want to remove this team member?')) {
      dispatch(removeMember(memberId));
    }
  };

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.teamMembers}>
      <div className={styles.header}>
        <h1>Team Members</h1>
        <button 
          className={styles.inviteButton}
          onClick={() => setShowInviteModal(true)}
        >
          <FaUserPlus />
          <span>Invite Member</span>
        </button>
      </div>

      <div className={styles.membersGrid}>
        {isLoading ? (
          <LoadingSkeleton count={4} />
        ) : members.length > 0 ? (
          members.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              onRemove={() => handleRemoveMember(member.id)}
            />
          ))
        ) : (
          <div className={styles.emptyState}>
            <p>No team members yet</p>
            <button onClick={() => setShowInviteModal(true)}>
              Invite your first team member
            </button>
          </div>
        )}
      </div>

      {showInviteModal && (
        <InviteMemberModal
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  );
};

export default TeamMembers; 