import React from "react";
import styles from "./StatsCard.module.scss";

const StatsCard = ({ label, value }) => {
  return (
    <div className={styles.statsCard}>
      <div className={styles.statsCard_label}>{label}</div>
      <div className={styles.statsCard_value}>{value}</div>
    </div>
  );
};

export default StatsCard;
