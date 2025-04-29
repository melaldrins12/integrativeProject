<template>
  <div class="dashboard">
    <h1>Dashboard</h1>
    <p class="welcome-message">
      Welcome, <strong>{{ user?.email }}</strong>!
    </p>

    <div class="card chart-section">
      <CurveChart :chart-data="chartData" :options="chartOptions" />
    </div>

    <div class="card controls-section">
      <div class="control-header">Smoker Chamber Controls</div>
      <div class="button-group">
        <button class="control-button smoke">Turn ON Smoker</button>
        <button class="control-button vent">Activate Ventilation</button>
      </div>
      <div class="input-group">
        <label for="max-temp">Max Temp:</label>
        <input id="max-temp" type="number" class="input-field" v-model="maxTemp" />
        <button class="control-button apply">Apply</button>
      </div>
    </div>

    <button @click="signOut" class="sign-out-button">Sign Out</button>
  </div>
</template>


<script>
import { auth } from '../firebaseConfig';
import { signOut } from '../services/auth';
import CurveChart from '../components/CurveChart.vue';

export default {
  components: {
    CurveChart
  },
  data() {
    return {
      user: null,
      smokerOn: false,
      maxTemperature: 30,
      chartData: {
        labels: [],
        datasets: [
          {
            label: 'Temperature (°C)',
            data: [],
            borderColor: '#f87979',
            backgroundColor: 'rgba(248, 121, 121, 0.5)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Humidity (%)',
            data: [],
            borderColor: '#79f879',
            backgroundColor: 'rgba(121, 248, 121, 0.5)',
            fill: true,
            tension: 0.4
          }
        ]
      },
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Time'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Value'
            }
          }
        }
      }
    };
  },
  created() {
    auth.onAuthStateChanged((user) => {
      this.user = user;
      if (!user) {
        this.$router.push('/login');
      } else {
        this.generateMockData();
      }
    });
  },
  methods: {
    signOut() {
      signOut()
        .then(() => {
          this.$router.push('/login');
        })
        .catch((error) => {
          console.error('Error signing out', error);
        });
    },
    toggleSmoker() {
      this.smokerOn = !this.smokerOn;
      console.log(this.smokerOn ? 'Smoker ON' : 'Smoker OFF');
    },
    activateVentilation() {
      console.log('Ventilation Activated');
    },
    applyThresholds() {
      console.log(`Max temperature set to ${this.maxTemperature}°C`);
    },
    generateMockData() {
      const now = new Date();
      const labels = [];
      const temperatureData = [];
      const humidityData = [];

      for (let i = 0; i < 24; i++) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000); // 1 hour intervals
        labels.unshift(time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        temperatureData.unshift((Math.random() * 10 + 20).toFixed(2)); // 20-30°C
        humidityData.unshift((Math.random() * 50 + 30).toFixed(2)); // 30-80%
      }

      this.chartData.labels = labels;
      this.chartData.datasets[0].data = temperatureData;
      this.chartData.datasets[1].data = humidityData;
    }
  }
};
</script>

<style scoped>
.dashboard {
  max-width: 960px;
  margin: 40px auto;
  padding: 0 20px;
  font-family: 'Segoe UI', sans-serif;
  color: #333;
}

h1 {
  font-size: 2.2rem;
  font-weight: bold;
  margin-bottom: 10px;
}

.welcome-message {
  font-size: 1.1rem;
  margin-bottom: 20px;
}

.card {
  background-color: #fff;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  margin-bottom: 30px;
}

.chart-section {
  height: 400px;
  overflow-x: auto;
}

.controls-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.control-header {
  font-weight: bold;
  font-size: 1.2rem;
  margin-bottom: 10px;
}

.button-group {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.control-button {
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
}

.control-button.smoke {
  background-color: #4CAF50;
}

.control-button.smoke:hover {
  background-color: #449d48;
}

.control-button.vent {
  background-color: #2196F3;
}

.control-button.vent:hover {
  background-color: #1976D2;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.input-field {
  padding: 8px 12px;
  font-size: 14px;
  border-radius: 4px;
  border: 1px solid #ccc;
  width: 100px;
}

.control-button.apply {
  background-color: #FF9800;
}

.control-button.apply:hover {
  background-color: #fb8c00;
}

.sign-out-button {
  margin-top: 10px;
  padding: 10px 18px;
  font-size: 14px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
}

.sign-out-button:hover {
  background-color: #d32f2f;
}

</style>
