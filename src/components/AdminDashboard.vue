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
            <a href="/dashboard" class="sidebar-link" :class="{ active: !showHistory }" @click="toggleSidebar">Admin Dashboard</a>
            <a href="#history" class="sidebar-link" :class="{ active: showHistory }" @click="scrollToHistory">Operation History</a>
            <a href="/settings" class="sidebar-link" @click="toggleSidebar">Settings</a>
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
        <main class="dashboard" v-if="!showHistory">
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

        <!-- History Section -->
        <main class="dashboard" v-else>
          <div class="history-header">
            <h1>Operation History</h1>
            <div class="history-actions">
              <select v-model="selectedBatch" class="batch-select">
                <option value="all">All Batches</option>
                <option v-for="batch in batches" :key="batch.id" :value="batch.id">
                  Batch {{ batch.id }} - {{ formatDate(batch.startDate) }}
                </option>
              </select>
              <button @click="printHistory" class="print-button" aria-label="Print History">
                <span class="print-icon">🖨️</span> Print {{ selectedBatch === 'all' ? 'All' : 'Selected' }} Batch
              </button>
            </div>
          </div>
          <div class="history-content">
            <div class="card history-card">
              <div class="history-filters">
                <select v-model="selectedTimeRange" class="history-filter">
                  <option value="24h">Last 24 Hours</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
                <select v-model="selectedMetric" class="history-filter">
                  <option value="all">All Metrics</option>
                  <option value="temperature">Temperature</option>
                  <option value="humidity">Humidity</option>
                  <option value="fan">Fan Status</option>
                  <option value="chamber">Chamber Status</option>
                </select>
              </div>
              <div class="batch-summary" v-if="selectedBatch !== 'current'">
                <h4>Batch Summary</h4>
                <div class="summary-grid">
                  <div class="summary-item">
                    <span class="summary-label">Start Date:</span>
                    <span class="summary-value">{{ formatDate(currentBatch.startDate) }}</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">Duration:</span>
                    <span class="summary-value">{{ formatDuration(currentBatch.duration) }}</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">Avg Temperature:</span>
                    <span class="summary-value">{{ currentBatch.avgTemperature }}°C</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">Avg Humidity:</span>
                    <span class="summary-value">{{ currentBatch.avgHumidity }}%</span>
                  </div>
                </div>
              </div>
              <div class="history-table-container">
                <table class="history-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>End Time</th>
                      <th>Duration</th>
                      <th>Metric</th>
                      <th>Value</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(record, index) in filteredHistory" :key="index" class="history-row">
                      <td>{{ formatTime(record.timestamp) }}</td>
                      <td>{{ record.endTime ? formatTime(record.endTime) : '-' }}</td>
                      <td>{{ calculateDuration(record.timestamp, record.endTime) }}</td>
                      <td>{{ record.metric }}</td>
                      <td>{{ record.value }}</td>
                      <td>
                        <span :class="['status-badge', record.status]">
                          {{ record.status }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="history-pagination">
                <button 
                  @click="currentPage--" 
                  :disabled="currentPage === 1"
                  class="pagination-button"
                >
                  Previous
                </button>
                <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
                <button 
                  @click="currentPage++" 
                  :disabled="currentPage === totalPages"
                  class="pagination-button"
                >
                  Next
                </button>
              </div>
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
  import { getDoc, doc } from 'firebase/firestore';
  import { db } from '../firebaseConfig';
  
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
        // History related data
        selectedBatch: 'current',
        batches: [],
        currentBatch: {
          startDate: new Date(),
          duration: 0,
          avgTemperature: 0,
          avgHumidity: 0
        },
        selectedTimeRange: '24h',
        selectedMetric: 'all',
        currentPage: 1,
        itemsPerPage: 10,
        historyData: [],
        showHistory: false,
        currentBatchStartTime: null,
        currentBatchEndTime: null,
        currentBatchData: {
          id: null,
          startTime: null,
          endTime: null,
          temperatureData: [],
          humidityData: [],
          timestamps: [],
          isActive: false,
          duration: 0
        },
        batchHistory: [],
        isRecording: false,
        timerInterval: null,
        dataInterval: null
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
      filteredHistory() {
        let filtered = this.historyData;
        
        // Filter by batch
        if (this.selectedBatch !== 'current') {
          filtered = filtered.filter(record => record.batchId === parseInt(this.selectedBatch));
        }
        
        // Filter by time range
        const now = new Date();
        const timeRanges = {
          '24h': 24 * 60 * 60 * 1000,
          'week': 7 * 24 * 60 * 60 * 1000,
          'month': 30 * 24 * 60 * 60 * 1000
        };
        
        filtered = filtered.filter(record => {
          const recordTime = new Date(record.timestamp);
          return now - recordTime <= timeRanges[this.selectedTimeRange];
        });

        // Filter by metric
        if (this.selectedMetric !== 'all') {
          filtered = filtered.filter(record => record.metric === this.selectedMetric);
        }

        // Pagination
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        
        return filtered.slice(start, end);
      },
      totalPages() {
        return Math.ceil(this.historyData.length / this.itemsPerPage);
      }
    },
    created() {
      // Initialize data immediately
      this.generateInitialData();
      this.startLiveDataSimulation();
      
      // Set theme
      this.isDarkMode = localStorage.getItem('theme') === 'dark';
      
      // Listen for auth state changes
      this.unsubscribe = auth.onAuthStateChanged(async (user) => {
        this.user = user;
        this.isAuthLoading = false;
        
        if (!user) {
          this.$router.push('/login');
        } else {
          try {
            // Fetch user role
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              const role = userDoc.data().role;
              if (role !== 'admin') {
                // If not admin, redirect to appropriate dashboard
                this.$router.push(role === 'user' ? '/user-dashboard' : '/login');
              }
            } else {
              // No user document, sign out and redirect to login
              await auth.signOut();
              this.$router.push('/login');
            }
          } catch (error) {
            console.error('Error checking user role:', error);
            this.$router.push('/login');
          }
        }
      });
      this.generateHistoryData();
    },
    beforeUnmount() {
      // Clean up the auth listener when component is destroyed
      if (this.unsubscribe) {
        this.unsubscribe();
      }
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
          if (this.isChamberRunning && this.isRecording) {
            const now = new Date();
            const newTemp = Math.random() * 30;
            const newHum = Math.random() * 100;

            // Store data for current batch
            this.currentBatchData.temperatureData.push(newTemp);
            this.currentBatchData.humidityData.push(newHum);
            this.currentBatchData.timestamps.push(now);

            // Add real-time records to history
            const tempRecord = {
              batchId: this.currentBatchData.id,
              timestamp: now,
              endTime: null,
              metric: 'temperature',
              value: `${newTemp.toFixed(1)}°C`,
              status: 'normal'
            };
            const humRecord = {
              batchId: this.currentBatchData.id,
              timestamp: now,
              endTime: null,
              metric: 'humidity',
              value: `${newHum.toFixed(1)}%`,
              status: 'normal'
            };
            this.historyData.unshift(tempRecord, humRecord);

            // Update chart data
            this.updateChartData(newTemp, newHum, now);
          }
        }, 5000);
      },
      updateChartData(newTemp, newHum, timestamp) {
        const newLabel = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
            { ...this.chartData.datasets[0], data: updatedTempData },
            { ...this.chartData.datasets[1], data: updatedHumData }
          ]
        };

        this.latestTemperature = newTemp.toFixed(1);
        this.latestHumidity = newHum.toFixed(1);
      },
      toggleFan() {
        this.isFanOn = !this.isFanOn;
        console.log(`Fan is now ${this.isFanOn ? 'ON' : 'OFF'}`);
      },
      toggleChamber() {
        if (!this.isChamberRunning) {
          // Start new batch
          const batchId = this.batches.length + 1;
          this.currentBatchData = {
            id: batchId,
            startTime: new Date(),
            endTime: null,
            temperatureData: [],
            humidityData: [],
            timestamps: [],
            isActive: true,
            duration: this.countdownDuration
          };
          this.isRecording = true;
          this.isChamberRunning = true;

          // Add batch start record
          const startRecord = {
            batchId: batchId,
            timestamp: this.currentBatchData.startTime,
            endTime: null,
            metric: 'batch',
            value: `Batch ${batchId} Started`,
            status: 'active'
          };
          this.historyData.unshift(startRecord);

          // Start data collection
          this.startDataCollection();
          
          // Start timer
          this.countdownTimer = this.countdownDuration;
          this.timerInterval = setInterval(() => {
            if (this.countdownTimer > 0) {
              this.countdownTimer--;
            } else {
              this.stopChamber();
            }
          }, 1000);
        } else {
          this.stopChamber();
        }
      },
      startDataCollection() {
        // Clear any existing interval
        if (this.dataInterval) {
          clearInterval(this.dataInterval);
        }

        // Start new data collection interval
        this.dataInterval = setInterval(() => {
          if (this.isChamberRunning && this.isRecording) {
            const now = new Date();
            const newTemp = Math.random() * 30;
            const newHum = Math.random() * 100;

            // Store data for current batch
            this.currentBatchData.temperatureData.push(newTemp);
            this.currentBatchData.humidityData.push(newHum);
            this.currentBatchData.timestamps.push(now);

            // Add real-time records to history
            const tempRecord = {
              batchId: this.currentBatchData.id,
              timestamp: now,
              endTime: null,
              metric: 'temperature',
              value: `${newTemp.toFixed(1)}°C`,
              status: 'normal'
            };
            const humRecord = {
              batchId: this.currentBatchData.id,
              timestamp: now,
              endTime: null,
              metric: 'humidity',
              value: `${newHum.toFixed(1)}%`,
              status: 'normal'
            };
            this.historyData.unshift(tempRecord, humRecord);

            // Update chart data
            this.updateChartData(newTemp, newHum, now);
          }
        }, 5000);
      },
      stopChamber() {
        this.isChamberRunning = false;
        this.isRecording = false;
        this.currentBatchData.endTime = new Date();
        this.currentBatchData.isActive = false;

        // Stop data collection
        if (this.dataInterval) {
          clearInterval(this.dataInterval);
          this.dataInterval = null;
        }

        // Add batch end record
        const endRecord = {
          batchId: this.currentBatchData.id,
          timestamp: this.currentBatchData.endTime,
          endTime: this.currentBatchData.endTime,
          metric: 'batch',
          value: `Batch ${this.currentBatchData.id} Completed`,
          status: 'completed'
        };
        this.historyData.unshift(endRecord);

        // Save batch data
        this.saveBatchData();

        // Reset timer
        this.countdownTimer = this.countdownDuration;
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
          this.timerInterval = null;
        }
      },
      toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
      },
      toggleSidebar() {
        this.isSidebarOpen = !this.isSidebarOpen;
      },
      scrollToHistory() {
        this.showHistory = true;
        this.toggleSidebar();
      },
      formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
      },
      formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      },
      formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
      },
      generateHistoryData() {
        const now = new Date();
        const history = [];
        
        // Generate sample batches
        this.batches = Array.from({ length: 5 }, (_, i) => ({
          id: i + 1,
          startDate: new Date(now - (i * 7 * 24 * 60 * 60 * 1000)),
          duration: Math.floor(Math.random() * 24 * 60 * 60),
          avgTemperature: (Math.random() * 20 + 20).toFixed(1),
          avgHumidity: (Math.random() * 30 + 50).toFixed(1)
        }));

        // Generate sample history data for each batch
        this.batches.forEach(batch => {
          const batchStart = new Date(batch.startDate);
          const batchEnd = new Date(batchStart.getTime() + batch.duration * 1000);
          
          // Add batch start record
          history.push({
            batchId: batch.id,
            timestamp: batchStart,
            endTime: null,
            metric: 'batch',
            value: `Batch ${batch.id} Started`,
            status: 'active'
          });

          // Add chamber status records
          history.push({
            batchId: batch.id,
            timestamp: batchStart,
            endTime: batchEnd,
            metric: 'chamber',
            value: 'Running',
            status: 'active'
          });

          // Add temperature and humidity records
          for (let i = 0; i < 50; i++) {
            const timestamp = new Date(batchStart.getTime() + i * 30 * 60 * 1000);
            if (timestamp <= batchEnd) {
              history.push({
                batchId: batch.id,
                timestamp,
                endTime: null,
                metric: 'temperature',
                value: `${(Math.random() * 20 + 20).toFixed(1)}°C`,
                status: Math.random() > 0.8 ? 'warning' : 'normal'
              });

              history.push({
                batchId: batch.id,
                timestamp,
                endTime: null,
                metric: 'humidity',
                value: `${(Math.random() * 30 + 50).toFixed(1)}%`,
                status: Math.random() > 0.8 ? 'warning' : 'normal'
              });
            }
          }

          // Add batch end record
          history.push({
            batchId: batch.id,
            timestamp: batchEnd,
            endTime: batchEnd,
            metric: 'batch',
            value: `Batch ${batch.id} Completed`,
            status: 'completed'
          });

          // Add final chamber status
          history.push({
            batchId: batch.id,
            timestamp: batchEnd,
            endTime: batchEnd,
            metric: 'chamber',
            value: 'Stopped',
            status: 'inactive'
          });
        });
        
        this.historyData = history;
      },
      printHistory() {
        // Get records for selected batch or all batches
        const recordsToPrint = this.selectedBatch === 'all' 
          ? this.filteredHistory 
          : this.filteredHistory.filter(record => record.batchId === parseInt(this.selectedBatch));

        // Group records by batch
        const batchGroups = {};
        recordsToPrint.forEach(record => {
          if (!batchGroups[record.batchId]) {
            batchGroups[record.batchId] = [];
          }
          batchGroups[record.batchId].push(record);
        });

        // Create print content
        let printContent = '';
        
        // Add title and date
        printContent += `
          <div class="print-header">
            <h1>Operation History Report</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            ${this.selectedBatch !== 'all' ? `<p>Selected Batch: ${this.selectedBatch}</p>` : ''}
          </div>
        `;

        // Add each batch section
        Object.entries(batchGroups).forEach(([batchId, records]) => {
          const batchStart = records.find(r => r.metric === 'chamber' && r.value === 'Running');
          const batchEnd = records.find(r => r.metric === 'chamber' && r.value === 'Stopped');
          
          printContent += `
            <div class="batch-section">
              <h2>Batch ${batchId}</h2>
              <div class="batch-summary">
                <p><strong>Start Time:</strong> ${this.formatTime(batchStart?.timestamp)}</p>
                <p><strong>End Time:</strong> ${batchEnd ? this.formatTime(batchEnd.timestamp) : 'Ongoing'}</p>
                <p><strong>Duration:</strong> ${this.calculateDuration(batchStart?.timestamp, batchEnd?.timestamp)}</p>
              </div>
              <table class="print-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>End Time</th>
                    <th>Duration</th>
                    <th>Metric</th>
                    <th>Value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${records.map(record => `
                    <tr>
                      <td>${this.formatTime(record.timestamp)}</td>
                      <td>${record.endTime ? this.formatTime(record.endTime) : '-'}</td>
                      <td>${this.calculateDuration(record.timestamp, record.endTime)}</td>
                      <td>${record.metric}</td>
                      <td>${record.value}</td>
                      <td>${record.status}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `;
        });

        // Create print window
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
          <html>
            <head>
              <title>Operation History Report</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  margin: 20px;
                }
                .print-header {
                  text-align: center;
                  margin-bottom: 30px;
                }
                .batch-section {
                  page-break-after: always;
                  margin-bottom: 30px;
                }
                .batch-summary {
                  background: #f5f5f5;
                  padding: 15px;
                  margin: 15px 0;
                  border-radius: 5px;
                }
                .print-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 15px;
                }
                .print-table th,
                .print-table td {
                  border: 1px solid #ddd;
                  padding: 8px;
                  text-align: left;
                }
                .print-table th {
                  background-color: #f5f5f5;
                }
                @media print {
                  .batch-section {
                    page-break-after: always;
                  }
                  .batch-section:last-child {
                    page-break-after: avoid;
                  }
                }
              </style>
            </head>
            <body>
              ${printContent}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      },
      saveBatchData() {
        if (!this.currentBatchData.startTime || !this.currentBatchData.endTime) return;

        const batchData = {
          id: this.currentBatchData.id,
          startDate: this.currentBatchData.startTime,
          endDate: this.currentBatchData.endTime,
          duration: Math.floor((this.currentBatchData.endTime - this.currentBatchData.startTime) / 1000),
          avgTemperature: this.calculateAverageTemperature(),
          avgHumidity: this.calculateAverageHumidity(),
          temperatureData: this.currentBatchData.temperatureData,
          humidityData: this.currentBatchData.humidityData,
          timestamps: this.currentBatchData.timestamps,
          targetDuration: this.currentBatchData.duration
        };

        // Add to batches array
        this.batches.push(batchData);
        this.batchHistory.push(batchData);

        // Add chamber stop record
        const stopRecord = {
          batchId: this.currentBatchData.id,
          timestamp: this.currentBatchData.startTime,
          endTime: this.currentBatchData.endTime,
          metric: 'chamber',
          value: 'Stopped',
          status: 'inactive'
        };
        this.historyData.unshift(stopRecord);

        // Show completion message
        alert(`Batch ${this.currentBatchData.id} completed!\nDuration: ${this.formatDuration(batchData.duration)}`);
      },
      calculateAverageTemperature() {
        if (this.currentBatchData.temperatureData.length === 0) return 0;
        const sum = this.currentBatchData.temperatureData.reduce((a, b) => a + b, 0);
        return (sum / this.currentBatchData.temperatureData.length).toFixed(1);
      },
      calculateAverageHumidity() {
        if (this.currentBatchData.humidityData.length === 0) return 0;
        const sum = this.currentBatchData.humidityData.reduce((a, b) => a + b, 0);
        return (sum / this.currentBatchData.humidityData.length).toFixed(1);
      },
      calculateDuration(startTime, endTime) {
        if (!startTime || !endTime) return '-';
        const duration = Math.floor((new Date(endTime) - new Date(startTime)) / 1000);
        
        if (duration < 60) {
          return `${duration}s`;
        } else if (duration < 3600) {
          const minutes = Math.floor(duration / 60);
          const seconds = duration % 60;
          return `${minutes}m ${seconds}s`;
        } else {
          const hours = Math.floor(duration / 3600);
          const minutes = Math.floor((duration % 3600) / 60);
          const seconds = duration % 60;
          return `${hours}h ${minutes}m ${seconds}s`;
        }
      }
    },
    watch: {
      selectedBatch(newValue) {
        if (newValue !== 'current') {
          const batch = this.batches.find(b => b.id === parseInt(newValue));
          if (batch) {
            this.currentBatch = batch;
          }
        }
      }
    }
  };
  </script>
  
  <style scoped>
  /* Import Lato font from Google Fonts */
  @import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;500;600;700&display=swap');
  
  /* Animations */
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
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
  
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
  
  .animate-fade-in {
    animation: fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }
  
  .button-press {
    animation: buttonPress 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  /* Root Styles */
  .dashboard-wrapper {
    display: flex;
    min-height: 100vh;
    font-family: 'Lato', sans-serif;
    background: linear-gradient(135deg, #f6f9fc 0%, #eef2f7 100%);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .dashboard-wrapper.dark-mode {
    background: linear-gradient(135deg, #1a1f2c 0%, #2d3748 100%);
    color: #e2e8f0;
  }
  
  /* Sidebar */
  .sidebar {
    width: 280px;
    background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
    color: #e2e8f0;
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    padding: 25px;
    transform: translateX(-100%);
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    box-shadow: 4px 0 15px rgba(0, 0, 0, 0.1);
  }
  
  .sidebar-open {
    transform: translateX(0);
  }
  
  .sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 35px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .logo {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
    background: linear-gradient(135deg, #63b3ed 0%, #4299e1 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -0.5px;
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
    gap: 12px;
    margin-bottom: 30px;
    padding: 0 5px;
  }
  
  .sidebar-link {
    color: #e2e8f0;
    font-size: 16px;
    font-weight: 500;
    text-decoration: none;
    padding: 12px 18px;
    border-radius: 12px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    white-space: nowrap;
  }
  
  .sidebar-link:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #63b3ed;
    transform: translateX(5px);
  }
  
  .sidebar-link.active {
    background: rgba(99, 179, 237, 0.2);
    color: #63b3ed;
    box-shadow: 0 4px 12px rgba(99, 179, 237, 0.2);
  }
  
  .sign-out-button {
    padding: 12px 20px;
    font-size: 16px;
    font-weight: 500;
    color: #ffffff;
    background: linear-gradient(135deg, #fc8181 0%, #f56565 100%);
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    margin-top: auto;
    margin-bottom: 50px;
    box-shadow: 0 4px 12px rgba(245, 101, 101, 0.3);
  }
  
  .sign-out-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(245, 101, 101, 0.4);
  }
  
  /* Main Content */
  .main-content {
    flex: 1;
    margin-left: 0;
    display: flex;
    flex-direction: column;
    position: relative;
    transition: margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    padding-left: 20px;
  }
  
  @media (min-width: 1024px) {
    .main-content {
      margin-left: 280px;
      padding-left: 40px;
    }
  }
  
  /* Header */
  .dashboard-header {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    padding: 20px 30px;
    display: flex;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 900;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }
  
  .dark-mode .dashboard-header {
    background: rgba(26, 32, 44, 0.8);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .theme-toggle {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    padding: 8px;
    border-radius: 50%;
  }
  
  .theme-toggle:hover {
    transform: scale(1.1) rotate(15deg);
    background: rgba(0, 0, 0, 0.05);
  }
  
  .dark-mode .theme-toggle:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  /* Dashboard Content */
  .dashboard {
    text-align: center;
    padding: 40px 30px;
    flex: 1;
    position: relative;
    margin: 0 20px;
  }
  
  @media (min-width: 1024px) {
    .dashboard {
      margin: 0 40px;
    }
  }
  
  .dashboard h1 {
    font-size: 32px;
    font-weight: 700;
    color: #2d3748;
    margin: 0 0 15px;
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
    padding: 25px;
    border-radius: 20px;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05),
                0 6px 6px rgba(0, 0, 0, 0.03),
                0 0 100px rgba(0, 0, 0, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.5);
    text-align: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .dark-mode .card {
    background: rgba(45, 55, 72, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2),
                0 6px 6px rgba(0, 0, 0, 0.1),
                0 0 100px rgba(0, 0, 0, 0.1);
  }
  
  .card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1),
                0 8px 8px rgba(0, 0, 0, 0.04),
                0 0 120px rgba(0, 0, 0, 0.03);
  }
  
  /* Chart Card */
  .chart-card {
    height: 500px;
    padding: 30px;
    margin: 20px;
    background: rgba(255, 255, 255, 0.95);
  }
  
  .dark-mode .chart-card {
    background: rgba(45, 55, 72, 0.95);
  }
  
  .chart-card h3 {
    margin: 0 0 20px;
    font-size: 24px;
    font-weight: 600;
    color: #2d3748;
    letter-spacing: -0.5px;
  }
  
  .dark-mode .chart-card h3 {
    color: #e2e8f0;
  }
  
  /* Metric Card */
  .metric-card h3 {
    margin: 0 0 15px;
    font-size: 20px;
    font-weight: 600;
    color: #2d3748;
    letter-spacing: -0.5px;
  }
  
  .dark-mode .metric-card h3 {
    color: #e2e8f0;
  }
  
  .metric-value {
    margin: 0;
    font-size: 36px;
    font-weight: 700;
    background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -1px;
  }
  
  .metric-unit {
    font-size: 18px;
    font-weight: 500;
    color: #718096;
    margin-left: 8px;
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
    color: #48bb78;
    font-size: 14px;
    font-weight: 600;
    padding: 4px 12px;
    border-radius: 20px;
    background: rgba(72, 187, 120, 0.1);
  }
  
  .status-off {
    color: #f56565;
    font-size: 14px;
    font-weight: 600;
    padding: 4px 12px;
    border-radius: 20px;
    background: rgba(245, 101, 101, 0.1);
  }
  
  .fan-toggle {
    position: relative;
    width: 60px;
    height: 30px;
    background: #e2e8f0;
    border-radius: 15px;
    border: none;
    cursor: pointer;
    outline: none;
    display: inline-block;
    margin-top: 15px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .fan-toggle.active {
    background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
  }
  
  .fan-toggle-thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 24px;
    height: 24px;
    background: #ffffff;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .fan-toggle.active .fan-toggle-thumb {
    transform: translateX(30px);
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
    padding: 12px 25px;
    font-size: 16px;
    font-weight: 600;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    letter-spacing: 0.5px;
  }
  
  .chamber-button.active {
    background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
    box-shadow: 0 4px 12px rgba(229, 62, 62, 0.3);
  }
  
  .chamber-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(66, 153, 225, 0.4);
  }
  
  .chamber-button.active:hover {
    box-shadow: 0 6px 15px rgba(229, 62, 62, 0.4);
  }
  
  .chamber-button:disabled {
    background: #e2e8f0;
    cursor: not-allowed;
    color: #a0aec0;
    box-shadow: none;
  }
  
  /* Input Fields */
  .duration-input {
    width: 60px;
    padding: 8px 12px;
    font-size: 14px;
    font-family: 'Lato', sans-serif;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    background: #ffffff;
    color: #2d3748;
    outline: none;
    text-align: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .dark-mode .duration-input {
    border: 2px solid #4a5568;
    background: #2d3748;
    color: #e2e8f0;
  }
  
  .duration-input:focus {
    border-color: #4299e1;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
  }
  
  .timer-colon {
    font-size: 16px;
    color: #2d3748;
    font-weight: 600;
    margin: 0 5px;
  }
  
  .dark-mode .timer-colon {
    color: #e2e8f0;
  }
  
  /* Loading Spinner */
  .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(66, 153, 225, 0.1);
    border-top: 4px solid #4299e1;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 15px;
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
      width: 250px;
      padding: 20px;
      z-index: 1100;
    }
  
    .sidebar-open + .main-content {
      margin-left: 0;
      pointer-events: none;
      opacity: 0.5;
    }
  
    .main-content {
      margin-left: 15px;
      padding: 20px 15px;
    }
  
    .dashboard {
      padding: 20px 15px;
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
  
  /* History Section Styles */
  .history-section {
    margin-top: 30px;
    padding: 0 20px;
  }
  
  .history-content {
    padding: 0;
    width: 100%;
    text-align: center;
    margin-top: 20px;
  }
  
  .history-card {
    padding: 25px;
    margin: 0 auto;
    width: 100%;
    max-width: calc(100% - 40px);
  }
  
  .history-filters {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
    justify-content: center;
    flex-wrap: wrap;
    padding: 0 20px;
  }
  
  .history-filter {
    padding: 10px 15px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: white;
    color: #2d3748;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 200px;
  }
  
  .dark-mode .history-filter {
    background: #2d3748;
    border-color: #4a5568;
    color: #e2e8f0;
  }
  
  .history-filter:hover {
    border-color: #4299e1;
  }
  
  .history-table-container {
    overflow-x: auto;
    margin: 20px 0;
    width: 100%;
    padding: 0 20px;
  }
  
  .history-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
    text-align: center;
  }
  
  .history-table th,
  .history-table td {
    padding: 15px;
    text-align: center;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .dark-mode .history-table th,
  .dark-mode .history-table td {
    border-bottom-color: #4a5568;
  }
  
  .history-table th {
    font-weight: 600;
    color: #4a5568;
    background: #f7fafc;
  }
  
  .dark-mode .history-table th {
    color: #a0aec0;
    background: #2d3748;
  }
  
  .history-row:hover {
    background: #f7fafc;
  }
  
  .dark-mode .history-row:hover {
    background: #2d3748;
  }
  
  .status-badge {
    padding: 4px 8px !important;
    border-radius: 4px !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    border: 1px solid #000 !important;
    display: inline-block !important;
    min-width: 80px !important;
  }
  
  .status-badge.normal {
    background: #ffffff !important;
    color: #000000 !important;
    border-color: #2f855a !important;
  }
  
  .status-badge.warning {
    background: #ffffff !important;
    color: #000000 !important;
    border-color: #c53030 !important;
  }
  
  .status-badge.active {
    background: #ffffff !important;
    color: #000000 !important;
    border-color: #2f855a !important;
  }
  
  .status-badge.inactive {
    background: #ffffff !important;
    color: #000000 !important;
    border-color: #4a5568 !important;
  }
  
  .history-pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 15px;
    margin: 20px;
    padding: 0 20px;
  }
  
  .pagination-button {
    padding: 8px 16px;
    border: none;
    border-radius: 8px;
    background: #4299e1;
    color: white;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .pagination-button:hover:not(:disabled) {
    background: #3182ce;
  }
  
  .pagination-button:disabled {
    background: #e2e8f0;
    cursor: not-allowed;
  }
  
  .page-info {
    font-size: 14px;
    color: #4a5568;
  }
  
  .dark-mode .page-info {
    color: #a0aec0;
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .history-section {
      padding: 0 10px;
    }
  
    .history-card {
      padding: 15px;
    }
  
    .history-filters {
      flex-direction: column;
      align-items: center;
    }
  
    .history-filter {
      width: 100%;
      min-width: unset;
    }
  
    .history-table-container {
      padding: 0 15px;
    }
  
    .batch-summary {
      width: calc(100% - 30px);
      margin: 20px 15px;
    }
  
    .history-table th,
    .history-table td {
      padding: 10px;
      font-size: 13px;
    }
  
    .history-pagination {
      margin: 15px;
      padding: 0 15px;
    }
  }
  
  /* Add these styles to the existing <style> section */
  .batch-summary {
    margin: 20px auto;
    padding: 20px;
    background: rgba(66, 153, 225, 0.1);
    border-radius: 12px;
    width: calc(100% - 40px);
    text-align: center;
  }
  
  .batch-summary h4 {
    margin: 0 0 15px;
    font-size: 18px;
    color: #2d3748;
  }
  
  .dark-mode .batch-summary h4 {
    color: #e2e8f0;
  }
  
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    width: 100%;
    margin: 0 auto;
    text-align: center;
  }
  
  .summary-item {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  
  .summary-label {
    font-size: 14px;
    color: #718096;
  }
  
  .dark-mode .summary-label {
    color: #a0aec0;
  }
  
  .summary-value {
    font-size: 16px;
    font-weight: 600;
    color: #2d3748;
  }
  
  .dark-mode .summary-value {
    color: #e2e8f0;
  }
  
  @media (max-width: 768px) {
    .summary-grid {
      grid-template-columns: 1fr;
    }
  }
  
  /* Add these styles to the existing <style> section */
  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    padding: 0 20px;
    max-width: 1200px;
    margin-left: auto;
    margin-right: auto;
    width: 100%;
  }
  
  .print-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(66, 153, 225, 0.3);
  }
  
  .print-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(66, 153, 225, 0.4);
  }
  
  .print-icon {
    font-size: 16px;
  }
  
  .dark-mode .print-button {
    background: linear-gradient(135deg, #63b3ed 0%, #4299e1 100%);
  }
  
  @media (max-width: 768px) {
    .history-header {
      flex-direction: column;
      gap: 15px;
      text-align: center;
    }
  
    .print-button {
      width: 100%;
      justify-content: center;
    }
  }
  
  /* Print Styles */
  @media print {
    .sidebar,
    .dashboard-header,
    .hamburger,
    .theme-toggle,
    .sign-out-button,
    .history-filters,
    .history-pagination {
      display: none !important;
    }

    .dashboard-wrapper {
      display: block;
      background: none;
    }

    .main-content {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
    }

    .dashboard {
      margin: 0 !important;
      padding: 20px !important;
    }

    .history-table-container {
      overflow: visible !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    .history-table {
      width: 100% !important;
      border-collapse: collapse !important;
      page-break-inside: auto !important;
    }

    .history-table th,
    .history-table td {
      border: 1px solid #000 !important;
      padding: 8px !important;
      text-align: center !important;
      background: white !important;
      color: black !important;
    }

    .history-table th {
      background: #f0f0f0 !important;
      font-weight: bold !important;
    }

    .history-row {
      page-break-inside: avoid !important;
    }

    .batch-summary {
      background: none !important;
      border: 1px solid #000 !important;
      margin: 20px 0 !important;
      padding: 15px !important;
      page-break-inside: avoid !important;
    }

    .summary-grid {
      display: grid !important;
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 10px !important;
    }

    .summary-item {
      border: 1px solid #000 !important;
      padding: 8px !important;
      text-align: left !important;
    }

    .summary-label {
      color: black !important;
      font-weight: bold !important;
      display: block !important;
      margin-bottom: 4px !important;
    }

    .summary-value {
      color: black !important;
      font-size: 14px !important;
    }

    .history-card {
      page-break-before: auto !important;
      page-break-after: auto !important;
      max-width: none !important;
    }

    .history-header h1 {
      color: black !important;
      font-size: 24px !important;
      margin-bottom: 20px !important;
      text-align: center !important;
    }

    .history-header h1::before {
      content: attr(data-batch-info);
      display: block;
      font-size: 16px;
      color: #333;
      margin-bottom: 10px;
      font-weight: 600;
    }

    .history-header h1::after {
      content: attr(data-print-date);
      display: block;
      font-size: 12px;
      color: #666;
      margin-top: 5px;
      font-weight: normal;
    }

    .history-table td {
      padding: 8px !important;
      vertical-align: middle !important;
    }

    .history-table td:last-child {
      width: 100px !important;
    }
  }

  .history-actions {
    display: flex;
    gap: 15px;
    align-items: center;
  }

  .batch-select {
    padding: 10px 15px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: white;
    color: #2d3748;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 200px;
  }

  .dark-mode .batch-select {
    background: #2d3748;
    border-color: #4a5568;
    color: #e2e8f0;
  }

  .batch-select:hover {
    border-color: #4299e1;
  }

  @media (max-width: 768px) {
    .history-actions {
      flex-direction: column;
      width: 100%;
    }

    .batch-select {
      width: 100%;
    }

    .print-button {
      width: 100%;
    }
  }
  </style>
  
  
  
  