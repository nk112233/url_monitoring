import React, { useState, useEffect } from "react";
import styles from "./integrations.module.scss";
import PageHeader from "@/components/PageHeader";
import slackIcon from "@/assets/images/slack.png";
import { useSelector } from "react-redux";
import { axiosPrivate } from "@/api/axios";
import { getbaseURL } from "@/util/getBaseUrl";
import { toast } from "react-toastify";

const Integrations = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [channelName, setChannelName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [integrations, setIntegrations] = useState([]);
  const [isLoadingIntegrations, setIsLoadingIntegrations] = useState(false);

  // Get user from auth state
  const { user } = useSelector((state) => state.auth);
  // Use a default team ID if no team is selected in the state
  const teamId = user?.teamId || user?.team;
  
  useEffect(() => {
    if (teamId) {
      fetchIntegrations();
    }
  }, [teamId]);
  
  const fetchIntegrations = async () => {
    if (!teamId) {
      return;
    }
    
    setIsLoadingIntegrations(true);
    try {
      const response = await axiosPrivate.get(`/integration/team/${teamId}`);
      setIntegrations(response.data);
    } catch (error) {
      console.error("Error fetching integrations:", error);
      toast.error(error.response?.data?.message || "Failed to load integrations");
    } finally {
      setIsLoadingIntegrations(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!teamId) {
      toast.error("No team associated with your account");
      return;
    }
    
    setIsLoading(true);
    
    try {
      await axiosPrivate.post(
        '/integration/slack',
        {
          teamId,
          webhookUrl,
          channelName
        }
      );
      
      toast.success("Slack integration added successfully!");
      setIsModalOpen(false);
      setWebhookUrl("");
      setChannelName("");
      fetchIntegrations();
    } catch (error) {
      console.error("Error adding Slack integration:", error);
      toast.error(error.response?.data?.message || "Failed to add Slack integration");
    } finally {
      setIsLoading(false);
    }
  };
  
  const deleteIntegration = async (integrationId) => {
    if (!confirm("Are you sure you want to remove this integration?")) return;
    
    try {
      await axiosPrivate.delete(`/integration/slack/${integrationId}`);
      toast.success("Integration removed successfully");
      fetchIntegrations();
    } catch (error) {
      console.error("Error removing integration:", error);
      toast.error(error.response?.data?.message || "Failed to remove integration");
    }
  };
  
  const testIntegration = async (integrationId) => {
    try {
      await axiosPrivate.post(`/integration/slack/${integrationId}/test`);
      toast.success("Test message sent successfully");
    } catch (error) {
      console.error("Error sending test message:", error);
      toast.error(error.response?.data?.message || "Failed to send test message");
    }
  };

  const renderNoTeamMessage = () => (
    <div className={styles.noTeam}>
      <h3>No Team Found</h3>
      <p>You need to be associated with a team before adding integrations.</p>
    </div>
  );

  const renderNotAuthenticatedMessage = () => (
    <div className={styles.noTeam}>
      <h3>Authentication Required</h3>
      <p>Please log in to manage integrations.</p>
    </div>
  );

  if (!user) {
    return (
      <div className={styles.integrations}>
        <PageHeader title="Integrations" />
        {renderNotAuthenticatedMessage()}
      </div>
    );
  }

  return (
    <div className={styles.integrations}>
      <PageHeader 
        title="Integrations" 
      />
      
      {!teamId ? (
        renderNoTeamMessage()
      ) : isLoadingIntegrations ? (
        <div className={styles.loading}>Loading integrations...</div>
      ) : (
        <div className={styles.integrations__wrapper}>
          {integrations.length === 0 ? (
            <div className={styles.integrations__card}>
              <div className={styles.content}>
                <div className={styles.logo}>
                  <img src={slackIcon} alt="slack" />
                </div>
                <div className={styles.text}>
                  <h5>Slack</h5>
                  <p>Send incident alerts to your Slack channel</p>
                </div>
              </div>
              <div className={styles.button}>
                <button onClick={() => setIsModalOpen(true)}>Add</button>
              </div>
            </div>
          ) : (
            integrations.map((integration) => (
              <div key={integration._id} className={styles.integrations__card}>
                <div className={styles.content}>
                  <div className={styles.logo}>
                    <img src={slackIcon} alt="slack" />
                  </div>
                  <div className={styles.text}>
                    <h5>Slack</h5>
                    <p>Channel: {integration.channelName}</p>
                    <p className={styles.status}>
                      Status: <span className={integration.isEnabled ? styles.active : styles.inactive}>
                        {integration.isEnabled ? "Active" : "Disabled"}
                      </span>
                    </p>
                  </div>
                </div>
                <div className={styles.actions}>
                  <button 
                    onClick={() => testIntegration(integration._id)}
                    className={styles.testButton}
                  >
                    Test
                  </button>
                  <button 
                    onClick={() => deleteIntegration(integration._id)}
                    className={styles.deleteButton}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      
      {isModalOpen && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Add Slack Integration</h2>
            <button className={styles.closeButton} onClick={() => setIsModalOpen(false)}>×</button>
            
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="webhookUrl">Slack Webhook URL</label>
                <input
                  type="text"
                  id="webhookUrl"
                  placeholder="https://hooks.slack.com/services/..."
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  required
                />
                <small>
                  <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener noreferrer">
                    Learn how to create a Slack webhook
                  </a>
                </small>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="channelName">Channel Name</label>
                <input
                  type="text"
                  id="channelName"
                  placeholder="#monitoring-alerts"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  required
                />
              </div>
              
              <div className={styles.formActions}>
                <button 
                  type="button" 
                  className={styles.cancelButton}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={isLoading}
                >
                  {isLoading ? "Adding..." : "Add Integration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Integrations;
