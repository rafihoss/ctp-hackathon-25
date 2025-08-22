import React, { useState } from 'react';
import { Bar, Doughnut, Pie } from 'react-chartjs-2';
import { Zoom, RotateCcw, Download, Eye, EyeOff } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  zoomPlugin
);

const InteractiveGradeChart = ({ data, type = 'bar' }) => {
  const [chartType, setChartType] = useState(type);
  const [showLegend, setShowLegend] = useState(true);
  const [selectedGrades, setSelectedGrades] = useState(['A', 'B', 'C', 'D', 'F', 'W']);
  const [isZoomed, setIsZoomed] = useState(false);

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No data available for visualization
      </div>
    );
  }

  const gradeColors = {
    A: 'rgba(34, 197, 94, 0.8)',
    B: 'rgba(59, 130, 246, 0.8)',
    C: 'rgba(245, 158, 11, 0.8)',
    D: 'rgba(239, 68, 68, 0.8)',
    F: 'rgba(156, 39, 176, 0.8)',
    W: 'rgba(107, 114, 128, 0.8)'
  };

  const gradeLabels = {
    A: 'A Grades',
    B: 'B Grades',
    C: 'C Grades',
    D: 'D Grades',
    F: 'F Grades',
    W: 'Withdrawals'
  };

  const prepareChartData = () => {
    const filteredData = data.filter(item => selectedGrades.includes(item.name.split(' ')[0]));
    
    if (chartType === 'bar') {
      return {
        labels: filteredData.map(item => item.name),
        datasets: [
          {
            label: 'A Grades',
            data: filteredData.map(item => item.A),
            backgroundColor: gradeColors.A,
            borderColor: 'rgb(34, 197, 94)',
            borderWidth: 1
          },
          {
            label: 'B Grades',
            data: filteredData.map(item => item.B),
            backgroundColor: gradeColors.B,
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1
          },
          {
            label: 'C Grades',
            data: filteredData.map(item => item.C),
            backgroundColor: gradeColors.C,
            borderColor: 'rgb(245, 158, 11)',
            borderWidth: 1
          },
          {
            label: 'D Grades',
            data: filteredData.map(item => item.D),
            backgroundColor: gradeColors.D,
            borderColor: 'rgb(239, 68, 68)',
            borderWidth: 1
          },
          {
            label: 'F Grades',
            data: filteredData.map(item => item.F),
            backgroundColor: gradeColors.F,
            borderColor: 'rgb(156, 39, 176)',
            borderWidth: 1
          },
          {
            label: 'Withdrawals',
            data: filteredData.map(item => item.W),
            backgroundColor: gradeColors.W,
            borderColor: 'rgb(107, 114, 128)',
            borderWidth: 1
          }
        ]
      };
    } else {
      // For pie/doughnut charts, aggregate all data
      const aggregated = data.reduce((acc, item) => {
        acc.A += item.A;
        acc.B += item.B;
        acc.C += item.C;
        acc.D += item.D;
        acc.F += item.F;
        acc.W += item.W;
        return acc;
      }, { A: 0, B: 0, C: 0, D: 0, F: 0, W: 0 });

      return {
        labels: selectedGrades.map(grade => gradeLabels[grade]),
        datasets: [{
          data: selectedGrades.map(grade => aggregated[grade]),
          backgroundColor: selectedGrades.map(grade => gradeColors[grade]),
          borderColor: selectedGrades.map(grade => gradeColors[grade].replace('0.8', '1')),
          borderWidth: 2
        }]
      };
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151',
          filter: (legendItem, chartData) => {
            return selectedGrades.includes(legendItem.text.split(' ')[0]);
          }
        }
      },
      title: {
        display: true,
        text: 'Interactive Grade Distribution',
        color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#374151' : '#ffffff',
        titleColor: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151',
        bodyColor: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151',
        borderColor: document.documentElement.classList.contains('dark') ? '#6b7280' : '#d1d5db',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y || context.parsed;
            const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'xy'
        },
        zoom: {
          wheel: {
            enabled: true
          },
          pinch: {
            enabled: true
          },
          mode: 'xy'
        }
      }
    },
    scales: chartType === 'bar' ? {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Professor/Course',
          color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151'
        },
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151',
          maxRotation: 45
        },
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Grade Percentage',
          color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151'
        },
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#374151',
          callback: function(value) {
            return value + '%';
          }
        },
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb'
        }
      }
    } : undefined,
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  const handleGradeToggle = (grade) => {
    setSelectedGrades(prev => 
      prev.includes(grade) 
        ? prev.filter(g => g !== grade)
        : [...prev, grade]
    );
  };

  const resetZoom = () => {
    if (window.chartInstance) {
      window.chartInstance.resetZoom();
      setIsZoomed(false);
    }
  };

  const downloadChart = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'grade-distribution.png';
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const renderChart = () => {
    const chartData = prepareChartData();
    
    switch (chartType) {
      case 'bar':
        return <Bar data={chartData} options={chartOptions} />;
      case 'pie':
        return <Pie data={chartData} options={chartOptions} />;
      case 'doughnut':
        return <Doughnut data={chartData} options={chartOptions} />;
      default:
        return <Bar data={chartData} options={chartOptions} />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Chart Type Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Chart Type:</span>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="bar">Bar Chart</option>
              <option value="pie">Pie Chart</option>
              <option value="doughnut">Doughnut Chart</option>
            </select>
          </div>

          {/* Grade Filters */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Grades:</span>
            {Object.keys(gradeColors).map(grade => (
              <button
                key={grade}
                onClick={() => handleGradeToggle(grade)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  selectedGrades.includes(grade)
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {grade}
              </button>
            ))}
          </div>

          {/* Chart Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowLegend(!showLegend)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              title={showLegend ? 'Hide Legend' : 'Show Legend'}
            >
              {showLegend ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button
              onClick={resetZoom}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              title="Reset Zoom"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={downloadChart}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              title="Download Chart"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div style={{ height: '400px' }}>
          {renderChart()}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {selectedGrades.map(grade => {
          const total = data.reduce((sum, item) => sum + item[grade], 0);
          const percentage = data.reduce((sum, item) => {
            const itemTotal = item.A + item.B + item.C + item.D + item.F + item.W;
            return sum + (item[grade] / itemTotal) * 100;
          }, 0) / data.length;

          return (
            <div key={grade} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {gradeLabels[grade]}
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
                <div 
                  className="w-8 h-8 rounded-full"
                  style={{ backgroundColor: gradeColors[grade] }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InteractiveGradeChart;
