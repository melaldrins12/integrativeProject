<template>
  <div class="chart-container">
    <canvas ref="chartRef"></canvas>
  </div>
</template>

<script>
import { Chart, registerables } from 'chart.js';
import { onMounted, ref, watch } from 'vue';

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

    onMounted(() => {
      chartInstance = new Chart(chartRef.value, {
        type: 'line',
        data: props.chartData,
        options: props.chartOptions
      });
    });

    watch(() => props.chartData, (newData) => {
      if (chartInstance) {
        chartInstance.data = newData;
        chartInstance.update();
      }
    });

    return {
      chartRef
    };
  }
};
</script>

