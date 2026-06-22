// src/utils/realtime-sync.js - Realtime Sync with Offline Queue
import { firestore } from '../firebase-config.js';

export class RealtimeSync {
  constructor(matchId) {
    this.matchId = matchId;
    this.listeners = [];
    this.isSyncing = false;
    this.queueKey = `syncQueue_${matchId}`;
    this.isListening = false;
  }

  startSync(callback) {
    if (this.isListening || !this.matchId) return null;
    this.isListening = true;
    
    const unsubscribe = firestore.listen('matches', (data) => {
      const match = data.find(m => m.id === this.matchId);
      if (match && callback) {
        callback(match);
      }
    }, [{ field: 'id', operator: '==', value: this.matchId }]);
    
    this.listeners.push(unsubscribe);
    
    // Process any queued items
    this.processQueue();
    
    return unsubscribe;
  }

  async pushUpdate(data) {
    if (this.isSyncing) {
      this.queueUpdate(data);
      return;
    }
    
    this.isSyncing = true;
    try {
      await firestore.update('matches', this.matchId, {
        ...data,
        updatedAt: new Date().toISOString()
      });
      console.log('✅ Sync successful');
    } catch (error) {
      console.error('Sync error:', error);
      this.queueUpdate(data);
    } finally {
      this.isSyncing = false;
      await this.processQueue();
    }
  }

  queueUpdate(data) {
    const queue = JSON.parse(localStorage.getItem(this.queueKey) || '[]');
    queue.push({ 
      matchId: this.matchId, 
      data, 
      timestamp: Date.now(),
      retries: 0
    });
    localStorage.setItem(this.queueKey, JSON.stringify(queue));
    console.log('📦 Queued for sync');
  }

  async processQueue() {
    const queue = JSON.parse(localStorage.getItem(this.queueKey) || '[]');
    if (queue.length === 0) return;
    
    console.log(`🔄 Processing ${queue.length} queued items`);
    const failed = [];
    
    for (const item of queue) {
      try {
        await firestore.update('matches', item.matchId, item.data);
        console.log(`✅ Queue item processed: ${item.timestamp}`);
      } catch (error) {
        console.error('Queue process error:', error);
        item.retries = (item.retries || 0) + 1;
        if (item.retries < 5) {
          failed.push(item);
        } else {
          console.warn('⚠️ Max retries reached, dropping item');
        }
      }
    }
    
    localStorage.setItem(this.queueKey, JSON.stringify(failed));
  }

  async retryFailed() {
    await this.processQueue();
  }

  stopSync() {
    this.isListening = false;
    this.listeners.forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') unsubscribe();
    });
    this.listeners = [];
  }

  getQueueLength() {
    const queue = JSON.parse(localStorage.getItem(this.queueKey) || '[]');
    return queue.length;
  }

  clearQueue() {
    localStorage.removeItem(this.queueKey);
  }
}
