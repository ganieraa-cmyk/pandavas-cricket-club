// src/utils/undo-manager.js - Deep Copy Undo System
export class UndoManager {
  constructor() {
    this.history = [];
    this.maxHistory = 50;
  }

  // Deep clone using structuredClone or JSON fallback
  deepClone(obj) {
    try {
      if (typeof structuredClone === 'function') {
        return structuredClone(obj);
      }
    } catch (e) {
      // Fallback
    }
    return JSON.parse(JSON.stringify(obj));
  }

  saveState(engine) {
    const state = this.deepClone({
      runs: engine.runs,
      wickets: engine.wickets,
      balls: engine.balls,
      ballsInOver: engine.ballsInOver,
      overs: engine.overs,
      extras: { ...engine.extras },
      fours: engine.fours,
      sixes: engine.sixes,
      partnership: { ...engine.partnership },
      fallOfWickets: [...engine.fallOfWickets],
      ballByBall: [...engine.ballByBall],
      powerplayData: { ...engine.powerplayData },
      battingStats: engine.battingStats ? [...engine.battingStats] : [],
      bowlingStats: engine.bowlingStats ? [...engine.bowlingStats] : [],
      currentBatsmen: engine.currentBatsmen ? [...engine.currentBatsmen] : [],
      currentBowler: engine.currentBowler ? this.deepClone(engine.currentBowler) : null,
      target: engine.target || null,
      totalOvers: engine.totalOvers || 20,
      freeHit: engine.freeHit || false,
      matchType: engine.matchType || 't20',
      isComplete: engine.isComplete || false,
      currentOverRuns: engine.currentOverRuns || 0,
      currentOverWickets: engine.currentOverWickets || 0
    });

    this.history.push(JSON.stringify(state));
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    return this;
  }

  undo(engine) {
    if (this.history.length === 0) return false;

    try {
      const stateStr = this.history.pop();
      const state = JSON.parse(stateStr);

      // Restore all properties
      Object.keys(state).forEach(key => {
        if (key === 'currentBowler' && state.currentBowler) {
          engine.currentBowler = {
            ...state.currentBowler,
            currentOver: { runs: 0, balls: 0, wickets: 0 }
          };
        } else if (key === 'extras') {
          engine.extras = { ...state.extras };
        } else if (key === 'partnership') {
          engine.partnership = { ...state.partnership };
        } else if (key === 'powerplayData') {
          engine.powerplayData = { ...state.powerplayData };
        } else if (Array.isArray(state[key])) {
          engine[key] = [...state[key]];
        } else {
          engine[key] = state[key];
        }
      });

      // Rebuild derived data
      engine._onOverComplete = null;
      engine.ballByBall = state.ballByBall || [];
      engine.fallOfWickets = state.fallOfWickets || [];

      return true;
    } catch (error) {
      console.error('Undo error:', error);
      return false;
    }
  }

  canUndo() {
    return this.history.length > 0;
  }

  clear() {
    this.history = [];
    return this;
  }

  getHistoryLength() {
    return this.history.length;
  }
}
