import React, { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";

import styles from "./MonitorActionsMenu.module.scss";
import {
  AiOutlineDelete,
} from "react-icons/ai";

import { deleteMonitor } from "@/features/monitors/monitorSlice";
import Spinner from "@/components/Spinner";
import { useState } from "react";

const MonitorActionsMenu = ({ monitorId, setShowActions }) => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef(null);

  // Add click outside handler
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowActions(false);
      }
    }
    
    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);
    
    // Clean up
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setShowActions]);

  // Handle deleting the monitor
  const handleDelete = async (e) => {
    // Stop propagation to prevent parent onClick from triggering
    e.stopPropagation();
    
    if (window.confirm("Are you sure you want to delete this monitor?")) {
      setIsLoading(true);
      await dispatch(deleteMonitor(monitorId))
        .unwrap()
        .then(() => {
          setIsLoading(false);
          setShowActions(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    }
  };

  return (
    <div className={styles.monitorActionsMenu} ref={menuRef} onClick={(e) => e.stopPropagation()}>
      <div className={styles.menuItem} onClick={(e) => handleDelete(e)}>
        {!isLoading ? <AiOutlineDelete /> : <Spinner />} Remove
      </div>
    </div>
  );
};

export default MonitorActionsMenu;
