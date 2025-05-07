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
            <a href="/dashboard" class="sidebar-link" :class="{ active: !showHistory }" @click="toggleSidebar">
              <span class="sidebar-icon">📊</span>
              Admin Dashboard
            </a>
            <a href="#history" class="sidebar-link" :class="{ active: showHistory }" @click="scrollToHistory">
              <span class="sidebar-icon">📜</span>
              Operation History
            </a>
            <div class="sidebar-section">
              <h3 class="sidebar-section-title">User Management</h3>
              <router-link to="/admin-register" class="sidebar-link" @click.native="toggleSidebar">
                <span class="sidebar-icon">👤</span>
                Admin Registration
              </router-link>
              <router-link to="/admin-list" class="sidebar-link" :class="{ active: $route.path === '/admin-list' }" @click="toggleSidebar">
                <span class="sidebar-icon">👥</span>
                Admin List
              </router-link>
              <router-link to="/user-list" class="sidebar-link" :class="{ active: $route.path === '/user-list' }" @click="toggleSidebar">
                <span class="sidebar-icon">👥</span>
                User List
              </router-link>
            </div>
          </div>
          <button @click="signOut" class="sign-out-button" aria-label="Sign Out">
            <span class="sidebar-icon">🚪</span>
            Sign Out
          </button>
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
            <p class="welcome-text">Welcome, {{ displayName || user.email }}!</p>
            <div class="dashboard-content">
              <!-- Metrics Section (Moved Above Chart) -->
              <div class="metrics-section">
                <div class="card metric-card animate-fade-in" style="animation-delay: 0.2s;">
                  <h3>Smoke Level</h3>
                  <p class="metric-value">{{ latestSmokeLevel }}<span class="metric-unit">%</span></p>
                  <div class="smoke-level-indicator" :class="smokeLevelClass">
                    <span class="smoke-level-text">{{ smokeLevelText }}</span>
                    <div class="smoke-level-bar">
                      <div class="smoke-level-fill" :style="{ width: smokeLevelPercentage + '%' }"></div>
                    </div>
                    <!-- Add notification for low smoke level -->
                    <div v-if="latestSmokeLevel <= smokeLevelThresholds.low" class="smoke-level-notification">
                      <span class="notification-icon">⚠️</span>
                      <span class="notification-text">Low smoke level detected! Please add fuel to maintain optimal smoking conditions.</span>
                    </div>
                  </div>
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
                  <div class="chamber-header">
                    <h3>Chamber Status</h3>
                    <div class="chamber-status" v-tooltip="'Chamber status indicates whether the chamber is operational or empty.'">
                      <span :class="['status-indicator', isChamberRunning ? 'status-on' : 'status-off']">
                        <span class="status-dot"></span>
                        {{ isChamberRunning ? 'Chamber Running' : 'Chamber Empty' }}
                      </span>
                    </div>
                  </div>

                  <div class="chamber-content">
                    <div v-if="isChamberRunning" class="chamber-timer">
                      <div class="timer-label">Time Remaining</div>
                      <div class="timer-display">
                        <div class="timer-unit">
                          <span class="timer-value">{{ Math.floor(countdownTimer / 3600) }}</span>
                          <span class="timer-label">Hours</span>
                        </div>
                        <div class="timer-separator">:</div>
                        <div class="timer-unit">
                          <span class="timer-value">{{ Math.floor((countdownTimer % 3600) / 60) }}</span>
                          <span class="timer-label">Minutes</span>
                        </div>
                        <div class="timer-separator">:</div>
                        <div class="timer-unit">
                          <span class="timer-value">{{ countdownTimer % 60 }}</span>
                          <span class="timer-label">Seconds</span>
                        </div>
                      </div>
                    </div>
                    <div v-else class="chamber-input">
                      <div class="input-label">Set Duration</div>
                      <div class="duration-inputs">
                        <div class="input-group">
                          <input
                            v-model.number="countdownHours"
                            type="number"
                            min="0"
                            step="1"
                            placeholder="00"
                            aria-label="Set countdown hours"
                            class="duration-input"
                          />
                          <span class="input-label">Hours</span>
                        </div>
                        <div class="input-group">
                          <input
                            v-model.number="countdownMinutes"
                            type="number"
                            min="0"
                            max="59"
                            step="1"
                            placeholder="00"
                            aria-label="Set countdown minutes"
                            class="duration-input"
                          />
                          <span class="input-label">Minutes</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    @click="showConfirmation"
                    :class="['chamber-button', { active: isChamberRunning }]"
                    aria-label="Toggle Chamber Status"
                    :disabled="!isChamberRunning && !isValidDuration"
                  >
                    <span class="button-icon">{{ isChamberRunning ? '⏹️' : '▶️' }}</span>
                    <span class="button-text">{{ isChamberRunning ? 'Stop Chamber' : 'Start Chamber' }}</span>
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
                  <option value="smokeLevel">Smoke Level</option>
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
                    <span class="summary-label">Avg Smoke Level:</span>
                    <span class="summary-value">{{ currentBatch.avgSmokeLevel }}%</span>
                  </div>
                </div>
              </div>
              
              <!-- Desktop Table View -->
              <div class="history-table-container desktop-only">
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
                    <tr v-for="(record, index) in filteredHistory" 
                        :key="index" 
                        class="history-row"
                        @click="showHistoryDetails(record)">
                      <td>{{ record.formattedTime || formatTime(record.timestamp) }}</td>
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

              <!-- Mobile Card View -->
              <div class="history-cards mobile-only">
                <div v-for="(record, index) in filteredHistory" 
                     :key="index" 
                     class="history-card-item"
                     :class="record.status"
                     @click="showHistoryDetails(record)">
                  <div class="card-header">
                    <span class="card-time">{{ record.formattedTime || formatTime(record.timestamp) }}</span>
                    <span :class="['status-badge', record.status]">
                      {{ record.status }}
                    </span>
                  </div>
                  <div class="card-content">
                    <div class="card-row">
                      <span class="label">Metric:</span>
                      <span class="value">{{ record.metric }}</span>
                    </div>
                    <div class="card-row">
                      <span class="label">Value:</span>
                      <span class="value">{{ record.value }}</span>
                    </div>
                    <div class="card-row" v-if="record.endTime">
                      <span class="label">End Time:</span>
                      <span class="value">{{ formatTime(record.endTime) }}</span>
                    </div>
                    <div class="card-row" v-if="record.endTime">
                      <span class="label">Duration:</span>
                      <span class="value">{{ calculateDuration(record.timestamp, record.endTime) }}</span>
                    </div>
                  </div>
                </div>
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

      <!-- Confirmation Dialog (Moved to root level) -->
      <ConfirmationDialog
        v-model="showConfirmDialog"
        title="Confirm Chamber Start"
        message="Are you sure you want to start the chamber with the following duration?"
        :duration="formattedDuration"
        icon="⏱️"
        confirm-text="Start Chamber"
        cancel-text="Cancel"
        @confirm="confirmStart"
        @cancel="cancelStart"
      />

      <!-- Add Modal Notification -->
      <div v-if="showSmokeLevelModal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <span class="modal-icon">⚠️</span>
            <h3>Low Smoke Level Alert</h3>
          </div>
          <div class="modal-body">
            <p>The smoke level is currently at {{ latestSmokeLevel }}%, which is below the optimal range.</p>
            <p>Please add fuel to maintain proper smoking conditions.</p>
          </div>
          <div class="modal-footer">
            <button @click="acknowledgeSmokeLevel" class="modal-button confirm">
              I'll Add Fuel
            </button>
            <button @click="dismissSmokeLevel" class="modal-button dismiss">
              Dismiss
            </button>
          </div>
        </div>
      </div>

      <!-- History Modal -->
      <div v-if="showHistoryModal" class="modal-overlay" @click.self="closeHistoryModal">
        <div class="modal-content history-modal" @click.stop>
          <div class="modal-header">
            <span class="modal-icon">📅</span>
            <h3>Operation Details</h3>
            <button class="close-button" @click="closeHistoryModal">&times;</button>
          </div>
          <div class="modal-body" v-if="selectedHistoryRecord">
            <div class="history-detail-item">
              <label>Start Time:</label>
              <span>{{ formatDateTime(selectedHistoryRecord.timestamp) }}</span>
            </div>
            <div class="history-detail-item">
              <label>End Time:</label>
              <span>{{ formatDateTime(selectedHistoryRecord.endTime) }}</span>
            </div>
            <div class="history-detail-item">
              <label>Duration:</label>
              <span>{{ calculateDuration(selectedHistoryRecord.timestamp, selectedHistoryRecord.endTime) }}</span>
            </div>
            <div class="history-detail-item">
              <label>Metric:</label>
              <span>{{ selectedHistoryRecord?.metric }}</span>
            </div>
            <div class="history-detail-item">
              <label>Value:</label>
              <span>{{ selectedHistoryRecord?.value }}</span>
            </div>
            <div class="history-detail-item">
              <label>Status:</label>
              <span :class="['status-badge', selectedHistoryRecord?.status]">
                {{ selectedHistoryRecord?.status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Timer Completion Modal -->
      <div v-if="showTimerCompletionModal" class="modal-overlay">
        <div class="modal-content timer-completion-modal">
          <div class="modal-header">
            <span class="modal-icon">⏰</span>
            <h3>Timer Complete</h3>
            <button class="close-button" @click="closeTimerCompletionModal">&times;</button>
          </div>
          <div class="modal-body">
            <p>The chamber timer has completed its cycle.</p>
            <p>Would you like to:</p>
            <div class="modal-actions">
              <button @click="restartTimer" class="modal-button restart">
                Restart Timer
              </button>
              <button @click="closeTimerCompletionModal" class="modal-button close">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { auth } from '../firebaseConfig';
  import { signOut } from '../services/auth';
  import CurveChart from '../components/CurveChart.vue';
  import ConfirmationDialog from '../components/ConfirmationDialog.vue';
  import { getDoc, doc } from 'firebase/firestore';
  import { db } from '../firebaseConfig';
  import { smokingSessionService } from '../services/smokingSession';
  
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
      ConfirmationDialog,
    },
    directives: {
      tooltip: tooltipDirective,
    },
    data() {
      return {
        user: null,
        displayName: '',
        isAuthLoading: true,
        isFanOn: false,
        isChamberRunning: false,
        countdownTimer: 0,
        countdownHours: 0,
        countdownMinutes: 0,
        timerInterval: null,
        latestTemperature: 0,
        latestSmokeLevel: 0,
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
              hidden: false,
              yAxisID: 'y'
            },
            {
              label: 'Smoke Level (%)',
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
              hidden: false,
              yAxisID: 'y1'
            }
          ]
        },
        chartOptions: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 750,
            easing: 'easeInOutQuart'
          },
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
                chart.update();
              },
            },
            tooltip: {
              enabled: true,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleFont: { family: "'Lato', sans-serif" },
              bodyFont: { family: "'Lato', sans-serif" },
              cornerRadius: 8,
              mode: 'index',
              intersect: false,
              animation: {
                duration: 200
              }
            },
          },
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'minute',
                displayFormats: {
                  minute: 'HH:mm'
                },
                tooltipFormat: 'HH:mm:ss'
              },
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
                maxRotation: 0,
                autoSkip: true,
                maxTicksLimit: 8
              },
              grid: {
                display: true,
                color: 'rgba(0, 0, 0, 0.1)'
              }
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
              grid: {
                display: true,
                color: 'rgba(0, 0, 0, 0.1)'
              }
            },
          },
          interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
          },
          elements: {
            line: {
              tension: 0.4
            },
            point: {
              radius: 0,
              hitRadius: 10,
              hoverRadius: 4
            }
          }
        },
        // History related data
        selectedBatch: 'current',
        batches: [],
        currentBatch: {
          startDate: new Date(),
          duration: 0,
          avgTemperature: 0,
          avgSmokeLevel: 0
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
          smokeLevelData: [],
          timestamps: [],
          isActive: false,
          duration: 0
        },
        batchHistory: [],
        isRecording: false,
        timerInterval: null,
        dataInterval: null,
        showConfirmDialog: false,
        smokeLevelThresholds: {
          low: 30,
          medium: 60,
          high: 90
        },
        showSmokeLevelModal: false,
        lastNotificationTime: null,
        notificationCooldown: 5 * 60 * 1000, // 5 minutes cooldown
        currentSession: null,
        sessionInterval: null,
        dataUpdateInterval: null,
        isTimerRunning: false,
        showHistoryModal: false,
        selectedHistoryRecord: null,
        currentBatchId: null,
        showTimerCompletionModal: false,
      };
    },
    computed: {
      countdownDuration() {
        return (this.countdownHours || 0) * 3600 + (this.countdownMinutes || 0) * 60;
      },
      formattedTimer() {
        const hours = Math.floor(this.countdownTimer / 3600);
        const minutes = Math.floor((this.countdownTimer % 3600) / 60);
        const seconds = this.countdownTimer % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
      },
      formattedDuration() {
        const hours = this.countdownHours.toString().padStart(2, '0');
        const minutes = this.countdownMinutes.toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      },
      smokeLevelClass() {
        if (this.latestSmokeLevel <= this.smokeLevelThresholds.low) {
          return 'smoke-level-low';
        } else if (this.latestSmokeLevel <= this.smokeLevelThresholds.medium) {
          return 'smoke-level-medium';
        } else {
          return 'smoke-level-high';
        }
      },
      smokeLevelText() {
        if (this.latestSmokeLevel <= this.smokeLevelThresholds.low) {
          return 'Low';
        } else if (this.latestSmokeLevel <= this.smokeLevelThresholds.medium) {
          return 'Medium';
        } else {
          return 'High';
        }
      },
      smokeLevelPercentage() {
        return Math.min(100, (this.latestSmokeLevel / this.smokeLevelThresholds.high) * 100);
      }
    },
    async created() {
      // Initialize data immediately
      this.generateInitialData();
      
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
            // Fetch user role and display name
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              this.displayName = userData.displayName || '';
              const role = userData.role;
              if (role !== 'admin') {
                this.$router.push(role === 'user' ? '/user-dashboard' : '/login');
              } else {
                // Check for active session when admin logs in
                await this.checkActiveSession();
              }
            } else {
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
    mounted() {
      this.generateHistoryData();
    },
    beforeUnmount() {
      // Clean up intervals and listeners
      if (this.unsubscribe) {
        this.unsubscribe();
      }
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }
      if (this.dataInterval) {
        clearInterval(this.dataInterval);
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
        const smokeLevelData = [];
  
        for (let i = 0; i < 24; i++) {
          const time = new Date(now.getTime() - i * 60 * 60 * 1000);
          labels.push(time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          const temp = Math.random() * 30;
          const hum = Math.random() * 100;
          temperatureData.push(temp);
          smokeLevelData.push(hum);
        }
  
        this.chartData.labels = labels.reverse();
        this.chartData.datasets[0].data = temperatureData.reverse();
        this.chartData.datasets[1].data = smokeLevelData.reverse();
  
        this.latestTemperature = temperatureData[0].toFixed(1);
        this.latestSmokeLevel = smokeLevelData[0].toFixed(1);
      },
      startLiveDataSimulation() {
        this.dataInterval = setInterval(() => {
          if (this.isChamberRunning && this.isRecording) {
            const now = new Date();
            const newTemp = Math.random() * 30;
            const newHum = Math.random() * 100;

            // Store data for current batch
            this.currentBatchData.temperatureData.push(newTemp);
            this.currentBatchData.smokeLevelData.push(newHum);
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
              metric: 'smokeLevel',
              value: `${newHum.toFixed(1)}%`,
              status: 'normal'
            };
            this.historyData.unshift(tempRecord, humRecord);

            // Update chart data with smooth animation
            this.updateChartData(newTemp, newHum, now);
          }
        }, 1000); // Update every second for more real-time feel
      },
      updateChartData(newTemp, newHum, timestamp) {
        const newLabel = timestamp;
        const updatedLabels = [...this.chartData.labels];
        const updatedTempData = [...this.chartData.datasets[0].data];
        const updatedHumData = [...this.chartData.datasets[1].data];

        // Keep only the last 60 points (1 minute of data at 1-second intervals)
        if (updatedLabels.length >= 60) {
          updatedLabels.shift();
          updatedTempData.shift();
          updatedHumData.shift();
        }

        updatedLabels.push(newLabel);
        updatedTempData.push(newTemp);
        updatedHumData.push(newHum);

        this.chartData = {
          labels: updatedLabels,
          datasets: [
            { ...this.chartData.datasets[0], data: updatedTempData },
            { ...this.chartData.datasets[1], data: updatedHumData }
          ]
        };

        this.latestTemperature = newTemp.toFixed(1);
        this.latestSmokeLevel = newHum.toFixed(1);
      },
      toggleFan() {
        this.isFanOn = !this.isFanOn;
        console.log(`Fan is now ${this.isFanOn ? 'ON' : 'OFF'}`);
      },
      startTimer() {
        // Clear any existing timer
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
        }

        // Generate a new batch ID for this session
        this.currentBatchId = Date.now();

        // Calculate total seconds
        const totalSeconds = (this.countdownHours * 3600) + (this.countdownMinutes * 60);
        this.countdownTimer = totalSeconds;
        console.log('Timer started with:', totalSeconds, 'seconds');

        // Record start time in history
        const startTime = new Date();
        const startRecord = {
          batchId: this.currentBatchId,
          timestamp: startTime,
          endTime: null,
          metric: 'chamber',
          value: 'Started',
          status: 'active',
          duration: totalSeconds,
          formattedTime: this.formatTime(startTime)
        };
        this.historyData.unshift(startRecord);
        console.log('Added start record to history:', startRecord);

        // Start the countdown
        this.timerInterval = setInterval(() => {
          if (this.countdownTimer > 0) {
            this.countdownTimer--;
            console.log('Timer:', this.countdownTimer);
          } else {
            clearInterval(this.timerInterval);
            this.stopChamber(true); // Pass true to indicate timer completion
          }
        }, 1000);
      },
      stopTimer() {
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
          this.timerInterval = null;
        }
        console.log('Timer stopped');

        // Record stop time in history
        const stopTime = new Date();
        const stopRecord = {
          batchId: this.currentBatchId,
          timestamp: stopTime,
          endTime: stopTime,
          metric: 'chamber',
          value: 'Stopped',
          status: 'inactive',
          formattedTime: this.formatTime(stopTime)
        };
        this.historyData.unshift(stopRecord);
        console.log('Added stop record to history:', stopRecord);

        // Reset current batch ID
        this.currentBatchId = null;
      },
      async toggleChamber() {
        if (!this.isChamberRunning) {
          // Start chamber
          this.isChamberRunning = true;
          this.startTimer();
        } else {
          // Stop chamber
          this.isChamberRunning = false;
          this.stopTimer();
        }
      },
      async stopChamber(isTimerComplete = false) {
        this.isChamberRunning = false;
        this.stopTimer();
        
        // Only show completion modal if timer completed naturally
        if (isTimerComplete) {
          this.showTimerCompletionModal = true;
        }
      },
      async startSessionMonitoring() {
        // Clear any existing intervals
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
          this.timerInterval = null;
        }
        if (this.dataInterval) {
          clearInterval(this.dataInterval);
          this.dataInterval = null;
        }

        console.log('Starting session monitoring...');
        console.log('Initial countdown timer:', this.countdownTimer);

        // Start session timer
        this.timerInterval = setInterval(() => {
          if (this.countdownTimer > 0) {
            this.countdownTimer--;
            console.log('Timer tick:', this.countdownTimer);
            
            // Update session duration in Firestore
            if (this.currentSession) {
              smokingSessionService.updateSession(this.currentSession.id, {
                currentDuration: this.currentSession.targetDuration - this.countdownTimer,
                adminId: this.user.uid
              }).catch(error => {
                console.error('Error updating session duration:', error);
              });
            }
          } else {
            console.log('Timer reached zero, stopping chamber');
            this.stopChamber();
          }
        }, 1000);

        // Start data collection
        this.startDataCollection();
      },
      async startDataCollection() {
        console.log('Starting data collection...');
        this.dataInterval = setInterval(async () => {
          if (this.isChamberRunning && this.isRecording && this.currentSession) {
            try {
              const now = new Date();
              const newTemp = Math.random() * 30;
              const newHum = Math.random() * 100;

              // Update session data in Firestore
              await smokingSessionService.updateSession(this.currentSession.id, {
                temperatureData: [...this.currentSession.temperatureData, newTemp],
                smokeLevelData: [...this.currentSession.smokeLevelData, newHum],
                timestamps: [...this.currentSession.timestamps, now],
                adminId: this.user.uid
              });

              // Update local state
              this.updateChartData(newTemp, newHum, now);
            } catch (error) {
              console.error('Error updating session data:', error);
            }
          }
        }, 5000);
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
        if (!timestamp) return '-';
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
          avgSmokeLevel: (Math.random() * 30 + 50).toFixed(1)
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

          // Add temperature and smoke level records
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
                metric: 'smokeLevel',
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
          avgSmokeLevel: this.calculateAverageSmokeLevel(),
          temperatureData: this.currentBatchData.temperatureData,
          smokeLevelData: this.currentBatchData.smokeLevelData,
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
      calculateAverageSmokeLevel() {
        if (this.currentBatchData.smokeLevelData.length === 0) return 0;
        const sum = this.currentBatchData.smokeLevelData.reduce((a, b) => a + b, 0);
        return (sum / this.currentBatchData.smokeLevelData.length).toFixed(1);
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
      },
      showConfirmation() {
        if (this.isChamberRunning) {
          this.toggleChamber();
        } else {
          this.showConfirmDialog = true;
        }
      },
      confirmStart() {
        this.showConfirmDialog = false;
        this.toggleChamber();
      },
      cancelStart() {
        this.showConfirmDialog = false;
      },
      checkAndShowNotification() {
        const now = Date.now();
        if (!this.lastNotificationTime || (now - this.lastNotificationTime) > this.notificationCooldown) {
          this.showSmokeLevelModal = true;
          this.lastNotificationTime = now;
        }
      },
      acknowledgeSmokeLevel() {
        this.showSmokeLevelModal = false;
        // You could add additional logic here, like logging the acknowledgment
      },
      dismissSmokeLevel() {
        this.showSmokeLevelModal = false;
      },
      async checkActiveSession() {
        try {
          console.log('Checking for active session...');
          const activeSession = await smokingSessionService.getActiveSession();
          if (activeSession) {
            console.log('Found active session:', activeSession);
            this.currentSession = activeSession;
            this.isChamberRunning = true;
            this.isRecording = true;
            
            // Calculate remaining time
            const startTime = activeSession.startTime.toDate();
            const elapsedTime = Math.floor((Date.now() - startTime.getTime()) / 1000);
            this.countdownTimer = Math.max(0, activeSession.targetDuration - elapsedTime);
            console.log('Resumed session with remaining time:', this.countdownTimer);
            
            // Start the timer
            this.startTimer();
            
            // Start data collection
            this.startDataCollection();
          } else {
            console.log('No active session found');
            this.isChamberRunning = false;
            this.isRecording = false;
            this.currentSession = null;
            this.stopTimer();
          }
        } catch (error) {
          console.error('Error checking active session:', error);
          this.isChamberRunning = false;
          this.isRecording = false;
          this.currentSession = null;
          this.stopTimer();
        }
      },
      showHistoryDetails(record) {
        console.log('Showing history details for:', record);
        this.selectedHistoryRecord = { ...record };
        this.showHistoryModal = true;
      },
      closeHistoryModal() {
        this.showHistoryModal = false;
        this.selectedHistoryRecord = null;
      },
      formatDateTime(date) {
        if (!date) return 'N/A';
        try {
          return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          });
        } catch (error) {
          console.error('Error formatting date:', error);
          return 'Invalid Date';
        }
      },
      calculateDuration(startTime, endTime) {
        if (!startTime || !endTime) return 'N/A';
        try {
          const duration = Math.floor((new Date(endTime) - new Date(startTime)) / 1000);
          const hours = Math.floor(duration / 3600);
          const minutes = Math.floor((duration % 3600) / 60);
          const seconds = duration % 60;
          return `${hours}h ${minutes}m ${seconds}s`;
        } catch (error) {
          console.error('Error calculating duration:', error);
          return 'Invalid Duration';
        }
      },
      closeTimerCompletionModal() {
        this.showTimerCompletionModal = false;
      },
      restartTimer() {
        this.showTimerCompletionModal = false;
        this.startTimer();
      },
    },
    watch: {
      selectedBatch(newValue) {
        if (newValue !== 'current') {
          const batch = this.batches.find(b => b.id === parseInt(newValue));
          if (batch) {
            this.currentBatch = batch;
          }
        }
      },
      latestSmokeLevel(newValue) {
        if (newValue <= this.smokeLevelThresholds.low) {
          this.checkAndShowNotification();
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
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .dashboard-wrapper.dark-mode {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: #e2e8f0;
  }
  
  /* Sidebar */
  .sidebar {
    width: 280px;
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
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
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
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
    display: flex;
    align-items: center;
    padding: 12px 18px;
    color: #e2e8f0;
    text-decoration: none;
    border-radius: 8px;
    transition: all 0.3s ease;
  }
  
  .sidebar-link:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .sidebar-link.active {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .sign-out-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 12px;
    margin-top: auto;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 8px;
    color: #e2e8f0;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .sign-out-button:hover {
    background: rgba(255, 255, 255, 0.2);
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
    background: rgba(255, 255, 255, 0.95);
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
    background: rgba(30, 41, 59, 0.95);
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
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
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
    color: #10b981;
    font-size: 14px;
    font-weight: 600;
    padding: 4px 12px;
    border-radius: 20px;
    background: rgba(16, 185, 129, 0.1);
  }
  
  .status-off {
    color: #ef4444;
    font-size: 14px;
    font-weight: 600;
    padding: 4px 12px;
    border-radius: 20px;
    background: rgba(239, 68, 68, 0.1);
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
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
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
  
  /* Enhanced Chamber Card Styles */
  .chamber-card {
    position: relative;
    overflow: hidden;
    padding: 25px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.95) 100%);
    border: 1px solid rgba(255, 255, 255, 0.5);
  }
  
  .dark-mode .chamber-card {
    background: linear-gradient(135deg, rgba(45, 55, 72, 0.9) 0%, rgba(45, 55, 72, 0.95) 100%);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .chamber-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .chamber-header h3 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #2d3748;
  }
  
  .dark-mode .chamber-header h3 {
    color: #e2e8f0;
  }
  
  .status-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s ease;
  }
  
  .status-indicator .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    transition: all 0.3s ease;
  }
  
  .status-on {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
  }
  
  .status-on .status-dot {
    background: #10b981;
    box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
  }
  
  .status-off {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }
  
  .status-off .status-dot {
    background: #ef4444;
    box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
  }
  
  .chamber-content {
    margin: 20px 0;
  }
  
  /* Timer Display Styles */
  .chamber-timer {
    text-align: center;
  }
  
  .timer-label {
    font-size: 14px;
    color: #718096;
    margin-bottom: 10px;
  }
  
  .dark-mode .timer-label {
    color: #a0aec0;
  }
  
  .timer-display {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
  }
  
  .timer-unit {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 60px;
  }
  
  .timer-value {
    font-size: 32px;
    font-weight: 700;
    color: #2d3748;
    font-family: 'Courier New', monospace;
    line-height: 1;
  }
  
  .dark-mode .timer-value {
    color: #e2e8f0;
  }
  
  .timer-separator {
    font-size: 32px;
    font-weight: 700;
    color: #718096;
    margin-top: -8px;
  }
  
  .dark-mode .timer-separator {
    color: #a0aec0;
  }
  
  /* Duration Input Styles */
  .chamber-input {
    text-align: center;
  }
  
  .input-label {
    font-size: 14px;
    color: #718096;
    margin-bottom: 15px;
  }
  
  .dark-mode .input-label {
    color: #a0aec0;
  }
  
  .duration-inputs {
    display: flex;
    justify-content: center;
    gap: 20px; /* Increased gap since we have only two inputs */
  }
  
  .input-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
  }
  
  .duration-input {
    width: 80px; /* Slightly wider since we have only two inputs */
    height: 50px;
    padding: 8px;
    font-size: 24px;
    font-family: 'Courier New', monospace;
    text-align: center;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    background: white;
    color: #2d3748;
    transition: all 0.3s ease;
  }
  
  .dark-mode .duration-input {
    background: #2d3748;
    border-color: #4a5568;
    color: #e2e8f0;
  }
  
  .duration-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    outline: none;
  }
  
  .duration-input::placeholder {
    color: #a0aec0;
  }
  
  /* Enhanced Button Styles */
  .chamber-button {
    width: 100%;
    padding: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-size: 16px;
    font-weight: 600;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }
  
  .chamber-button.active {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
  }
  
  .chamber-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(59, 130, 246, 0.4);
  }
  
  .chamber-button.active:hover {
    box-shadow: 0 6px 15px rgba(220, 38, 38, 0.4);
  }
  
  .chamber-button:disabled {
    background: #e2e8f0;
    cursor: not-allowed;
    color: #a0aec0;
    box-shadow: none;
    transform: none;
  }
  
  .button-icon {
    font-size: 18px;
  }
  
  /* Responsive Adjustments */
  @media (max-width: 768px) {
    .chamber-card {
      padding: 20px;
    }
  
    .chamber-header h3 {
      font-size: 18px;
    }
  
    .timer-value {
      font-size: 28px;
    }
  
    .duration-input {
      width: 70px;
      height: 45px;
      font-size: 20px;
    }
  
    .chamber-button {
      padding: 12px;
      font-size: 15px;
    }
  }
  
  @media (max-width: 480px) {
    .chamber-card {
      padding: 15px;
    }
  
    .chamber-header h3 {
      font-size: 16px;
    }
  
    .timer-value {
      font-size: 24px;
    }
  
    .duration-input {
      width: 60px;
      height: 40px;
      font-size: 18px;
    }
  
    .chamber-button {
      padding: 10px;
      font-size: 14px;
    }
  
    .duration-inputs {
      gap: 15px;
    }
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
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
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
    -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
    scrollbar-width: thin; /* Firefox */
    scrollbar-color: #4299e1 #e2e8f0; /* Firefox */
  }
  
  /* Custom scrollbar for Webkit browsers */
  .history-table-container::-webkit-scrollbar {
    height: 8px;
  }
  
  .history-table-container::-webkit-scrollbar-track {
    background: #e2e8f0;
    border-radius: 4px;
  }
  
  .history-table-container::-webkit-scrollbar-thumb {
    background: #4299e1;
    border-radius: 4px;
  }
  
  .history-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
    text-align: center;
    min-width: 800px; /* Ensure minimum width for content */
  }
  
  .history-table th,
  .history-table td {
    padding: 15px;
    text-align: center;
    border-bottom: 1px solid #e2e8f0;
    white-space: nowrap; /* Prevent text wrapping */
  }
  
  /* Make certain columns more compact on mobile */
  @media (max-width: 768px) {
    .history-table th,
    .history-table td {
      padding: 10px 8px;
      font-size: 13px;
    }
  
    /* Hide less important columns on mobile */
    .history-table th:nth-child(2),
    .history-table td:nth-child(2),
    .history-table th:nth-child(3),
    .history-table td:nth-child(3) {
      display: none;
    }
  
    /* Adjust column widths for better mobile display */
    .history-table th:first-child,
    .history-table td:first-child {
      position: sticky;
      left: 0;
      background: white;
      z-index: 1;
      box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
    }
  
    .dark-mode .history-table th:first-child,
    .dark-mode .history-table td:first-child {
      background: #2d3748;
    }
  
    /* Make status column more compact */
    .history-table th:last-child,
    .history-table td:last-child {
      min-width: 80px;
    }
  }
  
  /* Add responsive styles for the table header */
  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    padding: 0 20px;
    flex-wrap: wrap;
    gap: 15px;
  }
  
  .history-actions {
    display: flex;
    gap: 15px;
    align-items: center;
    flex-wrap: wrap;
  }
  
  /* Responsive styles for filters and actions */
  @media (max-width: 768px) {
    .history-header {
      flex-direction: column;
      align-items: stretch;
      text-align: center;
    }
  
    .history-actions {
      flex-direction: column;
      width: 100%;
    }
  
    .batch-select,
    .print-button {
      width: 100%;
    }
  
    .history-filters {
      flex-direction: column;
      width: 100%;
    }
  
    .history-filter {
      width: 100%;
    }
  }
  
  /* Add a visual indicator for scrollable table */
  .history-table-container::after {
    content: '';
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 30px;
    background: linear-gradient(to right, transparent, rgba(0, 0, 0, 0.1));
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s;
  }
  
  .history-table-container:hover::after {
    opacity: 1;
  }
  
  .dark-mode .history-table-container::after {
    background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1));
  }
  
  /* Improve status badge visibility on mobile */
  .status-badge {
    padding: 4px 8px !important;
    border-radius: 4px !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    border: 1px solid #000 !important;
    display: inline-block !important;
    min-width: 80px !important;
    white-space: nowrap !important;
  }
  
  /* Add responsive styles for the batch summary */
  .batch-summary {
    margin: 20px auto;
    padding: 20px;
    background: rgba(59, 130, 246, 0.1);
    border-radius: 12px;
    width: calc(100% - 40px);
    text-align: center;
  }
  
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    width: 100%;
    margin: 0 auto;
    text-align: center;
  }
  
  @media (max-width: 768px) {
    .summary-grid {
      grid-template-columns: 1fr;
    }
  
    .summary-item {
      padding: 10px;
      background: rgba(255, 255, 255, 0.5);
      border-radius: 8px;
    }
  
    .dark-mode .summary-item {
      background: rgba(45, 55, 72, 0.5);
    }
  }
  
  /* Add responsive styles for pagination */
  .history-pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 15px;
    margin: 20px;
    padding: 0 20px;
    flex-wrap: wrap;
  }
  
  @media (max-width: 480px) {
    .history-pagination {
      flex-direction: column;
      gap: 10px;
    }
  
    .pagination-button {
      width: 100%;
    }
  }
  
  /* Mobile Card View Styles */
  .history-cards {
    display: none;
    flex-direction: column;
    gap: 15px;
    padding: 10px;
  }
  
  .history-card-item {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: transform 0.2s ease;
  }
  
  .dark-mode .history-card-item {
    background: #2d3748;
  }
  
  .history-card-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 15px;
    background: rgba(59, 130, 246, 0.1);
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }
  
  .dark-mode .card-header {
    background: rgba(59, 130, 246, 0.2);
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }
  
  .card-time {
    font-weight: 600;
    color: #2d3748;
  }
  
  .dark-mode .card-time {
    color: #e2e8f0;
  }
  
  .card-content {
    padding: 15px;
  }
  
  .card-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }
  
  .card-row:last-child {
    border-bottom: none;
  }
  
  .dark-mode .card-row {
    border-bottom-color: rgba(255, 255, 255, 0.05);
  }
  
  .card-row .label {
    color: #718096;
    font-size: 14px;
  }
  
  .dark-mode .card-row .label {
    color: #a0aec0;
  }
  
  .card-row .value {
    font-weight: 500;
    color: #2d3748;
  }
  
  .dark-mode .card-row .value {
    color: #e2e8f0;
  }
  
  /* Status-specific styles */
  .history-card-item.normal {
    border-left: 4px solid #10b981;
  }
  
  .history-card-item.warning {
    border-left: 4px solid #ef4444;
  }
  
  .history-card-item.active {
    border-left: 4px solid #3b82f6;
  }
  
  .history-card-item.inactive {
    border-left: 4px solid #94a3b8;
  }
  
  /* Responsive Display Classes */
  .desktop-only {
    display: block;
  }
  
  .mobile-only {
    display: none;
  }
  
  /* Media Queries */
  @media (max-width: 768px) {
    .desktop-only {
      display: none;
    }
  
    .mobile-only {
      display: flex;
    }
  
    .history-cards {
      margin: 0 -10px;
    }
  
    .history-card-item {
      margin: 0 10px;
    }
  
    .card-header {
      padding: 10px 12px;
    }
  
    .card-content {
      padding: 12px;
    }
  
    .card-row {
      padding: 6px 0;
    }
  
    .card-row .label,
    .card-row .value {
      font-size: 13px;
    }
  }
  
  /* Status Badge Styles for Cards */
  .history-card-item .status-badge {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    text-transform: capitalize;
  }
  
  .history-card-item .status-badge.normal {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
  }
  
  .history-card-item .status-badge.warning {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }
  
  .history-card-item .status-badge.active {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
  }
  
  .history-card-item .status-badge.inactive {
    background: rgba(148, 163, 184, 0.1);
    color: #94a3b8;
  }
  
  .dark-mode .history-card-item .status-badge.normal {
    background: rgba(16, 185, 129, 0.2);
  }
  
  .dark-mode .history-card-item .status-badge.warning {
    background: rgba(239, 68, 68, 0.2);
  }
  
  .dark-mode .history-card-item .status-badge.active {
    background: rgba(59, 130, 246, 0.2);
  }
  
  .dark-mode .history-card-item .status-badge.inactive {
    background: rgba(148, 163, 184, 0.2);
  }

  .sidebar-section {
    margin: 1rem 0;
    padding: 0.5rem 0;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .sidebar-section-title {
    font-size: 0.9rem;
    color: #888;
    padding: 0.5rem 1rem;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .sidebar-section .sidebar-link {
    padding-left: 2rem;
  }

  .dark-mode .sidebar-section-title {
    color: #666;
  }

  .dark-mode .sidebar-section {
    border-top-color: rgba(255, 255, 255, 0.05);
  }

  /* Smoke Level Indicator Styles */
  .smoke-level-indicator {
    margin-top: 15px;
    padding: 10px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
  }

  .smoke-level-text {
    display: block;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
    text-transform: uppercase;
  }

  .smoke-level-bar {
    height: 8px;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
    overflow: hidden;
  }

  .smoke-level-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .smoke-level-low .smoke-level-fill {
    background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
  }

  .smoke-level-medium .smoke-level-fill {
    background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);
  }

  .smoke-level-high .smoke-level-fill {
    background: linear-gradient(90deg, #ef4444 0%, #f87171 100%);
  }

  .smoke-level-low .smoke-level-text {
    color: #10b981;
  }

  .smoke-level-medium .smoke-level-text {
    color: #f59e0b;
  }

  .smoke-level-high .smoke-level-text {
    color: #ef4444;
  }

  .dark-mode .smoke-level-indicator {
    background: rgba(255, 255, 255, 0.05);
  }

  .dark-mode .smoke-level-bar {
    background: rgba(255, 255, 255, 0.1);
  }

  /* Smoke Level Notification Styles */
  .smoke-level-notification {
    margin-top: 12px;
    padding: 10px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
    animation: fadeIn 0.3s ease-in-out;
  }

  .notification-icon {
    font-size: 18px;
  }

  .notification-text {
    font-size: 14px;
    color: #dc2626;
    font-weight: 500;
  }

  .dark-mode .smoke-level-notification {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.3);
  }

  .dark-mode .notification-text {
    color: #f87171;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    animation: fadeIn 0.3s ease-out;
  }

  .modal-content {
    background: white;
    border-radius: 12px;
    padding: 24px;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    animation: slideIn 0.3s ease-out;
  }

  .dark-mode .modal-content {
    background: #1e293b;
    color: #e2e8f0;
  }

  .modal-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .modal-icon {
    font-size: 24px;
  }

  .modal-header h3 {
    margin: 0;
    font-size: 20px;
    color: #dc2626;
  }

  .dark-mode .modal-header h3 {
    color: #f87171;
  }

  .modal-body {
    margin-bottom: 24px;
  }

  .modal-body p {
    margin: 8px 0;
    color: #4b5563;
    line-height: 1.5;
  }

  .dark-mode .modal-body p {
    color: #cbd5e1;
  }

  .modal-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  .modal-button {
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }

  .modal-button.confirm {
    background: #dc2626;
    color: white;
  }

  .modal-button.confirm:hover {
    background: #b91c1c;
  }

  .modal-button.dismiss {
    background: #f3f4f6;
    color: #4b5563;
  }

  .dark-mode .modal-button.dismiss {
    background: #334155;
    color: #e2e8f0;
  }

  .modal-button.dismiss:hover {
    background: #e5e7eb;
  }

  .dark-mode .modal-button.dismiss:hover {
    background: #475569;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .history-row {
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .history-row:hover {
    background-color: rgba(59, 130, 246, 0.1);
  }

  .dark-mode .history-row:hover {
    background-color: rgba(59, 130, 246, 0.2);
  }

  .history-card-item {
    cursor: pointer;
  }

  /* Modal Styles */
  .modal-content {
    max-width: 500px;
    width: 90%;
  }

  .modal-body {
    display: grid;
    gap: 12px;
  }

  .modal-body p {
    margin: 0;
    padding: 8px;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 6px;
  }

  .dark-mode .modal-body p {
    background: rgba(255, 255, 255, 0.05);
  }

  .modal-body strong {
    color: #3b82f6;
    margin-right: 8px;
  }

  .dark-mode .modal-body strong {
    color: #60a5fa;
  }

  /* History Modal Styles */
  .history-modal {
    max-width: 500px;
    width: 90%;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .dark-mode .history-modal {
    background: #1e293b;
    color: #e2e8f0;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }

  .dark-mode .modal-header {
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }

  .modal-header h3 {
    margin: 0;
    font-size: 20px;
    color: #2d3748;
  }

  .dark-mode .modal-header h3 {
    color: #e2e8f0;
  }

  .close-button {
    background: none;
    border: none;
    font-size: 24px;
    color: #718096;
    cursor: pointer;
    padding: 0;
    line-height: 1;
  }

  .dark-mode .close-button {
    color: #a0aec0;
  }

  .close-button:hover {
    color: #2d3748;
  }

  .dark-mode .close-button:hover {
    color: #e2e8f0;
  }

  .modal-body {
    padding: 20px;
  }

  .history-detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 8px;
    margin-bottom: 8px;
  }

  .dark-mode .history-detail-item {
    background: rgba(255, 255, 255, 0.05);
  }

  .history-detail-item:last-child {
    margin-bottom: 0;
  }

  .history-detail-item label {
    font-weight: 600;
    color: #4a5568;
  }

  .dark-mode .history-detail-item label {
    color: #a0aec0;
  }

  .history-detail-item span {
    color: #2d3748;
  }

  .dark-mode .history-detail-item span {
    color: #e2e8f0;
  }

  /* Make history rows clickable */
  .history-row {
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .history-row:hover {
    background-color: rgba(59, 130, 246, 0.1);
  }

  .dark-mode .history-row:hover {
    background-color: rgba(59, 130, 246, 0.2);
  }

  .history-card-item {
    cursor: pointer;
    transition: transform 0.2s ease;
  }

  .history-card-item:hover {
    transform: translateY(-2px);
  }

  /* Timer Completion Modal Styles */
  .timer-completion-modal {
    max-width: 400px;
    width: 90%;
    text-align: center;
  }

  .timer-completion-modal .modal-header {
    background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
    color: white;
    padding: 1.5rem;
    border-radius: 12px 12px 0 0;
    position: relative;
  }

  .timer-completion-modal .modal-icon {
    font-size: 2rem;
    margin-bottom: 1rem;
    display: block;
  }

  .timer-completion-modal .modal-header h3 {
    margin: 0;
    font-size: 1.5rem;
    color: white;
  }

  .timer-completion-modal .modal-body {
    padding: 2rem;
  }

  .timer-completion-modal .modal-body p {
    margin: 0.5rem 0;
    color: #4a5568;
    font-size: 1.1rem;
  }

  .timer-completion-modal .modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 2rem;
  }

  .timer-completion-modal .modal-button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 120px;
  }

  .timer-completion-modal .modal-button.restart {
    background: #4299e1;
    color: white;
  }

  .timer-completion-modal .modal-button.restart:hover {
    background: #3182ce;
    transform: translateY(-1px);
  }

  .timer-completion-modal .modal-button.close {
    background: #e2e8f0;
    color: #4a5568;
  }

  .timer-completion-modal .modal-button.close:hover {
    background: #cbd5e0;
  }

  /* Dark mode styles for timer completion modal */
  :root.dark-mode .timer-completion-modal .modal-body p {
    color: #e2e8f0;
  }

  :root.dark-mode .timer-completion-modal .modal-button.close {
    background: #4a5568;
    color: #e2e8f0;
  }

  :root.dark-mode .timer-completion-modal .modal-button.close:hover {
    background: #2d3748;
  }

  @media (max-width: 640px) {
    .timer-completion-modal .modal-actions {
      flex-direction: column;
    }

    .timer-completion-modal .modal-button {
      width: 100%;
    }
  }

  .sidebar-icon {
    font-size: 1.2rem;
    margin-right: 10px;
    display: inline-block;
    width: 24px;
    text-align: center;
  }
  </style>
  
  
  
  