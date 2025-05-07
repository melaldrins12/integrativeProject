import { db } from '../firebaseConfig';
import { collection, addDoc, query, where, orderBy, getDocs, limit } from 'firebase/firestore';

class SensorManager {
  constructor() {
    this.sensors = new Map();
    this.dataInterval = null;
    this.callbacks = new Map();
    this.lastFetchTime = null;
  }

  // Register a new sensor
  registerSensor(sensorId, type, config = {}) {
    this.sensors.set(sensorId, {
      type,
      config,
      lastReading: null,
      lastUpdate: null
    });
  }

  // Unregister a sensor
  unregisterSensor(sensorId) {
    this.sensors.delete(sensorId);
    this.callbacks.delete(sensorId);
  }

  // Add callback for sensor updates
  onSensorUpdate(sensorId, callback) {
    this.callbacks.set(sensorId, callback);
  }

  // Remove callback for sensor updates
  removeSensorCallback(sensorId) {
    this.callbacks.delete(sensorId);
  }

  // Update sensor reading
  async updateSensorReading(sensorId, reading) {
    const sensor = this.sensors.get(sensorId);
    if (!sensor) {
      console.error(`Sensor ${sensorId} not found`);
      return;
    }

    const timestamp = new Date();
    sensor.lastReading = reading;
    sensor.lastUpdate = timestamp;

    // Store reading in Firestore
    try {
      await addDoc(collection(db, 'sensorReadings'), {
        sensorId,
        type: sensor.type,
        reading,
        timestamp,
        ...sensor.config
      });
    } catch (error) {
      console.error('Error storing sensor reading:', error);
    }

    // Notify callbacks
    const callback = this.callbacks.get(sensorId);
    if (callback) {
      callback(reading, timestamp);
    }
  }

  // Get latest reading for a sensor
  getLatestReading(sensorId) {
    const sensor = this.sensors.get(sensorId);
    return sensor ? sensor.lastReading : null;
  }

  // Get latest sensor data for chart
  async getLatestSensorData() {
    try {
      const now = new Date();
      const startTime = new Date(now.getTime() - (24 * 60 * 60 * 1000)); // Last 24 hours

      // Query for temperature data
      const tempQuery = query(
        collection(db, 'sensorReadings'),
        where('type', '==', 'temperature'),
        where('timestamp', '>=', startTime),
        orderBy('timestamp', 'desc'),
        limit(20)
      );

      // Query for smoke level data
      const smokeQuery = query(
        collection(db, 'sensorReadings'),
        where('type', '==', 'smokeLevel'),
        where('timestamp', '>=', startTime),
        orderBy('timestamp', 'desc'),
        limit(20)
      );

      const [tempSnapshot, smokeSnapshot] = await Promise.all([
        getDocs(tempQuery),
        getDocs(smokeQuery)
      ]);

      const temperatureData = tempSnapshot.docs.map(doc => ({
        value: doc.data().reading,
        timestamp: doc.data().timestamp.toDate()
      })).reverse();

      const smokeData = smokeSnapshot.docs.map(doc => ({
        value: doc.data().reading,
        timestamp: doc.data().timestamp.toDate()
      })).reverse();

      // Combine the data
      const combinedData = {
        temperature: temperatureData.length > 0 ? temperatureData[temperatureData.length - 1].value : 0,
        smokeLevel: smokeData.length > 0 ? smokeData[smokeData.length - 1].value : 0,
        timestamp: now,
        history: {
          temperature: temperatureData,
          smokeLevel: smokeData
        }
      };

      this.lastFetchTime = now;
      return combinedData;
    } catch (error) {
      console.error('Error fetching latest sensor data:', error);
      return null;
    }
  }

  // Get sensor history
  async getSensorHistory(sensorId, startTime, endTime) {
    try {
      const q = query(
        collection(db, 'sensorReadings'),
        where('sensorId', '==', sensorId),
        where('timestamp', '>=', startTime),
        where('timestamp', '<=', endTime),
        orderBy('timestamp', 'asc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching sensor history:', error);
      return [];
    }
  }

  // Start data collection for all sensors
  startDataCollection(interval = 5000) {
    if (this.dataInterval) {
      clearInterval(this.dataInterval);
    }

    this.dataInterval = setInterval(async () => {
      try {
        // Fetch real data from Curve sensor
        const response = await fetch('YOUR_CURVE_SENSOR_API_ENDPOINT');
        if (!response.ok) {
          throw new Error('Failed to fetch sensor data');
        }
        
        const sensorData = await response.json();
        
        // Update each registered sensor with real data
        this.sensors.forEach((sensor, sensorId) => {
          let reading;
          switch (sensor.type) {
            case 'temperature':
              reading = sensorData.temperature;
              break;
            case 'smokeLevel':
              reading = sensorData.smokeLevel;
              break;
            default:
              reading = sensorData[sensor.type];
          }
          
          if (reading !== undefined) {
            this.updateSensorReading(sensorId, reading);
          }
        });
      } catch (error) {
        console.error('Error fetching real sensor data:', error);
        // Fallback to simulation if real data fetch fails
        this.sensors.forEach((sensor, sensorId) => {
          const reading = this.simulateSensorReading(sensor);
          this.updateSensorReading(sensorId, reading);
        });
      }
    }, interval);
  }

  // Stop data collection
  stopDataCollection() {
    if (this.dataInterval) {
      clearInterval(this.dataInterval);
      this.dataInterval = null;
    }
  }

  // Simulate sensor reading (fallback method)
  simulateSensorReading(sensor) {
    switch (sensor.type) {
      case 'temperature':
        return Math.random() * 30; // Simulate temperature between 0-30°C
      case 'smokeLevel':
        return Math.random() * 100; // Simulate smoke level between 0-100%
      default:
        return Math.random() * 100; // Default simulation
    }
  }
}

// Create and export a singleton instance
const sensorManager = new SensorManager();
export default sensorManager; 