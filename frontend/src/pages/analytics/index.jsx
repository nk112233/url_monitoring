import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getIncidentAnalytics, reset } from "@/features/incidents/incidentSlice";
import { Line, Bar, Pie, Scatter } from 'react-chartjs-2';
import ResponseTimeChart from '@/components/ResponseTimeChart';
import ResponseTimeMetricsChart from '@/components/ResponseTimeMetricsChart';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
  TimeScale,
  ScatterController
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import 'chartjs-adapter-date-fns'; // Import date adapter for time scale
import styles from './analytics.module.scss';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  TimeScale,
  ScatterController,
  Title,
  Tooltip,
  Legend,
  annotationPlugin,
  ChartDataLabels
);

const IncidentAnalytics = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  const { user } = useSelector((state) => state.auth);
  const { analytics, isLoading, isError, message } = useSelector((state) => state.incident);
  const { isDarkMode } = useSelector((state) => state.theme);
  
  // Parse URL parameters
  const queryParams = new URLSearchParams(location.search);
  const urlFromParams = queryParams.get('url') || '';
  
  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchUrl, setSearchUrl] = useState(urlFromParams);
  
  // Add timeline view state
  const [timelineView, setTimelineView] = useState('week'); // 'day', 'week', or 'month'
  
  // Set chart theme colors
  const chartColors = {
    lineColor: isDarkMode ? 'rgba(75, 192, 192, 0.8)' : 'rgb(75, 192, 192)',
    barColor: isDarkMode ? 'rgba(54, 162, 235, 0.8)' : 'rgba(54, 162, 235, 0.5)',
    barBorderColor: isDarkMode ? 'rgb(54, 162, 235)' : 'rgba(54, 162, 235, 1)',
    uptimeColor: isDarkMode ? 'rgba(16, 201, 122, 0.8)' : 'rgba(16, 201, 122, 0.5)',
    uptimeBorderColor: isDarkMode ? 'rgb(16, 201, 122)' : 'rgb(16, 180, 122)',
    pieColors: isDarkMode 
      ? ['rgba(75, 192, 192, 0.8)', 'rgba(255, 206, 86, 0.8)', 'rgba(255, 99, 132, 0.8)', 'rgba(153, 102, 255, 0.8)', 'rgba(255, 159, 64, 0.8)']
      : ['rgba(75, 192, 192, 0.5)', 'rgba(255, 206, 86, 0.5)', 'rgba(255, 99, 132, 0.5)', 'rgba(153, 102, 255, 0.5)', 'rgba(255, 159, 64, 0.5)'],
    gridColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    textColor: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
  };
  
  useEffect(() => {
    if (!user) {
      return navigate("/login");
    }
    
    // Load initial analytics data with URL parameter if available
    fetchAnalytics();
    
    return () => {
      dispatch(reset());
    };
  }, [user, navigate, dispatch, urlFromParams]);
  
  const fetchAnalytics = () => {
    const params = {
      userId: user.userId,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      url: searchUrl || undefined
    };
    
    dispatch(getIncidentAnalytics(params));
  };
  
  const handleFilter = (e) => {
    e.preventDefault();
    fetchAnalytics();
  };
  
  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setSearchUrl('');
    // Update URL without parameters
    navigate('/team/analytics');
    dispatch(getIncidentAnalytics({ userId: user.userId }));
  };
  
  // Prepare data for charts
  const prepareIncidentsByDayChart = () => {
    if (!analytics || !analytics.incidentsByDay) return null;
    
    const dates = Object.keys(analytics.incidentsByDay).sort();
    const counts = dates.map(date => analytics.incidentsByDay[date]);
    
    return {
      labels: dates,
      datasets: [
        {
          label: 'Incidents by Day',
          data: counts,
          fill: false,
          borderColor: chartColors.lineColor,
          tension: 0.1
        }
      ]
    };
  };
  
  const prepareIncidentsByCauseChart = () => {
    if (!analytics || !analytics.incidentsByCause) return null;
    
    const causes = Object.keys(analytics.incidentsByCause);
    const counts = causes.map(cause => analytics.incidentsByCause[cause]);
    
    return {
      labels: causes,
      datasets: [
        {
          label: 'Incidents by Cause',
          data: counts,
          backgroundColor: chartColors.pieColors,
          borderWidth: 1
        }
      ]
    };
  };
  
  const prepareIncidentsByUrlChart = () => {
    if (!analytics || !analytics.incidentsByUrl) return null;
    
    // Sort URLs by incident count (descending) and take top 5
    const sortedUrls = Object.entries(analytics.incidentsByUrl)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    const urls = sortedUrls.map(([url]) => url);
    const counts = sortedUrls.map(([, count]) => count);
    
    return {
      labels: urls,
      datasets: [
        {
          label: 'Incidents by URL',
          data: counts,
          backgroundColor: chartColors.barColor,
          borderColor: chartColors.barBorderColor,
          borderWidth: 1
        }
      ]
    };
  };
  
  const prepareIncidentStatusChart = () => {
    if (!analytics) return null;
    
    return {
      labels: ['Resolved', 'Acknowledged', 'Pending'],
      datasets: [
        {
          data: [
            analytics.resolvedIncidents || 0,
            analytics.acknowledgedIncidents || 0,
            analytics.pendingIncidents || 0
          ],
          backgroundColor: [
            chartColors.pieColors[0],
            chartColors.pieColors[1],
            chartColors.pieColors[2]
          ],
          borderWidth: 1
        }
      ]
    };
  };
  
  // Add a function to prepare the incident timeline chart
  const prepareIncidentTimelineChart = () => {
    if (!analytics || !analytics.incidents || analytics.incidents.length === 0) return null;
    
    // Sort incidents by creation date
    const sortedIncidents = [...analytics.incidents].sort((a, b) => 
      new Date(a.createdAt) - new Date(b.createdAt)
    );
    
    // For day view, filter to recent incidents only
    let filteredIncidents = sortedIncidents;
    let timeRangeStart, timeRangeEnd;
    
    // Set the current date as end by default
    timeRangeEnd = new Date();
    
    if (timelineView === 'day') {
      // Get incidents from the last 24 hours
      timeRangeStart = new Date();
      timeRangeStart.setDate(timeRangeStart.getDate() - 1);
      
      filteredIncidents = sortedIncidents.filter(incident => 
        new Date(incident.createdAt) > timeRangeStart
      );
      
      // If no incidents in the last day, fallback to the most recent incidents
      if (filteredIncidents.length === 0 && sortedIncidents.length > 0) {
        const mostRecentDate = new Date(sortedIncidents[sortedIncidents.length - 1].createdAt);
        timeRangeEnd = new Date(mostRecentDate);
        timeRangeEnd.setHours(23, 59, 59, 999);
        
        timeRangeStart = new Date(mostRecentDate);
        timeRangeStart.setDate(timeRangeStart.getDate() - 1);
        timeRangeStart.setHours(0, 0, 0, 0);
        
        filteredIncidents = sortedIncidents.filter(incident => 
          new Date(incident.createdAt) >= timeRangeStart && 
          new Date(incident.createdAt) <= timeRangeEnd
        );
      }
    } else if (timelineView === 'week') {
      // Get incidents from the last 7 days
      timeRangeStart = new Date();
      timeRangeStart.setDate(timeRangeStart.getDate() - 7);
      
      filteredIncidents = sortedIncidents.filter(incident => 
        new Date(incident.createdAt) > timeRangeStart
      );
      
      // If no incidents in the last week, fallback to the most recent incidents
      if (filteredIncidents.length === 0 && sortedIncidents.length > 0) {
        const mostRecentDate = new Date(sortedIncidents[sortedIncidents.length - 1].createdAt);
        timeRangeEnd = new Date(mostRecentDate);
        timeRangeEnd.setHours(23, 59, 59, 999);
        
        timeRangeStart = new Date(mostRecentDate);
        timeRangeStart.setDate(timeRangeStart.getDate() - 7);
        timeRangeStart.setHours(0, 0, 0, 0);
        
        filteredIncidents = sortedIncidents.filter(incident => 
          new Date(incident.createdAt) >= timeRangeStart && 
          new Date(incident.createdAt) <= timeRangeEnd
        );
      }
    } else if (timelineView === 'month') {
      // Get incidents from the last 30 days
      timeRangeStart = new Date();
      timeRangeStart.setDate(timeRangeStart.getDate() - 30);
      
      filteredIncidents = sortedIncidents.filter(incident => 
        new Date(incident.createdAt) > timeRangeStart
      );
      
      // If no incidents in the last month, fallback to the most recent 30 days with incidents
      if (filteredIncidents.length === 0 && sortedIncidents.length > 0) {
        const mostRecentDate = new Date(sortedIncidents[sortedIncidents.length - 1].createdAt);
        timeRangeEnd = new Date(mostRecentDate);
        timeRangeEnd.setHours(23, 59, 59, 999);
        
        timeRangeStart = new Date(mostRecentDate);
        timeRangeStart.setDate(timeRangeStart.getDate() - 30);
        timeRangeStart.setHours(0, 0, 0, 0);
        
        filteredIncidents = sortedIncidents.filter(incident => 
          new Date(incident.createdAt) >= timeRangeStart && 
          new Date(incident.createdAt) <= timeRangeEnd
        );
      }
    }
    
    // Save the time range for chart options
    const timeRange = {
      min: timeRangeStart,
      max: timeRangeEnd
    };
    
    // Group incidents by URL
    const incidentsByUrl = {};
    const urlColors = {};
    let colorIndex = 0;
    
    // Define a set of distinct colors for different URLs
    const urlColorPalette = [
      'rgba(54, 162, 235, 0.8)',
      'rgba(255, 99, 132, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(255, 206, 86, 0.8)',
      'rgba(153, 102, 255, 0.8)',
      'rgba(255, 159, 64, 0.8)',
      'rgba(201, 203, 207, 0.8)'
    ];
    
    // Group by URL and assign colors
    filteredIncidents.forEach(incident => {
      const url = incident.monitor ? incident.monitor.url : 'Unknown';
      
      if (!incidentsByUrl[url]) {
        incidentsByUrl[url] = [];
        urlColors[url] = urlColorPalette[colorIndex % urlColorPalette.length];
        colorIndex++;
      }
      
      incidentsByUrl[url].push({
        x: new Date(incident.createdAt),
        y: url,
        incident: incident
      });
    });
    
    // Prepare datasets for the chart
    const datasets = Object.keys(incidentsByUrl).map(url => {
      return {
        label: url,
        data: incidentsByUrl[url],
        backgroundColor: urlColors[url],
        borderColor: urlColors[url],
        borderWidth: 1,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointStyle: 'circle'  // Make points circular
      };
    });
    
    return {
      datasets,
      timeRange
    };
  };
  
  // Prepare data for response time chart
  const prepareResponseTimeChart = () => {
    if (!analytics || !analytics.responseTimes || analytics.responseTimes.length === 0) {
      return null;
    }
    
    // Return the response times array directly for use by the ResponseTimeChart component
    return analytics.responseTimes;
  };
  
  // Calculate response time metrics if data is available
  const calculateResponseTimeMetrics = () => {
    if (!analytics || !analytics.responseTimes || analytics.responseTimes.length === 0) {
      return null;
    }
    
    // Extract response time values
    const responseTimeValues = analytics.responseTimes.map(item => item.responseTime);
    
    // Calculate metrics
    const avgResponseTime = responseTimeValues.reduce((sum, val) => sum + val, 0) / responseTimeValues.length;
    const minResponseTime = Math.min(...responseTimeValues);
    const maxResponseTime = Math.max(...responseTimeValues);
    
    // Calculate 90th percentile
    const sortedTimes = [...responseTimeValues].sort((a, b) => a - b);
    const percentile90Index = Math.floor(sortedTimes.length * 0.9);
    const percentile90 = sortedTimes[percentile90Index];
    
    return {
      avgResponseTime,
      minResponseTime,
      maxResponseTime,
      percentile90
    };
  };
  
  // Chart options
  const commonOptions = {
    responsive: true,
    color: chartColors.textColor,
    scales: {
      x: {
        grid: {
          color: chartColors.gridColor,
        },
        ticks: {
          color: chartColors.textColor
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: chartColors.gridColor,
        },
        ticks: {
          precision: 0,
          color: chartColors.textColor
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: chartColors.textColor
        }
      },
      datalabels: {
        display: false
      }
    }
  };
  
  const lineOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: false
      }
    }
  };
  
  const barOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: false
      }
    }
  };
  
  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: chartColors.textColor
        }
      },
      title: {
        display: false
      },
      datalabels: {
        color: '#fff',
        font: {
          weight: 'bold',
          size: 12
        },
        formatter: (value, context) => {
          const dataArr = context.chart.data.datasets[0].data;
          const sum = dataArr.reduce((acc, val) => acc + val, 0);
          const percentage = (value * 100 / sum).toFixed(0);
          return percentage > 5 ? `${percentage}%` : '';
        }
      }
    }
  };
  
  // Chart options for incident timeline
  const timelineOptions = {
    responsive: true,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: timelineView === 'day' ? 'hour' : timelineView === 'week' ? 'day' : 'week',
          tooltipFormat: 'MMM d, yyyy HH:mm',
          displayFormats: {
            hour: 'HH:mm',
            day: 'MMM d',
            week: 'MMM d'
          }
        },
        grid: {
          color: chartColors.gridColor,
        },
        ticks: {
          color: chartColors.textColor
        },
        title: {
          display: true,
          text: 'Date & Time',
          color: chartColors.textColor
        }
      },
      y: {
        type: 'category',
        grid: {
          color: chartColors.gridColor,
        },
        ticks: {
          color: chartColors.textColor
        },
        title: {
          display: true,
          text: 'URLs',
          color: chartColors.textColor
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          title: function(context) {
            return 'Incident Details';
          },
          label: function(context) {
            const incident = context.raw.incident;
            return [
              `URL: ${context.dataset.label}`,
              `Time: ${new Date(incident.createdAt).toLocaleString()}`,
              `Cause: ${incident.cause}`,
              `Status: ${incident.resolved ? 'Resolved' : (incident.acknowledged ? 'Acknowledged' : 'Pending')}`
            ];
          }
        }
      },
      legend: {
        display: false
      },
      // Disable datalabels plugin for the timeline chart
      datalabels: {
        display: false
      }
    }
  };
  
  const getTimelineOptions = () => {
    const chartData = prepareIncidentTimelineChart();
    if (!chartData) return timelineOptions;
    
    // Apply min/max time from the filtered data
    const updatedOptions = {
      ...timelineOptions,
      scales: {
        ...timelineOptions.scales,
        x: {
          ...timelineOptions.scales.x,
          min: chartData.timeRange.min,
          max: chartData.timeRange.max
        }
      }
    };
    
    return updatedOptions;
  };
  
  if (isLoading) {
    return <div className={styles.loading}>Loading analytics...</div>;
  }
  
  if (isError) {
    return <div className={styles.error}>Error: {message}</div>;
  }
  
  return (
    <div className={styles.analytics}>
      <div className={styles.header}>
        <h1>Incident History & Analytics</h1>
        {searchUrl && (
          <div className={styles.filter_badge}>
            Filtered by URL: {searchUrl}
            <button className={styles.clear_filter} onClick={handleReset}>×</button>
          </div>
        )}
      </div>
      
      <div className={styles.filters}>
        <form onSubmit={handleFilter}>
          <div className={styles.filter_group}>
            <div className={styles.filter_item}>
              <label>Start Date</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
              />
            </div>
            
            <div className={styles.filter_item}>
              <label>End Date</label>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
              />
            </div>
            
            <div className={styles.filter_item}>
              <label>URL Search</label>
              <input 
                type="text" 
                placeholder="Filter by URL" 
                value={searchUrl} 
                onChange={(e) => setSearchUrl(e.target.value)} 
              />
            </div>
            
            <div className={styles.filter_buttons}>
              <button type="submit" className={styles.filter_button}>Apply Filters</button>
              <button type="button" onClick={handleReset} className={styles.reset_button}>Reset</button>
            </div>
          </div>
        </form>
      </div>
      
      {analytics && (
        <>
          <div className={styles.stats_grid}>
            <div className={styles.stat_card}>
              <h3>Total Incidents</h3>
              <div className={styles.stat_value}>{analytics.totalIncidents || 0}</div>
            </div>
            
            <div className={styles.stat_card}>
              <h3>Resolved</h3>
              <div className={styles.stat_value}>{analytics.resolvedIncidents || 0}</div>
            </div>
            
            <div className={styles.stat_card}>
              <h3>Acknowledged</h3>
              <div className={styles.stat_value}>{analytics.acknowledgedIncidents || 0}</div>
            </div>
            
            <div className={styles.stat_card}>
              <h3>Pending</h3>
              <div className={styles.stat_value}>{analytics.pendingIncidents || 0}</div>
            </div>
            
            {searchUrl && !searchUrl.includes('*') && !searchUrl.includes(',') && (
              <div className={styles.stat_card}>
                <h3>Response Time</h3>
                <div className={styles.stat_value}>
                  {analytics.urlResponseTime ? `${analytics.urlResponseTime.toFixed(2)}ms` : 'N/A'}
                </div>
              </div>
            )}
          </div>
          
          <div className={styles.charts}>
            <div className={styles.chart_container}>
              <div className={styles.chart_header}>
                <div className={styles.chart_title}>
                  Incident Timeline
                  {analytics.dateRange && (
                    <span className={styles.chart_subtitle}>
                      {timelineView === 'day' ? 'Last 24 Hours' : 
                       timelineView === 'week' ? 'Last 7 Days' : 'Last 30 Days'}
                    </span>
                  )}
                </div>
                <div className={styles.time_range_buttons}>
                  <button 
                    className={`${styles.time_button} ${timelineView === 'day' ? styles.active : ''}`}
                    onClick={() => setTimelineView('day')}
                  >
                    Day
                  </button>
                  <button 
                    className={`${styles.time_button} ${timelineView === 'week' ? styles.active : ''}`}
                    onClick={() => setTimelineView('week')}
                  >
                    Week
                  </button>
                  <button 
                    className={`${styles.time_button} ${timelineView === 'month' ? styles.active : ''}`}
                    onClick={() => setTimelineView('month')}
                  >
                    Month
                  </button>
                </div>
              </div>
              {prepareIncidentTimelineChart() ? (
                <Scatter data={prepareIncidentTimelineChart()} options={getTimelineOptions()} />
              ) : (
                <div className={styles.no_data_message}>
                  No incidents to display for the selected time period
                </div>
              )}
            </div>
            
            <div className={styles.chart_container}>
              <div className={styles.chart_title}>Incidents Over Time</div>
              {prepareIncidentsByDayChart() && (
                <Line data={prepareIncidentsByDayChart()} options={lineOptions} />
              )}
            </div>
            
            <div className={styles.chart_container}>
              <div className={styles.chart_title}>Top 5 URLs by Incident Count</div>
              {prepareIncidentsByUrlChart() && (
                <Bar data={prepareIncidentsByUrlChart()} options={barOptions} />
              )}
            </div>
            
            {/* Response Time Charts - Only show when URL is filtered and has data */}
            {searchUrl && !searchUrl.includes('*') && !searchUrl.includes(',') && analytics.responseTimes && analytics.responseTimes.length > 0 && (
              <>
                <div className={styles.chart_container}>
                  <div className={styles.chart_title}>Response Time Trend</div>
                  <ResponseTimeChart responseTimeData={prepareResponseTimeChart()} />
                </div>
                
                {calculateResponseTimeMetrics() && (
                  <div className={styles.chart_container}>
                    <div className={styles.chart_title}>Response Time Metrics</div>
                    <ResponseTimeMetricsChart 
                      avgResponseTime={calculateResponseTimeMetrics().avgResponseTime}
                      minResponseTime={calculateResponseTimeMetrics().minResponseTime}
                      maxResponseTime={calculateResponseTimeMetrics().maxResponseTime}
                      percentile90={calculateResponseTimeMetrics().percentile90}
                    />
                  </div>
                )}
              </>
            )}
            
            <div className={styles.charts_row}>
              <div className={styles.chart_container_half}>
                <div className={styles.chart_title}>Incidents by Cause</div>
                {prepareIncidentsByCauseChart() && (
                  <Pie data={prepareIncidentsByCauseChart()} options={pieOptions} />
                )}
              </div>
              
              <div className={styles.chart_container_half}>
                <div className={styles.chart_title}>Incidents by Status</div>
                {prepareIncidentStatusChart() && (
                  <Pie data={prepareIncidentStatusChart()} options={pieOptions} />
                )}
              </div>
            </div>
          </div>
          
          <div className={styles.incident_table}>
            <h2>Incident List</h2>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>URL</th>
                  <th>Cause</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {analytics.incidents && analytics.incidents.map((incident) => (
                  <tr key={incident._id}>
                    <td>{new Date(incident.createdAt).toLocaleString()}</td>
                    <td>{incident.monitor ? incident.monitor.url : 'Unknown'}</td>
                    <td>{incident.cause}</td>
                    <td>
                      {incident.resolved 
                        ? 'Resolved' 
                        : incident.acknowledged 
                          ? 'Acknowledged' 
                          : 'Pending'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default IncidentAnalytics; 