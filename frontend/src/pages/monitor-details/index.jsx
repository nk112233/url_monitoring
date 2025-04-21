import BackButton from "@/components/BackButton";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getMonitor } from "@/features/monitors/monitorSlice";
import Actions from "./components/Actions";
import Head from "./components/Head";
import StatsCard from "./components/StatsCard";
import styles from "./monitor-details.module.scss";
import { calculateUptime, getTimeAgo } from "@/util/timeUtils";
import ResponseTimeChart from '../../components/ResponseTimeChart';
import ResponseTimeMetricsChart from '../../components/ResponseTimeMetricsChart';

const MonitorDetails = () => {
  const { monitorID } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentMonitor, isLoading } = useSelector((state) => state.monitor);
  const { user } = useSelector((state) => state.auth);
  const [hasResponseMetrics, setHasResponseMetrics] = useState(false);

  useEffect(() => {
    // Initial fetch
    dispatch(getMonitor(monitorID));

    // Poll every 5 seconds
    const pollInterval = setInterval(() => {
      dispatch(getMonitor(monitorID));
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [dispatch, monitorID]);

  useEffect(() => {
    // Check if monitor has response time metrics
    if (currentMonitor?.responseTimeMetrics) {
      // Check if there's actual response time data
      const { responseTimeMetrics } = currentMonitor;
      if (responseTimeMetrics.avgResponseTime !== undefined) {
        setHasResponseMetrics(true);
      } else {
        setHasResponseMetrics(false);
      }
    } else {
      setHasResponseMetrics(false);
    }
  }, [currentMonitor]);

  if (!currentMonitor) {
    return <div className={styles.loading}>Loading monitor details...</div>;
  }
  
  const viewMonitorAnalytics = () => {
    if (!currentMonitor?.url) return;
    
    // Navigate to analytics with URL filter pre-set
    navigate(`/team/analytics?url=${encodeURIComponent(currentMonitor.url)}`);
  };

  const uptimeValue = currentMonitor.availability 
    ? calculateUptime(currentMonitor.lastIncidentAt)
    : "Currently Down";

  const lastCheckedValue = currentMonitor.updatedAt 
    ? getTimeAgo(currentMonitor.updatedAt)
    : "Never";

  // Format response time values
  const formatResponseTime = (value) => {
    if (value === undefined || value === null) return 'N/A';
    return `${Math.round(value)}ms`;
  };

  const isSSLorDomainMonitor = 
    currentMonitor.alertsTriggeredOn === 3 || 
    currentMonitor.alertsTriggeredOn === 4;

  return (
    <div className={styles.monitorDetails}>
      <BackButton />
      <div className={styles.monitorDetails_header}>
        <Head monitor={currentMonitor} />
        <button 
          className={styles.analytics_button}
          onClick={viewMonitorAnalytics}
        >
          View Analytics
        </button>
      </div>
      <Actions monitorId={monitorID} />
      
      <h3 className={styles.sectionTitle}>Status Information</h3>
      <div className={styles.monitorDetails_stats}>
        {!isSSLorDomainMonitor && (
          <StatsCard 
            label="Uptime" 
            value={uptimeValue}
          />
        )}
        <StatsCard 
          label="Last checked" 
          value={lastCheckedValue}
        />
        <StatsCard 
          label="Incidents" 
          value={currentMonitor.incidents?.length || 0}
        />
      </div>
      
      {hasResponseMetrics && !isSSLorDomainMonitor && (
        <>
          <h3 className={styles.sectionTitle}>Performance Metrics</h3>
          <div className={styles.monitorDetails_stats}>
            <StatsCard 
              label="Avg. Response Time" 
              value={formatResponseTime(currentMonitor.responseTimeMetrics.avgResponseTime)}
            />
            <StatsCard 
              label="Min Response Time" 
              value={formatResponseTime(currentMonitor.responseTimeMetrics.minResponseTime)}
            />
            <StatsCard 
              label="Max Response Time" 
              value={formatResponseTime(currentMonitor.responseTimeMetrics.maxResponseTime)}
            />
          </div>
          <div className={styles.monitorDetails_stats}>
            <StatsCard 
              label="90th Percentile" 
              value={formatResponseTime(currentMonitor.responseTimeMetrics.percentile90)}
            />
            <StatsCard 
              label="Last Response Time" 
              value={formatResponseTime(currentMonitor.responseTimeMetrics.lastResponseTime)}
            />
          </div>
          
          {/* Response Time Charts */}
          <div className={styles.chartsContainer}>
            <div className={styles.chart}>
              <h3 className={styles.chartTitle}>Response Time Trend</h3>
              <ResponseTimeChart 
                responseTimeData={currentMonitor.responseTimeMetrics.responseTimeData || []} 
              />
            </div>
            
            <div className={styles.chart}>
              <h3 className={styles.chartTitle}>Response Time Metrics</h3>
              <ResponseTimeMetricsChart 
                avgResponseTime={currentMonitor.responseTimeMetrics.avgResponseTime}
                minResponseTime={currentMonitor.responseTimeMetrics.minResponseTime}
                maxResponseTime={currentMonitor.responseTimeMetrics.maxResponseTime}
                percentile90={currentMonitor.responseTimeMetrics.percentile90}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MonitorDetails;
