import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import styles from "./monitors.module.scss";
import { getMonitors, reset } from "@/features/monitors/monitorSlice";
import { AiOutlineReload } from "react-icons/ai";

import Monitor from "@/pages/monitors/components/Monitor";
import NoMonitors from "./components/NoMonitors";
import MonitorSkeleton from "./components/MonitorSkeleton";

const Monitors = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const prevMonitorsRef = useRef();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { user } = useSelector((state) => state.auth);
  const { monitors, isLoading, isError, message, isSuccess } = useSelector(
    (state) => state.monitor
  );

  useEffect(() => {
    if (!user) {
      return navigate("/login");
    }

    if (isError) {
      console.log(message);
    }

    // Initial fetch
    dispatch(getMonitors());

    // Poll every 30 seconds instead of 60 seconds
    const pollInterval = setInterval(() => {
      dispatch(getMonitors());
    }, 30000);

    return () => {
      dispatch(reset());
      clearInterval(pollInterval);
    };
  }, [dispatch, navigate]);

  // Store previous monitors for comparison
  useEffect(() => {
    prevMonitorsRef.current = monitors;
  }, [monitors]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await dispatch(getMonitors());
    setTimeout(() => setIsRefreshing(false), 1000); // Minimum 1s animation
  };

  if (isLoading && (!monitors || monitors.length === 0)) {
    return (
      <div className={styles.monitors}>
        <MonitorSkeleton />
        <MonitorSkeleton />
        <MonitorSkeleton />
      </div>
    );
  }

  return (
    <div className={styles.monitors}>
      <div className={styles.monitors_head}>
        <div className={styles.monitors_head_left}>
          <h2>How are you today, {user.firstName}</h2>
          <button 
            onClick={handleRefresh} 
            className={`${styles.refresh_button} ${isRefreshing ? styles.spinning : ''}`}
            disabled={isRefreshing}
          >
            <AiOutlineReload size="20" />
          </button>
        </div>
        <div className={styles.monitors_head_right}>
          <button onClick={() => navigate("/team/create-monitor")}>
            Create monitor
          </button>
        </div>
      </div>
      {monitors?.length === 0 && isSuccess && <NoMonitors />}
      {monitors?.map((monitor) => (
        <Monitor 
          key={monitor._id} 
          monitor={monitor}
          refreshMonitor={handleRefresh}
        />
      ))}
    </div>
  );
};

export default Monitors;
