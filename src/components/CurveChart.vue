<template>
  <div class="chart-container w-full max-w-full md:max-w-2xl mx-auto p-4">
    <canvas ref="chartRef" class="w-full h-auto"></canvas>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import Chart from 'chart.js/auto';
import sensorManager from '../services/sensorManager';

export default {
  name: 'CurveChart',
  props: {
    chartData: {
      type: Object,
      required: true
    },
    chartOptions: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props) {
    const chartRef = ref(null);
    let chartInstance = null;
    let intervalId = null;

    // Smoke level thresholds
    const smokeLevelThresholds = {
      low: 30,
      medium: 60,
      high: 90
    };

    // Initialize chart
    onMounted(() => {
      const ctx = chartRef.value.getContext('2d');
      
      // Initialize with a non-reactive copy of chartData
      const initialData = JSON.parse(JSON.stringify(props.chartData && props.chartData.datasets && props.chartData.datasets[0]
        ? props.chartData
        : {
            labels: [],
            datasets: [
              {
                label: 'Temperature (°C)',
                data: [],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true
              },
              {
                label: 'Smoke Level (%)',
                data: [],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true
              }
            ]
          }));

      // Add smoke level threshold annotations
      const options = {
        ...props.chartOptions,
        plugins: {
          ...props.chartOptions.plugins,
          annotation: {
            annotations: {
              lowThreshold: {
                type: 'line',
                yMin: smokeLevelThresholds.low,
                yMax: smokeLevelThresholds.low,
                borderColor: '#10b981',
                borderWidth: 2,
                borderDash: [5, 5],
                label: {
                  content: 'Low',
                  enabled: true,
                  position: 'start'
                }
              },
              mediumThreshold: {
                type: 'line',
                yMin: smokeLevelThresholds.medium,
                yMax: smokeLevelThresholds.medium,
                borderColor: '#f59e0b',
                borderWidth: 2,
                borderDash: [5, 5],
                label: {
                  content: 'Medium',
                  enabled: true,
                  position: 'start'
                }
              },
              highThreshold: {
                type: 'line',
                yMin: smokeLevelThresholds.high,
                yMax: smokeLevelThresholds.high,
                borderColor: '#ef4444',
                borderWidth: 2,
                borderDash: [5, 5],
                label: {
                  content: 'High',
                  enabled: true,
                  position: 'start'
                }
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          },
          x: {
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          }
        }
      };

      chartInstance = new Chart(ctx, {
        type: 'line',
        data: initialData,
        options: options
      });

      // Register sensors if not already registered
      if (!sensorManager.getLatestReading('temperature')) {
        sensorManager.registerSensor('temperature', 'temperature', { location: 'chamber' });
      }
      if (!sensorManager.getLatestReading('smokeLevel')) {
        sensorManager.registerSensor('smokeLevel', 'smokeLevel', { location: 'chamber' });
      }

      // Set up sensor callbacks
      sensorManager.onSensorUpdate('temperature', (reading, timestamp) => {
        updateChartData('temperature', reading, timestamp);
      });

      sensorManager.onSensorUpdate('smokeLevel', (reading, timestamp) => {
        updateChartData('smokeLevel', reading, timestamp);
      });

      // Start data collection
      sensorManager.startDataCollection();
    });

    // Clean up on component unmount
    onUnmounted(() => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (chartInstance) {
        chartInstance.destroy();
      }
      // Remove sensor callbacks
      sensorManager.removeSensorCallback('temperature');
      sensorManager.removeSensorCallback('smokeLevel');
      // Stop data collection
      sensorManager.stopDataCollection();
    });

    // Update chart data when new sensor readings arrive
    const updateChartData = (sensorType, reading, timestamp) => {
      if (!chartInstance) return;

      const newLabel = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const datasetIndex = sensorType === 'temperature' ? 0 : 1;

      // Create a non-reactive copy of current data
      const newData = JSON.parse(JSON.stringify(chartInstance.data));
      
      // Update the appropriate dataset
      newData.datasets[datasetIndex].data.push(reading);
      newData.labels.push(newLabel);

      // Keep only the last 24 points
      if (newData.datasets[datasetIndex].data.length > 24) {
        newData.datasets[datasetIndex].data.shift();
        newData.labels.shift();
      }

      // Update chart
      chartInstance.data = newData;
      chartInstance.update({
        duration: 800,
        easing: 'easeInOutQuad'
      });
    };

    // Watch for prop changes
    watch(() => props.chartData, (newData) => {
      if (chartInstance && newData) {
        const nonReactiveData = JSON.parse(JSON.stringify(newData));
        chartInstance.data = nonReactiveData;
        chartInstance.update({
          duration: 800,
          easing: 'easeInOutQuad'
        });
      }
    });

    return {
      chartRef
    };
  }
};
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 300px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

@media (min-width: 768px) {
  .chart-container {
    height: 400px;
  }
}

:deep(.dark-mode) .chart-container {
  background: rgba(30, 41, 59, 0.95);
}
</style>