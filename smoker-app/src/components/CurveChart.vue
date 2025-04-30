<template>
  <div class="chart-container w-full max-w-full md:max-w-2xl mx-auto p-4">
    <canvas ref="chartRef" class="w-full h-auto"></canvas>
  </div>
</template>

<script>
import { Chart, registerables } from 'chart.js';
import { onMounted, ref, watch, onUnmounted } from 'vue';

Chart.register(...registerables);

export default {
  props: {
    chartData: {
      type: Object,
      required: true
    },
    chartOptions: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const chartRef = ref(null);
    let chartInstance = null;
    let intervalId = null;

    onMounted(() => {
      const options = {
        ...props.chartOptions,
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 800,
          easing: 'easeInOutQuad',
          x: {
            easing: 'easeInOutQuad',
            from: (ctx) => {
              if (ctx.type === 'data' && ctx.dataset.data && ctx.index === ctx.dataset.data.length - 1) {
                return ctx.chart.scales.x.maxPixel || ctx.chart.width;
              }
              return undefined;
            }
          },
          y: {
            easing: 'easeInOutQuad',
            from: (ctx) => {
              if (ctx.type === 'data' && ctx.dataset.data && ctx.index === ctx.dataset.data.length - 1) {
                const prevIndex = ctx.index - 1;
                const prevValue = prevIndex >= 0 && ctx.dataset.data[prevIndex] !== undefined ? ctx.dataset.data[prevIndex] : 0;
                return ctx.chart.scales.y.getPixelForValue(prevValue);
              }
              return undefined;
            }
          }
        }
      };

      // Initialize with a non-reactive copy of chartData
      const initialData = JSON.parse(JSON.stringify(props.chartData && props.chartData.datasets && props.chartData.datasets[0]
        ? props.chartData
        : {
            labels: [],
            datasets: [{ data: [], borderColor: 'blue', fill: false }]
          }));

      chartInstance = new Chart(chartRef.value, {
        type: 'line',
        data: initialData,
        options
      });

      // Start real-time data updates
      intervalId = setInterval(() => {
        if (chartInstance && chartInstance.data) {
          // Create a non-reactive deep copy of current data
          const newData = JSON.parse(JSON.stringify(chartInstance.data));
          const dataset = newData.datasets[0] || { data: [], borderColor: 'blue', fill: false };
          const maxPoints = 10;

          // Generate new data point
          const lastValue = dataset.data.length > 0 ? dataset.data[dataset.data.length - 1] : 0;
          const newValue = lastValue + (Math.random() - 0.5) * 10;
          dataset.data.push(newValue);
          newData.labels.push((newData.labels.length + 1).toString());

          // Remove oldest point if exceeding maxPoints
          if (dataset.data.length > maxPoints) {
            dataset.data.shift();
            newData.labels.shift();
          }

          // Assign non-reactive data to chart
          chartInstance.data = newData;
          chartInstance.update('none');
        }
      }, 1000);
    });

    watch(() => props.chartData, (newData) => {
      if (chartInstance && newData) {
        // Use non-reactive copy to avoid reactivity issues
        const nonReactiveData = JSON.parse(JSON.stringify(newData));
        chartInstance.data = nonReactiveData;
        chartInstance.update({
          duration: 800,
          easing: 'easeInOutQuad'
        });
      }
    });

    onUnmounted(() => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (chartInstance) {
        chartInstance.destroy();
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
}
@media (min-width: 768px) {
  .chart-container {
    height: 400px;
  }
}
</style>