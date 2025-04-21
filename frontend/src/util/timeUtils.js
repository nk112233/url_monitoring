export const calculateUptime = (lastIncidentAt) => {
  if (!lastIncidentAt) {
    console.log('[calculateUptime] No lastIncidentAt provided');
    return "0 seconds";
  }
  
  const now = new Date();
  const lastIncident = new Date(lastIncidentAt);
  
  console.log('[calculateUptime] Current time:', now.toISOString());
  console.log('[calculateUptime] Last incident:', lastIncident.toISOString());
  
  if (isNaN(lastIncident.getTime())) {
    console.error('[calculateUptime] Invalid lastIncidentAt date:', lastIncidentAt);
    return "0 seconds";
  }
  
  const diffInMilliseconds = now - lastIncident;
  console.log('[calculateUptime] Difference in ms:', diffInMilliseconds);
  
  const days = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffInMilliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffInMilliseconds % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffInMilliseconds % (1000 * 60)) / 1000);
  
  console.log('[calculateUptime] Calculated:', { days, hours, minutes, seconds });
  
  let uptime = "";
  if (days > 0) uptime += `${days} days `;
  if (hours > 0) uptime += `${hours} hours `;
  if (minutes > 0) uptime += `${minutes} mins `;
  if (seconds > 0 || uptime === "") uptime += `${seconds} secs`;
  
  const result = uptime.trim();
  console.log('[calculateUptime] Final result:', result);
  return result;
};

export const getTimeAgo = (timestamp) => {
  if (!timestamp) {
    console.log('[getTimeAgo] No timestamp provided');
    return "Never";
  }
  
  const now = new Date();
  const time = new Date(timestamp);
  
  console.log('[getTimeAgo] Current time:', now.toISOString());
  console.log('[getTimeAgo] Target time:', time.toISOString());
  
  if (isNaN(time.getTime())) {
    console.error('[getTimeAgo] Invalid timestamp:', timestamp);
    return "Never";
  }
  
  const diffInSeconds = Math.floor((now - time) / 1000);
  console.log('[getTimeAgo] Difference in seconds:', diffInSeconds);
  
  let result;
  if (diffInSeconds < 5) result = "Just now";
  else if (diffInSeconds < 60) result = `${diffInSeconds} seconds ago`;
  else if (diffInSeconds < 3600) result = `${Math.floor(diffInSeconds / 60)} minutes ago`;
  else if (diffInSeconds < 86400) result = `${Math.floor(diffInSeconds / 3600)} hours ago`;
  else result = `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  console.log('[getTimeAgo] Final result:', result);
  return result;
}; 