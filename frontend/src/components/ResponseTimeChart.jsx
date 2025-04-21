import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ResponseTimeChart = ({ responseTimeData }) => {
  if (!responseTimeData || !responseTimeData.length) {
    return <div>No response time data available</div>;
  }

  // Sort data by timestamp
  const sortedData = [...responseTimeData].sort((a, b) => 
    new Date(a.createdAt) - new Date(b.createdAt)
  );

  // Get last 20 entries for the chart (or all if less than 20)
  const lastEntries = sortedData.slice(-20);
  
  // Format dates for x-axis labels
  const labels = lastEntries.map(entry => {
    const date = new Date(entry.createdAt);
    return `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  });
  
  // Prepare more detailed timestamps for tooltip and detailed view
  const formattedDates = lastEntries.map(entry => {
    const date = new Date(entry.createdAt);
    return date.toLocaleString();
  });

  // Response time values
  const responseTimeValues = lastEntries.map(entry => entry.responseTime);
  
  // Calculate moving averages for smoother line - with 2 decimal places
  const getMovingAverage = (data, windowSize) => {
    const result = [];
    for (let i = 0; i < data.length; i++) {
      const window = data.slice(
        Math.max(0, i - windowSize + 1),
        i + 1
      );
      const avg = window.reduce((sum, val) => sum + val, 0) / window.length;
      result.push(parseFloat(avg.toFixed(2)));
    }
    return result;
  };
  
  const avgValues = getMovingAverage(responseTimeValues, 3);
  
  // Chart data
  const data = {
    labels,
    datasets: [
      {
        label: 'Response Time (ms)',
        data: responseTimeValues,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        pointRadius: 3,
      },
      {
        label: 'Moving Average',
        data: avgValues,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderDash: [5, 5],
        pointRadius: 0,
        hidden: true  // Set to hidden by default
      }
    ],
  };
  
  // Chart options
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        onClick: (e, legendItem, legend) => {
          // Get the index of the clicked dataset
          const index = legendItem.datasetIndex;
          const ci = legend.chart;
          
          // Toggle visibility
          const meta = ci.getDatasetMeta(index);
          meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;
          
          // Update chart
          ci.update();
        }
      },
      title: {
        display: true,
        text: 'Response Time Trend',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            // Format to 2 decimal places for Moving Average, whole number for Response Time
            if (context.dataset.label === 'Moving Average') {
              return `${context.dataset.label}: ${context.raw.toFixed(2)}ms`;
            }
            return `${context.dataset.label}: ${Math.round(context.raw)}ms`;
          },
          title: function(tooltipItems) {
            // Use the formatted dates with India timezone for tooltips
            return formattedDates[tooltipItems[0].dataIndex];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Response Time (ms)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Time'
        }
      }
    }
  };
  
  return (
    <div style={{ width: '100%', height: '400px' }}>
      <Line data={data} options={options} />
    </div>
  );
};

export default ResponseTimeChart; 