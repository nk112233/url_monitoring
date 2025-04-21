import React from "react";
import styles from "./Head.module.scss";

const Head = ({ monitor }) => {
  if (!monitor) return null;

  return (
    <div className={styles.head}>
      <div className={styles.head_indicator}>
        <span className={`${styles.status} ${monitor.availability ? styles.online : styles.offline}`}></span>
      </div>
      <div className={styles.head_details}>
        <div className={styles.head_details__url}>
          {monitor.url}
        </div>
        <div className={styles.head_details__uptime}>
          <span style={{color: monitor.availability ? 'green' : 'red'}}>
            {monitor.availability ? 'Up' : 'Down'}
          </span> · Checked every minute
        </div>
      </div>
    </div>
  );
};

export default Head;
