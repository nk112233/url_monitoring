import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ResponseTimeMetricsChart = ({ 
  avgResponseTime, 
  minResponseTime, 
  maxResponseTime, 
  percentile90
}) => {
  const labels = ['Response Time Metrics'];
  
  const data = {
    labels,
    datasets: [
      {
        label: 'Min Response Time',
        data: [minResponseTime],
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        borderWidth: 1
      },
      {
        label: 'Avg Response Time',
        data: [avgResponseTime],
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderWidth: 1
      },
      {
        label: 'Max Response Time',
        data: [maxResponseTime],
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderWidth: 1
      },
      {
        label: '90th Percentile',
        data: [percentile90],
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
        borderWidth: 1
      }
    ],
  };
  
  const options = {
    indexAxis: 'y',
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Response Time Metrics',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${Math.round(context.raw)}ms`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Response Time (ms)'
        }
      }
    }
  };
  
  return (
    <div style={{ width: '100%', height: '300px' }}>
      <Bar data={data} options={options} />
    </div>
  );
};

export default ResponseTimeMetricsChart; 