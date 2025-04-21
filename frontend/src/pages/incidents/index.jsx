import React, { useState, useEffect } from "react";
import styles from "./incidents.module.scss";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import {AiFillWarning, AiOutlineEllipsis, AiOutlineSafety, AiOutlineEye, AiOutlineDelete, AiOutlineIssuesClose} from "react-icons/ai";
// import IncidentActionMenu from "./components/IncidentActionMenu";
import TableRowSkeletonLoaders from "@/components/TableRowSkeletonLoaders";
import {resolveIncident, deleteIncident, acknowledgeIncident} from "@/features/incidents/incidentSlice";
import { getIncidents, reset } from "@/features/incidents/incidentSlice";

const Incidents = () => {
  const [showMenu, setShowMenu] = useState(false);
  const dispatch = useDispatch();

  const { isLoading, isError, message, isSuccess, incidents } = useSelector(
    (state) => state.incident
  );

  useEffect(() => {
    dispatch(getIncidents());
    return () => dispatch(reset());
  }, []);

  function toggleActionsMenu(e) {
    e.stopPropagation();
    setShowMenu((prevState) => !prevState);
  }

  return (
    <div className={styles.incidents}>
      <h2 className={styles.title}>Incidents</h2>
      <div className={styles.incidents__table}>
        <table>
          <thead>
            <tr>
              <th>Monitor</th>
              <th>Started At</th>
              <th>Status</th>
              <th>Take Action</th>
            </tr>
          </thead>

          <tbody>
            {isSuccess && !incidents?.length && (
              <tr className={styles.emptyTable}><td>No incidents reported</td></tr>
            )}
            
            {isLoading ? <TableRowSkeletonLoaders /> : 
              incidents?.map((incident, index) => {
                return (
                  <tr key={index}>

                    <td className={styles.monitor}>
                      <div className={styles.iconWrapper}>
                        {!incident?.resolved ? (
                          <AiFillWarning color="#ff4242" />
                        ) : (
                          <AiOutlineSafety color="#16b846" />
                        )}
                      </div>
                      <div>
                        <p className={styles.url}>{incident?.monitor?.url}</p>
                        <p className={styles.cause}>{incident?.cause}</p>
                      </div>
                    </td>

                    <td>{moment(incident?.createdAt).format("MMMM Do YYYY, h:mm:ss a")}</td>

                    <td className={styles.currentStatus}>
                      <span
                        className={
                          incident?.resolved
                            ? styles.resolved
                            : incident?.acknowledged
                            ? styles.acknowledged
                            : ""
                        }
                      >
                        {incident?.resolved
                          ? "Resolved"
                          : incident?.acknowledged
                          ? "Acknowledged"
                          : "Ongoing"}
                      </span>
                    </td>

                    <td className={styles.actionMenuDotsTD}>
                      <div className={styles.actionMenuDots}>
                        {/* <AiOutlineEllipsis size="20px" /> */}
                        <span>
                          {incident?.resolved ? 
                            <div className={styles.menuItem} onClick={() => dispatch(deleteIncident(incident?._id))}>
                              <AiOutlineDelete size="15px" /> Remove
                            </div>
                            : incident?.acknowledged ? 
                            <div className={styles.menuItem} onClick={() => dispatch(resolveIncident(incident?._id))}>
                              <AiOutlineIssuesClose size="15px" /> Resolve
                            </div>
                            : 
                            <div className={styles.menuItem} onClick={() => dispatch(acknowledgeIncident(incident?._id))}>
                              <AiOutlineEye size="15px" /> Acknowledge
                            </div>
                          }
                        </span>
                      </div>
                    </td>

                  </tr>
                );
              })
            }
          
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Incidents;
