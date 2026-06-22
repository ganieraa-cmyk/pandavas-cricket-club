// src/utils/cricket.js - COMPLETE WITH StatsCalculator
export class CricketEngine {
  constructor() {
    this.matchType = 't20';
    this.totalOvers = 20;
    this.powerplayOvers = 6;
    this.powerplayData = { overs: 0, runs: 0, wickets: 0 };
    this.freeHit = false;
    this.freeHitBowler = null;
    this.currentBowler = null;
    this.battingStats = [];
    this.bowlingStats = [];
    this.reset();
  }

  reset() {
    this.runs = 0;
    this.wickets = 0;
    this.balls = 0;
    this.ballsInOver = 0;
    this.overs = 0;
    this.extras = { wide: 0, noBall: 0, bye: 0, legBye: 0, penalty: 0 };
    this.fours = 0;
    this.sixes = 0;
    this.partnership = { runs: 0, balls: 0, wickets: 0 };
    this.fallOfWickets = [];
    this.ballByBall = [];
    this.isComplete = false;
    this.target = null;
    this.currentOverRuns = 0;
    this.currentOverWickets = 0;
    this._onOverComplete = null;
    this.currentBatsmen = [];
    this.freeHit = false;
    this.powerplayData = { overs: 0, runs: 0, wickets: 0 };
    this.wideByeRuns = 0;
    this.noBallByeRuns = 0;
    this.currentBowlerData = null;
  }

  setMatchType(type, overs) {
    this.matchType = type || 't20';
    this.totalOvers = overs || 20;
    
    switch(this.matchType) {
      case 't20': this.powerplayOvers = 6; break;
      case 'odi': this.powerplayOvers = 10; break;
      case 'test': this.powerplayOvers = 0; break;
      default: this.powerplayOvers = 6;
    }
    return this;
  }

  setTarget(target) {
    this.target = target;
    return this;
  }

  addRuns(runs, type = 'normal', shotZone = 'mid') {
    this.runs += runs;
    this.balls++;
    this.ballsInOver++;
    this.partnership.runs += runs;
    this.partnership.balls++;
    this.currentOverRuns += runs;
    
    if (runs === 4) this.fours++;
    if (runs === 6) this.sixes++;
    
    if (this.powerplayOvers > 0) {
      const currentOver = Math.floor(this.balls / 6);
      if (currentOver < this.powerplayOvers) {
        this.powerplayData.overs = currentOver;
        this.powerplayData.runs += runs;
      }
    }
    
    if (this.ballsInOver === 6) {
      this.overs++;
      this.ballsInOver = 0;
      if (this._onOverComplete) {
        this._onOverComplete({
          over: this.overs,
          runs: this.currentOverRuns,
          wickets: this.currentOverWickets,
          bowler: this.currentBowler
        });
      }
      this.currentOverRuns = 0;
      this.currentOverWickets = 0;
    }
    
    this.ballByBall.push({ 
      runs, type, ball: this.balls, over: this.overs,
      isLegal: true, shotZone, freeHit: this.freeHit
    });
    
    this.freeHit = false;
    
    if (this.target && this.runs >= this.target) {
      this.isComplete = true;
    }
    
    return this;
  }

  addWide(extraRuns = 0) {
    const totalRuns = 1 + extraRuns;
    this.runs += totalRuns;
    this.extras.wide += totalRuns;
    
    this.ballByBall.push({ 
      runs: totalRuns, type: 'wide', ball: this.balls + 1, over: this.overs,
      isLegal: false, extraRuns, wideBye: extraRuns > 0, freeHit: false
    });
    return this;
  }

  addWideBye(runs = 1) {
    const totalRuns = 1 + runs;
    this.runs += totalRuns;
    this.extras.wide += totalRuns;
    
    this.ballByBall.push({ 
      runs: totalRuns, type: 'wide-bye', ball: this.balls + 1, over: this.overs,
      isLegal: false, extraRuns: runs, wideBye: true, freeHit: false
    });
    return this;
  }

  addNoBall(extraRuns = 0) {
    const totalRuns = 1 + extraRuns;
    this.runs += totalRuns;
    this.extras.noBall += totalRuns;
    
    this.freeHit = true;
    this.freeHitBowler = this.currentBowler?.id || null;
    
    this.ballByBall.push({ 
      runs: totalRuns, type: 'no-ball', ball: this.balls + 1, over: this.overs,
      isLegal: false, extraRuns, freeHit: true
    });
    return this;
  }

  addNoBallBye(runs = 1) {
    const totalRuns = 1 + runs;
    this.runs += totalRuns;
    this.extras.noBall += totalRuns;
    
    this.freeHit = true;
    this.freeHitBowler = this.currentBowler?.id || null;
    
    this.ballByBall.push({ 
      runs: totalRuns, type: 'no-ball-bye', ball: this.balls + 1, over: this.overs,
      isLegal: false, extraRuns: runs, freeHit: true
    });
    return this;
  }

  addBye(runs = 1) {
    this.runs += runs;
    this.extras.bye += runs;
    this.balls++;
    this.ballsInOver++;
    this.partnership.runs += runs;
    this.partnership.balls++;
    this.currentOverRuns += runs;
    
    if (this.ballsInOver === 6) {
      this.overs++;
      this.ballsInOver = 0;
      if (this._onOverComplete) {
        this._onOverComplete({
          over: this.overs, runs: this.currentOverRuns,
          wickets: this.currentOverWickets, bowler: this.currentBowler
        });
      }
      this.currentOverRuns = 0;
      this.currentOverWickets = 0;
    }
    
    this.ballByBall.push({ 
      runs, type: 'bye', ball: this.balls, over: this.overs,
      isLegal: true, freeHit: this.freeHit
    });
    this.freeHit = false;
    return this;
  }

  addLegBye(runs = 1) {
    this.runs += runs;
    this.extras.legBye += runs;
    this.balls++;
    this.ballsInOver++;
    this.partnership.runs += runs;
    this.partnership.balls++;
    this.currentOverRuns += runs;
    
    if (this.ballsInOver === 6) {
      this.overs++;
      this.ballsInOver = 0;
      if (this._onOverComplete) {
        this._onOverComplete({
          over: this.overs, runs: this.currentOverRuns,
          wickets: this.currentOverWickets, bowler: this.currentBowler
        });
      }
      this.currentOverRuns = 0;
      this.currentOverWickets = 0;
    }
    
    this.ballByBall.push({ 
      runs, type: 'leg-bye', ball: this.balls, over: this.overs,
      isLegal: true, freeHit: this.freeHit
    });
    this.freeHit = false;
    return this;
  }

  addWicket(type = 'bowled', batsmanName = 'Unknown') {
    if (this.freeHit && (type === 'bowled' || type === 'caught' || type === 'lbw' || type === 'stumped')) {
      this.ballByBall.push({
        runs: 0, type: 'free-hit-not-out', ball: this.balls + 1, over: this.overs,
        isLegal: true, freeHit: true
      });
      this.freeHit = false;
      return this;
    }
    
    this.wickets++;
    this.partnership.wickets++;
    this.balls++;
    this.ballsInOver++;
    this.currentOverWickets++;
    
    this.fallOfWickets.push({
      batsman: batsmanName, runs: this.runs, overs: this.getOvers(),
      wicketNumber: this.wickets, type: type
    });
    
    if (this.ballsInOver === 6) {
      this.overs++;
      this.ballsInOver = 0;
      if (this._onOverComplete) {
        this._onOverComplete({
          over: this.overs, runs: this.currentOverRuns,
          wickets: this.currentOverWickets, bowler: this.currentBowler
        });
      }
      this.currentOverRuns = 0;
      this.currentOverWickets = 0;
    }
    
    this.ballByBall.push({ 
      runs: 0, type: `wicket-${type}`, ball: this.balls, over: this.overs,
      isLegal: true, batsman: batsmanName, freeHit: false
    });
    
    this.freeHit = false;
    
    if (this.wickets >= 10) {
      this.isComplete = true;
    }
    
    return this;
  }

  addRunOut(batsmanName = 'Unknown', isStriker = true) {
    this.wickets++;
    this.partnership.wickets++;
    this.balls++;
    this.ballsInOver++;
    this.currentOverWickets++;
    
    this.fallOfWickets.push({
      batsman: batsmanName, runs: this.runs, overs: this.getOvers(),
      wicketNumber: this.wickets, type: 'run-out'
    });
    
    if (this.ballsInOver === 6) {
      this.overs++;
      this.ballsInOver = 0;
      if (this._onOverComplete) {
        this._onOverComplete({
          over: this.overs, runs: this.currentOverRuns,
          wickets: this.currentOverWickets, bowler: this.currentBowler
        });
      }
      this.currentOverRuns = 0;
      this.currentOverWickets = 0;
    }
    
    this.ballByBall.push({ 
      runs: 0, type: 'wicket-run-out', ball: this.balls, over: this.overs,
      isLegal: true, batsman: batsmanName, isStriker, freeHit: this.freeHit
    });
    
    this.freeHit = false;
    
    if (this.wickets >= 10) {
      this.isComplete = true;
    }
    
    return this;
  }

  addRetiredOut(batsmanName = 'Unknown') {
    this.wickets++;
    this.partnership.wickets++;
    
    this.fallOfWickets.push({
      batsman: batsmanName, runs: this.runs, overs: this.getOvers(),
      wicketNumber: this.wickets, type: 'retired-out'
    });
    
    this.ballByBall.push({ 
      runs: 0, type: 'wicket-retired-out', ball: this.balls + 1, over: this.overs,
      isLegal: false, batsman: batsmanName
    });
    
    if (this.wickets >= 10) {
      this.isComplete = true;
    }
    
    return this;
  }

  addPenalty(runs = 5) {
    this.runs += runs;
    this.extras.penalty += runs;
    
    this.ballByBall.push({ 
      runs: runs, type: 'penalty', ball: this.balls + 1, over: this.overs,
      isLegal: false, penalty: true
    });
    return this;
  }

  getRunRate() {
    const overs = this.overs + (this.ballsInOver / 6);
    return overs > 0 ? (this.runs / overs).toFixed(2) : '0.00';
  }

  getRequiredRunRate() {
    if (!this.target) return '0.00';
    const overs = this.overs + (this.ballsInOver / 6);
    const oversRemaining = this.totalOvers - overs;
    const required = this.target - this.runs;
    if (oversRemaining <= 0) return required > 0 ? '∞' : '0.00';
    return (required / oversRemaining).toFixed(2);
  }

  getOvers() {
    return this.overs + '.' + this.ballsInOver;
  }

  getScore() {
    return {
      runs: this.runs, wickets: this.wickets, overs: this.getOvers(),
      runRate: this.getRunRate(), requiredRunRate: this.getRequiredRunRate(),
      extras: this.extras, fours: this.fours, sixes: this.sixes,
      partnership: this.partnership, fallOfWickets: this.fallOfWickets,
      ballByBall: this.ballByBall, powerplay: this.powerplayData,
      target: this.target,
      isComplete: this.isComplete || (this.target && this.runs >= this.target) || this.wickets >= 10,
      freeHit: this.freeHit, battingStats: this.battingStats, bowlingStats: this.bowlingStats
    };
  }

  onOverComplete(callback) {
    this._onOverComplete = callback;
    return this;
  }
}

// ✅ StatsCalculator - NOW EXPORTED
export class StatsCalculator {
  static calculateBattingStats(innings) {
    const totalRuns = innings.reduce((sum, i) => sum + (i.runs || 0), 0);
    const totalBalls = innings.reduce((sum, i) => sum + (i.balls || 0), 0);
    const dismissals = innings.filter(i => i.out).length;
    const fours = innings.reduce((sum, i) => sum + (i.fours || 0), 0);
    const sixes = innings.reduce((sum, i) => sum + (i.sixes || 0), 0);
    const notOuts = innings.filter(i => !i.out).length;
    
    return {
      runs: totalRuns,
      balls: totalBalls,
      fours, sixes,
      dismissals,
      notOuts,
      average: dismissals > 0 ? (totalRuns / dismissals).toFixed(2) : totalRuns.toString(),
      strikeRate: totalBalls > 0 ? ((totalRuns / totalBalls) * 100).toFixed(2) : '0.00',
      highestScore: Math.max(...innings.map(i => i.runs || 0), 0),
      fifties: innings.filter(i => (i.runs || 0) >= 50 && (i.runs || 0) < 100).length,
      hundreds: innings.filter(i => (i.runs || 0) >= 100).length,
      ducks: innings.filter(i => (i.runs || 0) === 0 && i.out).length
    };
  }

  static calculateBowlingStats(innings) {
    const totalWickets = innings.reduce((sum, i) => sum + (i.wickets || 0), 0);
    const totalRuns = innings.reduce((sum, i) => sum + (i.runsConceded || 0), 0);
    const totalOvers = innings.reduce((sum, i) => sum + (i.overs || 0), 0);
    const maidens = innings.reduce((sum, i) => sum + (i.maidens || 0), 0);
    
    return {
      wickets: totalWickets,
      runs: totalRuns,
      overs: totalOvers,
      maidens,
      economy: totalOvers > 0 ? (totalRuns / totalOvers).toFixed(2) : '0.00',
      average: totalWickets > 0 ? (totalRuns / totalWickets).toFixed(2) : '0.00',
      strikeRate: totalWickets > 0 ? ((totalOvers * 6) / totalWickets).toFixed(2) : '0.00'
    };
  }

  static getOrangeCap(batters) {
    return batters.sort((a, b) => (b.runs || 0) - (a.runs || 0))[0] || null;
  }

  static getPurpleCap(bowlers) {
    return bowlers.sort((a, b) => (b.wickets || 0) - (a.wickets || 0))[0] || null;
  }

  static getMVP(players) {
    return players.sort((a, b) => {
      const scoreA = (a.batting?.runs || 0) + (a.bowling?.wickets || 0) * 20 + (a.fielding?.catches || 0) * 10;
      const scoreB = (b.batting?.runs || 0) + (b.bowling?.wickets || 0) * 20 + (b.fielding?.catches || 0) * 10;
      return scoreB - scoreA;
    })[0] || null;
  }
}
