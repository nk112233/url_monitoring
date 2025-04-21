import React from 'react';
import styles from './MemberCard.module.scss';
import { FaTrash } from 'react-icons/fa';
import Avatar from '../Avatar';

const MemberCard = ({ member, onRemove }) => {
  const { name, email, role, avatarUrl } = member;

  return (
    <div className={styles.memberCard}>
      <div className={styles.memberInfo}>
        <Avatar
          src={avatarUrl}
          alt={name}
          className={styles.avatar}
        />
        <div className={styles.details}>
          <h3>{name}</h3>
          <p className={styles.email}>{email}</p>
          <span className={styles.role}>{role}</span>
        </div>
      </div>
      
      <button 
        className={styles.removeButton}
        onClick={onRemove}
        title="Remove member"
      >
        <FaTrash />
      </button>
    </div>
  );
};

export default MemberCard; 