<template>
    <div class="dashboard-wrapper" :class="{ 'dark-mode': isDarkMode }">
      <!-- Sidebar (Desktop) / Hamburger Menu (Mobile) -->
      <nav class="sidebar" :class="{ 'sidebar-open': isSidebarOpen }">
        <div class="sidebar-header">
          <h2 class="logo">CocoFlow</h2>
          <button class="hamburger" @click="toggleSidebar" aria-label="Toggle Sidebar">
            <span class="hamburger-icon">☰</span>
          </button>
        </div>
        <div class="sidebar-content">
          <div class="sidebar-links">
            <a href="/dashboard" class="sidebar-link active" @click="toggleSidebar">Admin Dashboard</a>
            <a href="/settings" class="sidebar-link" @click="toggleSidebar">Settings</a>
            <a href="/profile" class="sidebar-link" @click="toggleSidebar">History</a>
          </div>
          <button @click="signOut" class="sign-out-button" aria-label="Sign Out">Sign Out</button>
        </div>
      </nav>
  
      <!-- Main Content -->
      <div class="main-content">
        <!-- Header -->
        <header class="dashboard-header">
          <div class="header-content">
            <button class="hamburger mobile-only" @click="toggleSidebar" aria-label="Toggle Sidebar">
              <span class="hamburger-icon">☰</span>
            </button>
            <div class="header-right">
              <button class="theme-toggle" @click="toggleTheme" :aria-label="isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
                {{ isDarkMode ? '☀️' : '🌙' }}
              </button>
            </div>
          </div>
        </header>
  
        <!-- Main Dashboard -->
        <main class="dashboard">
          <h1>CocoFlow Dashboard</h1>
          <div v-if="isAuthLoading">
            <div class="loading-wrapper">
              <div class="spinner"></div>
              <p class="loading-text">Loading...</p>
            </div>
          </div>
          <div v-else-if="user">
            <p class="welcome-text">Welcome, {{ user.email }}!</p>
            <div class="dashboard-content">
              <!-- Metrics Section (Moved Above Chart) -->
              <div class="metrics-section">
                <div class="card metric-card animate-fade-in" style="animation-delay: 0.2s;">
                  <h3>Humidity</h3>
                  <p class="metric-value">{{ latestHumidity }}<span class="metric-unit">%</span></p>
                </div>
                <div class="card metric-card animate-fade-in" style="animation-delay: 0.4s;">
                  <h3>Temperature</h3>
                  <p class="metric-value">{{ latestTemperature }}<span class="metric-unit">°C</span></p>
                </div>
                <div class="card fan-card animate-fade-in" style="animation-delay: 0.6s;">
                  <h3>Vent Control</h3>
                  <div class="fan-status" v-tooltip="'Fan status indicates whether the cooling system is active.'">
                    <span :class="isFanOn ? 'status-on' : 'status-off'">
                      {{ isFanOn ? 'Fan Running' : 'Fan Stopped' }}
                    </span>
                  </div>
                  <button
                    :class="{ 'fan-toggle': true, active: isFanOn }"
                    @click="toggleFan"
                    aria-label="Toggle Fan"
                  >
                    <span class="fan-toggle-thumb"></span>
                  </button>
                </div>
                <div class="card chamber-card animate-fade-in" style="animation-delay: 0.8s;">
                  <h3>Chamber Status</h3>
                  <div class="chamber-status" v-tooltip="'Chamber status indicates whether the chamber is operational or empty.'">
                    <span :class="isChamberRunning ? 'status-on' : 'status-off'">
                      {{ isChamberRunning ? 'Chamber Running' : 'Chamber Empty' }}
                    </span>
                  </div>
                  <div v-if="isChamberRunning" class="chamber-timer">
                    <span>Time Remaining: {{ formattedTimer }}</span>
                  </div>
                  <div v-else class="chamber-input">
                    <input
                      v-model.number="countdownHours"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="HH"
                      aria-label="Set countdown hours"
                      class="duration-input duration-input-hh"
                    />
                    <span class="timer-colon">:</span>
                    <input
                      v-model.number="countdownMinutes"
                      type="number"
                      min="0"
                      max="59"
                      step="1"
                      placeholder="MM"
                      aria-label="Set countdown minutes"
                      class="duration-input duration-input-mm"
                    />
                    <span class="timer-colon">:</span>
                    <input
                      v-model.number="countdownSeconds"
                      type="number"
                      min="0"
                      max="59"
                      step="1"
                      placeholder="SS"
                      aria-label="Set countdown seconds"
                      class="duration-input duration-input-ss"
                    />
                  </div>
                  <button
                    @click="toggleChamber"
                    :class="{ 'chamber-button': true, active: isChamberRunning }"
                    aria-label="Toggle Chamber Status"
                    :disabled="!isChamberRunning && !isValidDuration"
                  >
                    {{ isChamberRunning ? 'Stop Chamber' : 'Start Chamber' }}
                  </button>
                </div>
              </div>
              <!-- Chart Section -->
              <div class="chart-section animate-fade-in">
                <div class="card chart-card">
                  <h3>Internal Smoking Conditions</h3>
                  <CurveChart :chart-data="chartData" :chart-options="chartOptions" />
                </div>
              </div>
            </div>
          </div>
          <div v-else>
            <div class="loading-wrapper">
              <div class="spinner"></div>
              <p class="loading-text">Redirecting to login...</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  </template>
  
  <script>
  import { auth } from '../firebaseConfig';
  import { signOut } from '../services/auth';
  import CurveChart from '../components/CurveChart.vue';
  
  // Simple tooltip directive
  const tooltipDirective = {
    bind(el, binding) {
      const tooltip = document.createElement('div');
      tooltip.className = 'tooltip';
      tooltip.innerText = binding.value;
      document.body.appendChild(tooltip);
  
      el.addEventListener('mouseenter', (e) => {
        tooltip.style.display = 'block';
        const rect = el.getBoundingClientRect();
        tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
        tooltip.style.left = `${rect.left + window.scrollX + rect.width / 2}px`;
        tooltip.style.transform = 'translateX(-50%)';
      });
  
      el.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
      });
    },
  };
  
  export default {
    components: {
      CurveChart,
    },
    directives: {
      tooltip: tooltipDirective,
    },
    data() {
      return {
        user: null,
        isAuthLoading: true, // Track auth state loading
        isFanOn: false,
        isChamberRunning: false,
        countdownTimer: 300, // Current countdown in seconds
        countdownHours: 0, // Default 0 hours
        countdownMinutes: 0, // Default 5 minutes
        countdownSeconds: 0, // Default 0 seconds
        timerInterval: null,
        latestTemperature: 0,
        latestHumidity: 0,
        dataInterval: null,
        isDarkMode: false,
        isSidebarOpen: false,
        chartData: {
          labels: [],
          datasets: [
            {
              label: 'Temperature (°C)',
              data: [],
              borderColor: '#ff6b6b',
              backgroundColor: (ctx) => {
                const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 400);
                gradient.addColorStop(0, 'rgba(255, 107, 107, 0.5)');
                gradient.addColorStop(1, 'rgba(255, 107, 107, 0)');
                return gradient;
              },
              fill: true,
              tension: 0.4,
              pointHoverBackgroundColor: '#ff6b6b',
              pointHoverBorderColor: '#ffffff',
              hidden: false, // Track visibility
            },
            {
              label: 'Humidity (%)',
              data: [],
              borderColor: '#4ecdc4',
              backgroundColor: (ctx) => {
                const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 400);
                gradient.addColorStop(0, 'rgba(78, 205, 196, 0.5)');
                gradient.addColorStop(1, 'rgba(78, 205, 196, 0)');
                return gradient;
              },
              fill: true,
              tension: 0.4,
              pointHoverBackgroundColor: '#4ecdc4',
              pointHoverBorderColor: '#ffffff',
              hidden: false, // Track visibility
            },
          ],
        },
        chartOptions: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              labels: {
                font: {
                  size: 14,
                  family: "'Lato', sans-serif",
                },
                color: '#333',
              },
              onClick: (e, legendItem, legend) => {
                const index = legendItem.datasetIndex;
                const chart = legend.chart;
                const datasets = chart.data.datasets;
  
                // Toggle the clicked dataset's visibility
                datasets[index].hidden = !datasets[index].hidden;
  
                // If Humidity (index 1) is clicked
                if (index === 1) {
                  if (datasets[1].hidden) {
                    // Show only Temperature
                    datasets[0].hidden = false; // Ensure Temperature is visible
                  }
                  // If Humidity is shown, both can be visible (no change to Temperature)
                }
                // If Temperature (index 0) is clicked
                else if (index === 0) {
                  if (datasets[0].hidden) {
                    // Show only Humidity
                    datasets[1].hidden = false; // Ensure Humidity is visible
                  }
                  // If Temperature is shown, both can be visible (no change to Humidity)
                }
  
                chart.update();
              },
            },
            tooltip: {
              enabled: true,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleFont: { family: "'Lato', sans-serif" },
              bodyFont: { family: "'Lato', sans-serif" },
              cornerRadius: 8,
            },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Time',
                font: {
                  size: 14,
                  family: "'Lato', sans-serif",
                },
                color: '#666',
              },
              ticks: {
                font: {
                  size: 12,
                  family: "'Lato', sans-serif",
                },
                color: '#666',
              },
            },
            y: {
              title: {
                display: true,
                text: 'Value',
                font: {
                  size: 14,
                  family: "'Lato', sans-serif",
                },
                color: '#666',
              },
              ticks: {
                font: {
                  size: 12,
                  family: "'Lato', sans-serif",
                },
                color: '#666',
              },
              suggestedMin: 0,
              suggestedMax: 100,
            },
          },
        },
      };
    },
    computed: {
      formattedTimer() {
        const hours = Math.floor(this.countdownTimer / 3600);
        const minutes = Math.floor((this.countdownTimer % 3600) / 60);
        const seconds = this.countdownTimer % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      },
      countdownDuration() {
        return (this.countdownHours || 0) * 3600 + (this.countdownMinutes || 0) * 60 + (this.countdownSeconds || 0);
      },
      isValidDuration() {
        return this.countdownDuration >= 60;
      },
    },
    created() {
      auth.onAuthStateChanged((user) => {
        this.isAuthLoading = false; // Auth state resolved
        this.user = user;
        if (!user) {
          this.$router.push('/login');
        } else {
          this.generateInitialData();
          this.startLiveDataSimulation();
        }
      });
      this.isDarkMode = localStorage.getItem('theme') === 'dark';
    },
    beforeDestroy() {
      if (this.dataInterval) {
        clearInterval(this.dataInterval);
      }
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }
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
      generateInitialData() {
        const now = new Date();
        const labels = [];
        const temperatureData = [];
        const humidityData = [];
  
        for (let i = 0; i < 24; i++) {
          const time = new Date(now.getTime() - i * 60 * 60 * 1000);
          labels.push(time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          const temp = Math.random() * 30;
          const hum = Math.random() * 100;
          temperatureData.push(temp);
          humidityData.push(hum);
        }
  
        this.chartData.labels = labels.reverse();
        this.chartData.datasets[0].data = temperatureData.reverse();
        this.chartData.datasets[1].data = humidityData.reverse();
  
        this.latestTemperature = temperatureData[0].toFixed(1);
        this.latestHumidity = humidityData[0].toFixed(1);
      },
      startLiveDataSimulation() {
        this.dataInterval = setInterval(() => {
          const now = new Date();
          const newLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const newTemp = Math.random() * 30;
          const newHum = Math.random() * 100;
  
          const updatedLabels = [...this.chartData.labels];
          const updatedTempData = [...this.chartData.datasets[0].data];
          const updatedHumData = [...this.chartData.datasets[1].data];
  
          updatedLabels.shift();
          updatedLabels.push(newLabel);
          updatedTempData.shift();
          updatedTempData.push(newTemp);
          updatedHumData.shift();
          updatedHumData.push(newHum);
  
          this.chartData = {
            labels: updatedLabels,
            datasets: [
              { ...this.chartData.datasets[0], data: updatedTempData, hidden: this.chartData.datasets[0].hidden },
              { ...this.chartData.datasets[1], data: updatedHumData, hidden: this.chartData.datasets[1].hidden },
            ],
          };
  
          this.latestTemperature = newTemp.toFixed(1);
          this.latestHumidity = newHum.toFixed(1);
        }, 5000);
      },
      toggleFan() {
        this.isFanOn = !this.isFanOn;
        console.log(`Fan is now ${this.isFanOn ? 'ON' : 'OFF'}`);
      },
      toggleChamber() {
        this.isChamberRunning = !this.isChamberRunning;
        if (this.isChamberRunning) {
          this.countdownTimer = this.countdownDuration;
          this.timerInterval = setInterval(() => {
            if (this.countdownTimer > 0) {
              this.countdownTimer--;
            } else {
              // Timer reached 00:00:00, stop chamber and show alert
              this.isChamberRunning = false;
              this.countdownTimer = this.countdownDuration;
              clearInterval(this.timerInterval);
              this.timerInterval = null;
              alert('Chamber Timer Complete!');
              console.log('Chamber stopped: Timer reached 00:00:00');
            }
          }, 1000);
        } else {
          this.countdownTimer = this.countdownDuration;
          if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
          }
          console.log('Chamber is now EMPTY');
        }
      },
      toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
      },
      toggleSidebar() {
        this.isSidebarOpen = !this.isSidebarOpen;
      },
    },
  };
  </script>
  
  <style scoped>
  /* Import Lato font from Google Fonts */
  @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;500;600;700&display=swap');
  
  /* Animations */
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes buttonPress {
    0% { transform: scale(1); }
    50% { transform: scale(0.95); }
    100% { transform: scale(1); }
  }
  
  .animate-fade-in {
    animation: fadeIn 0.6s ease-out forwards;
  }
  
  .button-press {
    animation: buttonPress 0.2s ease;
  }
  
  /* Spinner */
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #63b3ed;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 10px;
  }
  
  /* Tooltip */
  .tooltip {
    position: absolute;
    background: rgba(0, 0, 0, 0.8);
    color: #fff;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 12px;
    font-family: 'Lato', sans-serif;
    z-index: 1000;
    display: none;
  }
  
  /* Input Field */
  .chamber-input {
    margin: 0 0 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
  }
  
  .duration-input {
    width: 50px;
    padding: 6px 8px;
    font-size: 13px;
    font-family: 'Lato', sans-serif;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #ffffff;
    color: #1a202c;
    outline: none;
    text-align: center;
    transition: border-color 0.3s, box-shadow 0.3s;
  }
  
  .dark-mode .duration-input {
    border: 1px solid #4a5568;
    background: #2d3748;
    color: #e2e8f0;
  }
  
  .duration-input:focus {
    border-color: #63b3ed;
    box-shadow: 0 0 0 2px rgba(99, 179, 237, 0.3);
  }
  
  .timer-colon {
    font-size: 13px;
    color: #1a202c;
    font-weight: 500;
  }
  
  .dark-mode .timer-colon {
    color: #e2e8f0;
  }
  
  /* Root Styles */
  .dashboard-wrapper {
    display: flex;
    min-height: 100vh;
    font-family: 'Lato', sans-serif;
    background: linear-gradient(135deg, #f5f7fa 0%, #e4e7eb 100%);
    transition: background 0.3s, color 0.3s;
  }
  
  .dashboard-wrapper.dark-mode {
    background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
    color: #e2e8f0;
  }
  
  /* Sidebar */
  .sidebar {
    width: 250px;
    background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
    color: #e2e8f0;
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    padding: 20px;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }
  
  .sidebar-open {
    transform: translateX(0);
  }
  
  .sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
  }
  
  .logo {
    margin: 0;
    font-size: 24px;
  }
  
  .sidebar-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    justify-content: space-between;
  }
  
  .sidebar-links {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-bottom: 30px;
  }
  
  .sidebar-link {
    color: #e2e8f0;
    font-size: 16px;
    font-weight: 500;
    text-decoration: none;
    padding: 10px 15px;
    border-radius: 8px;
    transition: background 0.3s, color 0.3s;
  }
  
  .sidebar-link:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #63b3ed;
  }
  
  .sidebar-link.active {
    background: rgba(255, 255, 255, 0.2);
    color: #63b3ed;
  }
  
  .sign-out-button {
    padding: 10px 15px;
    font-size: 16px;
    font-weight: 500;
    color: #e2e8f0;
    background: rgba(255, 30, 30, 0.674);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.3s, transform 0.2s;
    margin-top: auto;
    margin-bottom: 50px;
  }
  
  .sign-out-button:hover {
    background: rgba(255, 0, 0, 0.963);
    transform: translateY(-2px);
  }
  
  .hamburger {
    display: block;
    background: none;
    border: none;
    color: #e2e8f0;
    font-size: 24px;
    cursor: pointer;
  }
  
  /* Main Content */
  .main-content {
    flex: 1;
    margin-left: 0;
    display: flex;
    flex-direction: column;
    position: relative;
    transition: margin-left 0.3s ease;
  }
  
  /* Header */
  .dashboard-header {
    background: transparent;
    padding: 15px 20px;
    display: flex;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 900;
  }
  
  .header-content {
    display: flex;
    align-items: center;
    width: 100%;
    justify-content: space-between;
  }
  
  .header-right {
    display: flex;
    align-items: center;
    gap: 15px;
  }
  
  .theme-toggle {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    transition: transform 0.3s;
  }
  
  .theme-toggle:hover {
    transform: scale(1.2);
  }
  
  /* Main Dashboard */
  .dashboard {
    text-align: center;
    padding: 30px 20px;
    flex: 1;
    position: relative;
  }
  
  .dashboard h1 {
    font-size: 28px;
    font-weight: 600;
    color: #1a202c;
    margin: 0 0 10px;
    letter-spacing: -0.5px;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  .dark-mode .dashboard h1 {
    color: #e2e8f0;
  }
  
  .welcome-text {
    font-size: 14px;
    color: #718096;
    margin: 0 0 25px;
    font-weight: 400;
  }
  
  .dark-mode .welcome-text {
    color: #a0aec0;
  }
  
  .loading-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    margin-top: 40px;
  }
  
  .loading-text {
    font-size: 16px;
    color: #718096;
    font-style: italic;
    margin: 0;
  }
  
  .dark-mode .loading-text {
    color: #a0aec0;
  }
  
  /* Dashboard Content */
  .dashboard-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin: 15px 0;
  }
  
  /* Metrics Section */
  .metrics-section {
    flex: none;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  
  /* Chart Section */
  .chart-section {
    flex: none;
    width: 100%;
  }
  
  /* Generic Card Styling */
  .card {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(12px);
    padding: 15px;
    border-radius: 16px;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
    text-align: center;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  
  .dark-mode .card {
    background: rgba(45, 55, 72, 0.9);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  }
  
  /* Chart Card */
  .chart-card {
    height: 400px;
    padding: 20px;
    margin-left: 20px;
  }
  
  .dark-mode .chart-card {
    background: rgba(45, 55, 72, 0.9);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .chart-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  }
  
  .chart-card h3 {
    margin: 0 0 15px;
    font-size: 18px;
    font-weight: 600;
    color: #1a202c;
  }
  
  .dark-mode .chart-card h3 {
    color: #e2e8f0;
  }
  
  /* Metric Card */
  .metric-card h3 {
    margin: 0 0 10px;
    font-size: 18px;
    font-weight: 500;
    color: #1a202c;
  }
  
  .dark-mode .metric-card h3 {
    color: #e2e8f0;
  }
  
  .metric-value {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
    color: #3182ce;
  }
  
  .dark-mode .metric-value {
    color: #63b3ed;
  }
  
  .metric-unit {
    font-size: 16px;
    font-weight: 400;
    color: #718096;
    margin-left: 6px;
  }
  
  .dark-mode .metric-unit {
    color: #a0aec0;
  }
  
  /* Fan Card */
  .fan-card h3 {
    margin: 0 0 10px;
    font-size: 18px;
    font-weight: 500;
    color: #1a202c;
  }
  
  .dark-mode .fan-card h3 {
    color: #e2e8f0;
  }
  
  .fan-status {
    margin: 0 0 8px;
    position: relative;
  }
  
  .status-on {
    color: #38a169;
    font-size: 13px;
    font-weight: 500;
  }
  
  .status-off {
    color: #e53e3e;
    font-size: 13px;
    font-weight: 500;
  }
  
  .fan-toggle {
    position: relative;
    width: 50px;
    height: 24px;
    background: #e2e8f0;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    outline: none;
    display: inline-block;
    margin-top: 10px;
    transition: background 0.3s;
  }
  
  .fan-toggle.active {
    background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
  }
  
  .fan-toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: #ffffff;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: transform 0.3s ease;
  }
  
  .fan-toggle.active .fan-toggle-thumb {
    transform: translateX(26px);
  }
  
  /* Chamber Card */
  .chamber-card h3 {
    margin: 0 0 10px;
    font-size: 18px;
    font-weight: 500;
    color: #1a202c;
  }
  
  .dark-mode .chamber-card h3 {
    color: #e2e8f0;
  }
  
  .chamber-status {
    margin: 0 0 8px;
    position: relative;
  }
  
  .chamber-timer {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 500;
    color: #3182ce;
  }
  
  .dark-mode .chamber-timer {
    color: #63b3ed;
  }
  
  .chamber-button {
    padding: 8px 20px;
    font-size: 14px;
    font-weight: 500;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    background: linear-gradient(135deg, #63b3ed 0%, #4299e1 100%);
    color: #ffffff;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
    transition: background 0.3s, transform 0.2s, box-shadow 0.3s;
  }
  
  .chamber-button.active {
    background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
  }
  
  .chamber-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }
  
  .chamber-button:disabled {
    background: #e2e8f0;
    cursor: not-allowed;
    color: #a0aec0;
    box-shadow: none;
  }
  
  /* Media Queries for Larger Screens */
  @media (min-width: 768px) {
    .dashboard {
      padding: 40px 30px;
    }
  
    .dashboard h1 {
      font-size: 32px;
    }
  
    .welcome-text {
      font-size: 16px;
      margin-bottom: 30px;
    }
  
    .loading-wrapper {
      margin-top: 50px;
    }
  
    .loading-text {
      font-size: 18px;
    }
  
    .dashboard-content {
      flex-direction: column;
      gap: 30px;
      margin: 20px 0;
    }
  
    .metrics-section {
      flex: none;
      flex-direction: row;
      gap: 20px;
      justify-content: center;
    }
  
    .chart-section {
      flex: none;
    }
  
    .chart-card {
      height: 500px;
      padding: 25px;
    }
  
    .chart-card h3 {
      font-size: 22px;
      margin-bottom: 20px;
    }
  
    .metric-card,
    .fan-card,
    .chamber-card {
      padding: 40px;
      flex: 1;
      max-width: 180px;
    }
  
    .metric-card h3,
    .fan-card h3,
    .chamber-card h3 {
      font-size: 20px;
      margin-bottom: 15px;
    }
  
    .metric-value {
      font-size: 36px;
    }
  
    .metric-unit {
      font-size: 20px;
    }
  
    .fan-status,
    .chamber-status {
      margin-bottom: 10px;
    }
  
    .chamber-timer,
    .chamber-input {
      font-size: 14px;
      margin-bottom: 10px;
    }
  
    .duration-input {
      width: 60px;
      font-size: 14px;
      padding: 8px 10px;
    }
  
    .timer-colon {
      font-size: 14px;
    }
  
    .status-on,
    .status-off {
      font-size: 14px;
    }
  
    .fan-toggle {
      width: 60px;
      height: 28px;
    }
  
    .fan-toggle-thumb {
      width: 24px;
      height: 24px;
    }
  
    .fan-toggle.active .fan-toggle-thumb {
      transform: translateX(32px);
    }
  
    .chamber-button {
      padding: 10px 25px;
      font-size: 16px;
    }
  }
  
  @media (min-width: 1024px) {
    .sidebar {
      transform: translateX(0);
    }
  
    .main-content {
      margin-left: 250px;
    }
  
    .hamburger {
      display: none;
    }
  
    .mobile-only {
      display: none;
    }
  
    .dashboard-header {
      padding: 15px 30px;
      justify-content: flex-end;
    }
  
    .header-content {
      justify-content: flex-end;
    }
  }
  
  /* Media Queries for Mobile Responsiveness */
  @media (max-width: 768px) {
    .dashboard-wrapper {
      flex-direction: column;
    }
  
    .sidebar {
      width: 200px;
      z-index: 1100;
    }
  
    .sidebar-open + .main-content {
      margin-left: 0;
      pointer-events: none;
      opacity: 0.5;
    }
  
    .main-content {
      margin-left: 0;
    }
  
    .dashboard {
      padding: 20px 10px;
    }
  
    .dashboard h1 {
      font-size: 24px;
    }
  
    .welcome-text {
      font-size: 12px;
      margin-bottom: 20px;
    }
  
    .loading-wrapper {
      margin-top: 30px;
    }
  
    .loading-text {
      font-size: 14px;
    }
  
    .dashboard-content {
      margin: 10px 0;
      gap: 15px;
    }
  
    .metrics-section {
      flex-direction: column;
      gap: 15px;
    }
  
    .chart-card {
      height: 350px;
      padding: 15px;
      margin-left: 10px;
    }
  
    .chart-card h3 {
      font-size: 16px;
      margin-bottom: 10px;
    }
  
    .metric-card,
    .fan-card,
    .chamber-card {
      padding: 12px;
    }
  
    .metric-card h3,
    .fan-card h3,
    .chamber-card h3 {
      font-size: 16px;
      margin-bottom: 8px;
    }
  
    .metric-value {
      font-size: 24px;
    }
  
    .metric-unit {
      font-size: 14px;
    }
  
    .fan-status,
    .chamber-status {
      margin-bottom: 8px;
    }
  
    .chamber-timer,
    .chamber-input {
      font-size: 12px;
      margin-bottom: 8px;
    }
  
    .duration-input {
      width: 45px;
      font-size: 12px;
      padding: 6px 8px;
    }
  
    .timer-colon {
      font-size: 12px;
    }
  
    .fan-toggle {
      width: 40px;
      height: 20px;
    }
  
    .fan-toggle-thumb {
      width: 16px;
      height: 16px;
    }
  
    .fan-toggle.active .fan-toggle-thumb {
      transform: translateX(20px);
    }
  
    .chamber-button {
      padding: 6px 16px;
      font-size: 13px;
    }
  }
  
  @media (max-width: 480px) {
    .dashboard {
      padding: 15px 8px;
    }
  
    .dashboard h1 {
      font-size: 20px;
    }
  
    .welcome-text {
      font-size: 11px;
      margin-bottom: 15px;
    }
  
    .loading-wrapper {
      margin-top: 20px;
    }
  
    .loading-text {
      font-size: 13px;
    }
  
    .chart-card {
      height: 300px;
      padding: 12px;
      margin-left: 8px;
    }
  
    .chart-card h3 {
      font-size: 14px;
      margin-bottom: 8px;
    }
  
    .metric-card,
    .fan-card,
    .chamber-card {
      padding: 10px;
    }
  
    .metric-card h3,
    .fan-card h3,
    .chamber-card h3 {
      font-size: 14px;
      margin-bottom: 6px;
    }
  
    .metric-value {
      font-size: 20px;
    }
  
    .metric-unit {
      font-size: 12px;
    }
  
    .fan-status,
    .chamber-status {
      margin-bottom: 6px;
    }
  
    .chamber-timer,
    .chamber-input {
      font-size: 11px;
      margin-bottom: 6px;
    }
  
    .duration-input {
      width: 40px;
      font-size: 11px;
      padding: 5px 6px;
    }
  
    .timer-colon {
      font-size: 11px;
    }
  
    .fan-toggle {
      width: 36px;
      height: 18px;
    }
  
    .fan-toggle-thumb {
      width: 14px;
      height: 14px;
    }
  
    .fan-toggle.active .fan-toggle-thumb {
      transform: translateX(18px);
    }
  
    .chamber-button {
      padding: 5px 14px;
      font-size: 12px;
    }
  
    .dashboard-header {
      padding: 10px 15px;
    }
  }
  
  @media (max-width: 360px) {
    .sidebar {
      width: 180px;
    }
  
    .dashboard {
      padding: 10px 5px;
    }
  
    .dashboard h1 {
      font-size: 18px;
    }
  
    .welcome-text {
      font-size: 10px;
      margin-bottom: 10px;
    }
  
    .loading-wrapper {
      margin-top: 15px;
    }
  
    .loading-text {
      font-size: 12px;
    }
  
    .chart-card {
      height: 250px;
      padding: 10px;
      margin-left: 5px;
    }
  
    .chart-card h3 {
      font-size: 13px;
      margin-bottom: 6px;
    }
  
    .metric-card,
    .fan-card,
    .chamber-card {
      padding: 8px;
    }
  
    .metric-card h3,
    .fan-card h3,
    .chamber-card h3 {
      font-size: 13px;
      margin-bottom: 5px;
    }
  
    .metric-value {
      font-size: 18px;
    }
  
    .metric-unit {
      font-size: 10px;
    }
  
    .fan-status,
    .chamber-status {
      margin-bottom: 5px;
    }
  
    .chamber-timer,
    .chamber-input {
      font-size: 10px;
      margin-bottom: 5px;
    }
  
    .duration-input {
      width: 35px;
      font-size: 10px;
      padding: 4px 5px;
    }
  
    .timer-colon {
      font-size: 10px;
    }
  
    .fan-toggle {
      width: 32px;
      height: 16px;
    }
  
    .fan-toggle-thumb {
      width: 12px;
      height: 12px;
    }
  
    .fan-toggle.active .fan-toggle-thumb {
      transform: translateX(16px);
    }
  
    .chamber-button {
      padding: 4px 12px;
      font-size: 11px;
    }
  
    .dashboard-header {
      padding: 8px 10px;
    }
  }
  </style>
  
  
  
  