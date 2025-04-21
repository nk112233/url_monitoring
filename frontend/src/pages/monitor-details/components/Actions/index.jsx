import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import styles from "./Actions.module.scss";
import {
  AiOutlineDelete,
  AiOutlineWarning,
} from "react-icons/ai";
import { deleteMonitor } from "@/features/monitors/monitorSlice";
import Spinner from "@/components/Spinner";
import { toast } from "react-toastify";

const Actions = ({ monitorId }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this monitor?")) {
      setIsLoading(true);
      try {
        await dispatch(deleteMonitor(monitorId)).unwrap();
        setIsLoading(false);
        // Navigate to homepage after successful deletion
        navigate('/');
      } catch (error) {
        setIsLoading(false);
        toast.error(error || "Failed to delete monitor");
      }
    }
  };

  const navigateToIncidents = () => {
    navigate('/team/incidents');
  };

  return (
    <div className={styles.actions}>
      <div className={styles.action} onClick={navigateToIncidents}>
        <AiOutlineWarning />
        Incidents
      </div>
      <div className={styles.action} onClick={handleDelete}>
        {!isLoading ? (
          <>
            <AiOutlineDelete /> Delete
          </>
        ) : (
          <>
            <Spinner size="small" /> Deleting...
          </>
        )}
      </div>
    </div>
  );
};

export default Actions;
