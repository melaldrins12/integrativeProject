import { db } from '../firebaseConfig';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';

const SESSIONS_COLLECTION = 'smokingSessions';

export const smokingSessionService = {
  // Start a new smoking session
  async startSession(sessionData) {
    try {
      console.log('Starting new session with data:', sessionData);
      const sessionRef = doc(collection(db, SESSIONS_COLLECTION));
      const session = {
        id: sessionRef.id,
        startTime: serverTimestamp(),
        endTime: null,
        status: 'active',
        targetDuration: sessionData.duration,
        currentDuration: 0,
        temperatureData: [],
        smokeLevelData: [],
        timestamps: [],
        lastUpdated: serverTimestamp(),
        startedBy: sessionData.adminId,
        lastUpdatedBy: sessionData.adminId,
        ...sessionData
      };

      await setDoc(sessionRef, session);
      console.log('Session started successfully:', session);
      return session;
    } catch (error) {
      console.error('Error starting session:', error);
      throw error;
    }
  },

  // Get active session
  async getActiveSession() {
    try {
      console.log('Fetching active session...');
      const q = query(
        collection(db, SESSIONS_COLLECTION),
        where('status', '==', 'active')
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        console.log('No active session found');
        return null;
      }
      
      const session = {
        id: querySnapshot.docs[0].id,
        ...querySnapshot.docs[0].data()
      };
      console.log('Active session found:', session);
      return session;
    } catch (error) {
      console.error('Error fetching active session:', error);
      throw error;
    }
  },

  // Update session data
  async updateSession(sessionId, updateData) {
    try {
      console.log('Updating session:', sessionId, 'with data:', updateData);
      const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
      const update = {
        ...updateData,
        lastUpdated: serverTimestamp(),
        lastUpdatedBy: updateData.adminId
      };
      
      await updateDoc(sessionRef, update);
      console.log('Session updated successfully');
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  },

  // End session
  async endSession(sessionId, adminId) {
    try {
      console.log('Ending session:', sessionId);
      const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
      await updateDoc(sessionRef, {
        status: 'completed',
        endTime: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        lastUpdatedBy: adminId
      });
      console.log('Session ended successfully');
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  },

  // Get session history
  async getSessionHistory(limit = 10) {
    try {
      console.log('Fetching session history...');
      const q = query(
        collection(db, SESSIONS_COLLECTION),
        where('status', '==', 'completed')
      );
      
      const querySnapshot = await getDocs(q);
      const sessions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Session history fetched:', sessions);
      return sessions;
    } catch (error) {
      console.error('Error fetching session history:', error);
      throw error;
    }
  }
}; 