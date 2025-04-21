import React, { useState, useEffect } from 'react';
import styles from './InviteMemberModal.module.scss';
import { useDispatch, useSelector } from 'react-redux';
import { inviteMember } from '../../features/members/membersSlice';
import Modal from '../Modal';

const InviteMemberModal = ({ onClose }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { currentTeam } = useSelector((state) => state.teams);
  const { isLoading, isSuccess, isError, message } = useSelector((state) => state.members);
  
  const [formData, setFormData] = useState({
    memberEmail: '',
    role: 'member'
  });

  // Log data for testing
  useEffect(() => {
    console.log('Current User:', user);
    console.log('Current Team:', currentTeam);
  }, [user, currentTeam]);

  // Handle success/error states
  useEffect(() => {
    if (isSuccess) {
      onClose();
    }
  }, [isSuccess, onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Log the submission data
    const memberDetails = {
      teamId: currentTeam?._id,
      senderId: user?._id,
      memberEmail: formData.memberEmail,
      senderName: user?.name,
      teamName: currentTeam?.name,
      role: formData.role
    };

    console.log('Submitting member details:', memberDetails);

    // Validate required fields
    if (!memberDetails.teamId || !memberDetails.senderId || !memberDetails.memberEmail) {
      console.error('Missing required fields:', {
        teamId: !memberDetails.teamId,
        senderId: !memberDetails.senderId,
        memberEmail: !memberDetails.memberEmail
      });
      return;
    }

    try {
      await dispatch(inviteMember(memberDetails)).unwrap();
    } catch (err) {
      console.error('Invitation error:', err);
    }
  };

  return (
    <Modal onClose={onClose} title="Invite Team Member">
      <form onSubmit={handleSubmit} className={styles.form}>
        {isError && <div className={styles.error}>{message}</div>}
        
        <div className={styles.formGroup}>
          <label htmlFor="memberEmail">Email Address</label>
          <input
            type="email"
            id="memberEmail"
            name="memberEmail"
            value={formData.memberEmail}
            onChange={handleChange}
            placeholder="Enter email address"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="role">Role</label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className={styles.actions}>
          <button 
            type="button" 
            onClick={onClose}
            className={styles.cancelButton}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send Invitation'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default InviteMemberModal; 