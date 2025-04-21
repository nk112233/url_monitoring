import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import styles from "./Monitor.module.scss";
import { AiOutlineEllipsis, AiOutlineBell, AiOutlineBarChart } from "react-icons/ai";
import MonitorActionsMenu from "@/pages/monitors/components/MonitorActionsMenu";
import { calculateUptime } from "@/util/timeUtils";

const Monitor = ({ monitor, refreshMonitor }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showActions, setShowActions] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [uptime, setUptime] = useState('');

  useEffect(() => {
    console.log('[Monitor] Component mounted with monitor:', monitor);
    console.log('[Monitor] Expiry info:', monitor.expiryInfo);
    
    // Update time immediately
    updateUptime();
    
    const timerInterval = setInterval(() => {
      setCurrentTime(new Date());
      updateUptime();
    }, 1000); // Update every second

    return () => {
      console.log('[Monitor] Cleaning up timer for monitor:', monitor._id);
      clearInterval(timerInterval);
    };
  }, [monitor._id, monitor.lastIncidentAt, monitor.availability]);

  const updateUptime = () => {
    // Always calculate the duration since last incident
    const duration = calculateUptime(monitor.lastIncidentAt);
    
    const newUptime = monitor.availability 
      ? duration  // If up, show uptime
      : `Down for ${duration}`; // If down, show downtime
    
    setUptime(newUptime);
  };

  const formatExpiryDate = (date) => {
    console.log('[Monitor] Formatting expiry date:', date);
    if (!date) {
      console.log('[Monitor] No date provided');
      return '';
    }
    
    try {
      const expiryDate = new Date(date);
      console.log('[Monitor] Parsed expiry date:', expiryDate.toISOString());
      
      if (isNaN(expiryDate.getTime())) {
        console.log('[Monitor] Invalid date');
        return '';
      }
      
      const today = new Date();
      // Ensure both dates are in UTC and only consider full days
      const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
      const expiryUTC = Date.UTC(expiryDate.getUTCFullYear(), expiryDate.getUTCMonth(), expiryDate.getUTCDate());
      
      const daysLeft = Math.ceil((expiryUTC - todayUTC) / (1000 * 60 * 60 * 24));
      
      // Format the date in a clear, unambiguous format
      const formattedDate = expiryDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
      });
      
      const formattedString = daysLeft > 0 
        ? `Expires in ${daysLeft} days (${formattedDate})`
        : daysLeft === 0
          ? `Expires today (${formattedDate})`
          : `Expired ${Math.abs(daysLeft)} days ago (${formattedDate})`;
      
      console.log('[Monitor] Formatted date:', formattedString);
      return formattedString;
    } catch (error) {
      console.error('[Monitor] Error formatting date:', error);
      return '';
    }
  };

  const isExpired = () => {
    if (!monitor.expiryInfo?.validTo) return false;
    try {
      const expiryDate = new Date(monitor.expiryInfo.validTo);
      if (isNaN(expiryDate.getTime())) return false;
      
      const today = new Date();
      // Compare dates in UTC
      const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
      const expiryUTC = Date.UTC(expiryDate.getUTCFullYear(), expiryDate.getUTCMonth(), expiryDate.getUTCDate());
      
      return expiryUTC <= todayUTC;
    } catch (error) {
      console.error('[Monitor] Error checking expiry:', error);
      return false;
    }
  };

  const getMonitorStatus = () => {
    // For SSL and Domain monitoring, show appropriate status
    if (monitor.alertsTriggeredOn === 3 || monitor.alertsTriggeredOn === 4) {
      return isExpired() ? "Expired" : "Valid";
    }
    // For URL monitoring, show status code if available
    if (!monitor.availability && monitor.lastError) {
      return `Down (${monitor.lastError})`;
    }
    return monitor.availability ? "Up" : "Down";
  };

  function toggleActionsMenu(e) {
    e.stopPropagation();
    setShowActions((prevState) => !prevState);
  }
  
  const viewMonitorAnalytics = (e) => {
    e.stopPropagation();
    navigate(`/team/analytics?url=${encodeURIComponent(monitor.url)}`);
  };

  const handleClick = () => {
    // Disabled navigation to monitor details page
    // navigate(`/team/${monitor.team}/monitor/${monitor._id}`);
  };

  // Early check for expiry info
  const hasValidExpiryInfo = monitor.expiryInfo && monitor.expiryInfo.validTo;
  const status = getMonitorStatus();
  const statusClass = status === "Expired" ? styles.expired : 
                     status === "Valid" ? styles.valid :
                     status.startsWith("Down") ? styles.paused : 
                     styles.up;
  
  // Determine monitor border class based on status
  const monitorBorderClass = status === "Expired" ? styles.expired_monitor : 
                            status === "Valid" ? styles.valid_monitor :
                            status.startsWith("Down") ? styles.down_monitor : 
                            styles.up_monitor;
  
  return (
    <div 
      className={`${styles.monitor} ${monitorBorderClass} ${showActions ? styles.active_dropdown : ''}`} 
      onClick={handleClick}
    >
      <div className={styles.info}>
        <span
          className={
            status === "Up" || status === "Valid"
              ? `${styles.info_dot} ${styles.active}`
              : `${styles.info_dot} ${status === "Expired" ? styles.expired_dot : styles.paused}`
          }
        ></span>
        <div className={styles.info_url}>
          <p className={styles.url}>{monitor.url}</p>
          <p className={styles.status}>
            <span className={`${styles.status_text} ${statusClass}`}>
              {status}
            </span>
            {(status === "Up" || status === "Down") && `: ${uptime}`}
            {hasValidExpiryInfo && (
              <span className={styles.expiry_info}>
                {" · "}{formatExpiryDate(monitor.expiryInfo.validTo)}
              </span>
            )}
          </p>
        </div>
      </div>
      <div className={styles.actions}>
        <button 
          className={styles.analytics_button}
          onClick={viewMonitorAnalytics}
          title="View Analytics"
        >
          <AiOutlineBarChart size="16px" />
          <span>Analytics</span>
        </button>
        <div className={styles.purpose}>
          <AiOutlineBell />
          <p>
            {monitor.alertsTriggeredOn === 1
              ? "URL Monitoring"
              : monitor.alertsTriggeredOn === 3
              ? "SSL Monitoring"
              : monitor.alertsTriggeredOn === 4
              ? "Domain Name Monitoring"
              : "Unknown Monitoring"}
          </p>
        </div>
        <div
          className={`${styles.dots} hoverEffect`}
          onClick={toggleActionsMenu}
        >
          <AiOutlineEllipsis size="25px" />
        </div>
        {showActions && (
          <MonitorActionsMenu
            setShowActions={setShowActions}
            monitorId={monitor._id}
          />
        )}
      </div>
    </div>
  );
};

export default Monitor;
