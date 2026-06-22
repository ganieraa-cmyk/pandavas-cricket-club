// src/pages/live-scoring.js - CLEAN VERSION
import { CricketEngine } from '../utils/cricket.js';
import { UndoManager } from '../utils/undo-manager.js';
import { generateMatchResult } from '../utils/match-result.js';
import { updatePointsTable } from '../utils/tournament-utils.js';
import { RealtimeSync } from '../utils/realtime-sync.js';
import { firestore } from '../firebase-config.js';

let scoringEngine = new CricketEngine();
let undoManager = new UndoManager();
let currentMatchId = null;
let currentInnings = 1;
let isSaving = false;
let realtimeSync = null;

function hydrateScoringEngine(engine, savedData) {
  if (!savedData) return engine;
  
  engine.runs = savedData.runs || 0;
  engine.wickets = savedData.wickets || 0;
  engine.balls = savedData.balls || 0;
  engine.ballsInOver = savedData.ballsInOver || 0;
  engine.overs = savedData.overs || 0;
  engine.extras = savedData.extras || { wide: 0, noBall: 0, bye: 0, legBye: 0, penalty: 0 };
  engine.fours = savedData.fours || 0;
  engine.sixes = savedData.sixes || 0;
  engine.partnership = savedData.partnership || { runs: 0, balls: 0, wickets: 0 };
  engine.fallOfWickets = savedData.fallOfWickets || [];
  engine.ballByBall = savedData.ballByBall || [];
  engine.target = savedData.target || null;
  engine.totalOvers = savedData.totalOvers || 20;
  engine.matchType = savedData.matchType || 't20';
  engine.powerplayData = savedData.powerplayData || { overs: 0, runs: 0, wickets: 0 };
  engine.freeHit = savedData.freeHit || false;
  
  return engine;
}

function saveStateBeforeAction() {
  undoManager.saveState(scoringEngine);
}

export async function LiveScoring(params) {
  currentMatchId = params?.matchId || null;
  
  if (currentMatchId) {
    const match = await firestore.getOne('matches', currentMatchId);
    if (match) {
      if (match.scoring) {
        scoringEngine.reset();
        hydrateScoringEngine(scoringEngine, match.scoring);
      }
      if (match.target) {
        scoringEngine.setTarget(match.target);
      }
      if (match.overs) {
        scoringEngine.totalOvers = match.overs;
      }
      currentInnings = match.currentInnings || 1;
      
      if (!realtimeSync) {
        realtimeSync = new RealtimeSync(currentMatchId);
        realtimeSync.startSync((data) => {
          if (data.scoring) {
            hydrateScoringEngine(scoringEngine, data.scoring);
            updateScoreDisplay();
          }
        });
      }
    }
  }
  
  return renderScoringUI();
}

function renderScoringUI() {
  const score = scoringEngine.getScore();
  
  return `
    <div class="live-scoring">
      <div class="flex justify-between items-center mb-16">
        <h2 class="text-gold" style="font-size: 28px; font-weight: 700;">
          <i class="fas fa-baseball-ball"></i> Live Scoring
        </h2>
        <div class="flex gap-8 flex-wrap">
          <button class="btn btn-outline-gold" onclick="window.undoLastBall()">
            <i class="fas fa-undo"></i> Undo
          </button>
          <button class="btn btn-outline-gold" onclick="window.saveScore()" id="saveBtn">
            <i class="fas fa-save"></i> Save
          </button>
          <button class="btn btn-outline-gold" onclick="window.shareLiveScore()">
            <i class="fas fa-share-alt"></i> Share
          </button>
          <button class="btn btn-danger" onclick="window.resetScore()">
            <i class="fas fa-redo"></i> Reset
          </button>
        </div>
      </div>
      
      <!-- Score Display -->
      <div class="card" style="margin-bottom: 20px; background: linear-gradient(145deg, var(--black-card), var(--black)); border: 2px solid var(--gold);">
        <div class="flex justify-between items-center">
          <div>
            <div style="font-size: 48px; font-weight: 800; background: var(--gold-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
              ${score.runs}/${score.wickets}
            </div>
            <div style="font-size: 20px; color: var(--text-secondary);">
              Overs: ${score.overs} • RR: ${score.runRate}
            </div>
            ${score.target ? `
              <div style="font-size: 16px; color: var(--gold);">
                Target: ${score.target} • Req RR: ${score.requiredRunRate}
              </div>
            ` : ''}
          </div>
          <div style="text-align: right;">
            <div style="font-size: 16px; color: var(--text-secondary);">Partnership</div>
            <div style="font-size: 24px; font-weight: 700; color: var(--gold);">
              ${score.partnership.runs} (${score.partnership.balls}b)
            </div>
            <div style="font-size: 14px; color: var(--text-muted);">
              4s: ${score.fours} • 6s: ${score.sixes}
            </div>
            ${score.freeHit ? '<div style="color: #F59E0B; font-size: 14px;">🔄 Free Hit</div>' : ''}
          </div>
        </div>
      </div>
      
      <!-- Extras Display -->
      <div id="extrasDisplay" class="flex flex-wrap gap-8" style="margin-bottom: 16px;">
        ${['wide', 'noBall', 'bye', 'legBye', 'penalty'].map(type => `
          <span style="background: var(--black-card); padding: 4px 12px; border-radius: 12px; font-size: 12px; border: 1px solid rgba(255,215,0,0.1);">
            ${type.toUpperCase()}: ${score.extras[type] || 0}
          </span>
        `).join('')}
      </div>
      
      ${scoringEngine.powerplayOvers > 0 ? `
        <div style="margin-bottom: 16px; font-size: 14px; color: var(--text-secondary);">
          Powerplay: ${Math.floor(scoringEngine.balls / 6)}/${scoringEngine.powerplayOvers} overs • 
          ${score.powerplay.runs} runs • ${score.powerplay.wickets} wickets
        </div>
      ` : ''}
      
      <!-- Scoring Buttons -->
      <div style="margin-bottom: 20px;">
        <h4 style="margin-bottom: 12px; color: var(--text-secondary);">Scoring Options</h4>
        
        <div class="scoring-grid">
          ${[0,1,2,3,4,5,6].map(runs => `
            <button class="scoring-btn" onclick="window.addRuns(${runs})">
              ${runs === 4 ? '🏏 4' : runs === 6 ? '🚀 6' : runs}
            </button>
          `).join('')}
        </div>
        
        <div style="margin-top: 10px;">
          <h5 style="color: var(--text-muted); font-size: 12px; margin-bottom: 6px;">Wide</h5>
          <div class="scoring-grid" style="grid-template-columns: repeat(4, 1fr);">
            ${[
              { label: 'Wide', fn: 'addWide', args: 0 },
              { label: 'Wide +1', fn: 'addWide', args: 1 },
              { label: 'Wide +2', fn: 'addWide', args: 2 },
              { label: 'Wide +3', fn: 'addWide', args: 3 },
              { label: 'Wide +4', fn: 'addWide', args: 4 },
              { label: 'Wide +5', fn: 'addWide', args: 5 },
              { label: 'Wide +6', fn: 'addWide', args: 6 },
              { label: 'Wide Bye', fn: 'addWideBye', args: 0 }
            ].map(item => `
              <button class="scoring-btn special" onclick="window.${item.fn}(${item.args})">
                ${item.label}
              </button>
            `).join('')}
          </div>
        </div>
        
        <div style="margin-top: 10px;">
          <h5 style="color: var(--text-muted); font-size: 12px; margin-bottom: 6px;">No Ball</h5>
          <div class="scoring-grid" style="grid-template-columns: repeat(4, 1fr);">
            ${[
              { label: 'No Ball', fn: 'addNoBall', args: 0 },
              { label: 'NB +1', fn: 'addNoBall', args: 1 },
              { label: 'NB +2', fn: 'addNoBall', args: 2 },
              { label: 'NB +3', fn: 'addNoBall', args: 3 },
              { label: 'NB +4', fn: 'addNoBall', args: 4 },
              { label: 'NB +5', fn: 'addNoBall', args: 5 },
              { label: 'NB +6', fn: 'addNoBall', args: 6 },
              { label: 'NB Bye', fn: 'addNoBallBye', args: 0 }
            ].map(item => `
              <button class="scoring-btn special" onclick="window.${item.fn}(${item.args})">
                ${item.label}
              </button>
            `).join('')}
          </div>
        </div>
        
        <div style="margin-top: 10px;">
          <div class="scoring-grid" style="grid-template-columns: repeat(4, 1fr);">
            ${['Bye', 'Leg Bye'].map(type => `
              <button class="scoring-btn extra" onclick="window.add${type.replace(' ', '')}()">
                ${type}
              </button>
            `).join('')}
            ${['Wicket', 'Run Out', 'Retired Out'].map(type => `
              <button class="scoring-btn" style="border-color: #DC2626; color: #DC2626;" onclick="window.add${type.replace(' ', '')}()">
                ${type}
              </button>
            `).join('')}
            <button class="scoring-btn" style="border-color: #FF6B6B; color: #FF6B6B;" onclick="window.addPenalty()">
              Penalty
            </button>
          </div>
        </div>
      </div>
      
      ${score.fallOfWickets.length > 0 ? `
        <div class="card" style="margin-bottom: 16px;">
          <h4 style="color: var(--text-secondary);">Fall of Wickets</h4>
          <div class="flex flex-wrap gap-8">
            ${score.fallOfWickets.map(fow => `
              <span style="background: rgba(220,38,38,0.1); padding: 4px 12px; border-radius: 12px; font-size: 12px; border: 1px solid rgba(220,38,38,0.2);">
                ${fow.wicketNumber}-${fow.batsman} (${fow.runs}, ${fow.overs} ov)
              </span>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      <div class="card">
        <h4 style="margin-bottom: 12px; color: var(--text-secondary);">
          <i class="fas fa-comment"></i> Ball-by-Ball
        </h4>
        <div id="ballByBall" style="max-height: 200px; overflow-y: auto; font-size: 14px;">
          ${score.ballByBall.slice().reverse().map(ball => `
            <div style="padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.03); display: flex; justify-content: space-between;">
              <span style="color: var(--text-muted);">Over ${ball.over}.${ball.ball % 6 || 6}:</span>
              <span style="color: ${ball.type.includes('wicket') ? '#DC2626' : ball.type.includes('wide') ? '#F59E0B' : ball.type.includes('no-ball') ? '#F59E0B' : 'var(--text-primary)'}">
                ${ball.type.includes('wicket') ? '🔥 WICKET!' : 
                  ball.type === 'wide' ? `⚠️ Wide ${ball.runs > 1 ? `(${ball.runs} runs)` : ''}` :
                  ball.type === 'wide-bye' ? `⚠️ Wide Bye (${ball.runs} runs)` :
                  ball.type === 'no-ball' ? `⚠️ No Ball ${ball.runs > 1 ? `(${ball.runs} runs)` : ''}` :
                  ball.type === 'no-ball-bye' ? `⚠️ No Ball Bye (${ball.runs} runs)` :
                  ball.type === 'penalty' ? `⚖️ Penalty (${ball.runs} runs)` :
                  `${ball.runs} run${ball.runs > 1 ? 's' : ''}`}
                ${ball.freeHit ? ' (Free Hit)' : ''}
              </span>
            </div>
          `).join('')}
        </div>
      </div>
      
      ${score.isComplete || score.wickets >= 10 ? `
        <div class="card" style="margin-top: 16px; background: rgba(255,215,0,0.05); border: 2px solid var(--gold);">
          <div style="text-align: center; padding: 16px;">
            <h3 style="color: var(--gold);">🏏 Innings Complete!</h3>
            <p class="text-muted">${score.runs}/${score.wickets} in ${score.overs} overs</p>
            <button class="btn btn-gold" onclick="window.startSecondInnings()">
              <i class="fas fa-play"></i> Start 2nd Innings
            </button>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

// ============================================
// WINDOW FUNCTIONS
// ============================================

window.addRuns = function(runs) {
  saveStateBeforeAction();
  scoringEngine.addRuns(runs);
  updateScoreDisplay();
  autoSave();
};

window.addWide = function(extraRuns = 0) {
  saveStateBeforeAction();
  scoringEngine.addWide(extraRuns);
  updateScoreDisplay();
  autoSave();
};

window.addWideBye = function() {
  saveStateBeforeAction();
  scoringEngine.addWideBye(1);
  updateScoreDisplay();
  autoSave();
};

window.addNoBall = function(extraRuns = 0) {
  saveStateBeforeAction();
  scoringEngine.addNoBall(extraRuns);
  updateScoreDisplay();
  autoSave();
};

window.addNoBallBye = function() {
  saveStateBeforeAction();
  scoringEngine.addNoBallBye(1);
  updateScoreDisplay();
  autoSave();
};

window.addBye = function() {
  saveStateBeforeAction();
  const runs = parseInt(prompt('Enter bye runs (1-4):') || '1');
  scoringEngine.addBye(Math.min(Math.max(runs, 1), 4));
  updateScoreDisplay();
  autoSave();
};

window.addLegBye = function() {
  saveStateBeforeAction();
  const runs = parseInt(prompt('Enter leg bye runs (1-4):') || '1');
  scoringEngine.addLegBye(Math.min(Math.max(runs, 1), 4));
  updateScoreDisplay();
  autoSave();
};

window.addWicket = function() {
  const name = prompt('Enter batsman name:');
  if (name !== null) {
    saveStateBeforeAction();
    scoringEngine.addWicket('bowled', name || 'Unknown');
    updateScoreDisplay();
    autoSave();
  }
};

window.addRunOut = function() {
  const name = prompt('Enter batsman out:');
  if (name !== null) {
    saveStateBeforeAction();
    scoringEngine.addRunOut(name || 'Unknown', true);
    updateScoreDisplay();
    autoSave();
  }
};

window.addRetiredOut = function() {
  const name = prompt('Enter batsman name:');
  if (name !== null) {
    saveStateBeforeAction();
    scoringEngine.addRetiredOut(name || 'Unknown');
    updateScoreDisplay();
    autoSave();
  }
};

window.addPenalty = function() {
  const runs = parseInt(prompt('Enter penalty runs (5 or 10):') || '5');
  if (runs === 5 || runs === 10) {
    saveStateBeforeAction();
    scoringEngine.addPenalty(runs);
    updateScoreDisplay();
    autoSave();
  } else {
    alert('Penalty runs must be 5 or 10');
  }
};

window.undoLastBall = function() {
  if (!undoManager.canUndo()) {
    alert('No more actions to undo');
    return;
  }
  
  const restored = undoManager.undo(scoringEngine);
  if (restored) {
    updateScoreDisplay();
    autoSave();
    alert('Last action undone! ✅');
  } else {
    alert('Undo failed');
  }
};

window.resetScore = function() {
  if (confirm('Reset entire scoring?')) {
    scoringEngine.reset();
    undoManager.clear();
    updateScoreDisplay();
    autoSave();
  }
};

window.saveScore = async function() {
  if (isSaving) {
    console.log('Save already in progress...');
    return;
  }
  
  isSaving = true;
  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  }
  
  try {
    if (!currentMatchId) {
      const createNew = confirm('No match ID. Create a new match?');
      if (createNew) {
        const matchData = {
          title: 'Live Match',
          team1: 'Team 1',
          team2: 'Team 2',
          overs: scoringEngine.totalOvers || 20,
          type: 't20',
          status: 'live',
          scoring: scoringEngine.getScore(),
          ballByBall: scoringEngine.ballByBall,
          fallOfWickets: scoringEngine.fallOfWickets,
          target: scoringEngine.target,
          totalOvers: scoringEngine.totalOvers,
          createdAt: new Date().toISOString(),
          date: new Date().toISOString()
        };
        currentMatchId = await firestore.create('matches', matchData);
        alert(`Match created! ID: ${currentMatchId}`);
      }
      return;
    }
    
    await firestore.update('matches', currentMatchId, {
      scoring: scoringEngine.getScore(),
      ballByBall: scoringEngine.ballByBall,
      fallOfWickets: scoringEngine.fallOfWickets,
      updatedAt: new Date().toISOString(),
      status: scoringEngine.isComplete ? 'completed' : 'live'
    });
    
    if (scoringEngine.isComplete || scoringEngine.wickets >= 10 || 
        (scoringEngine.target && scoringEngine.runs >= scoringEngine.target)) {
      await handleMatchComplete();
    }
    
    alert('Score saved successfully! ✅');
  } catch (error) {
    console.error('Save error:', error);
    alert('Save failed: ' + error.message);
  } finally {
    isSaving = false;
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fas fa-save"></i> Save';
    }
  }
};

async function handleMatchComplete() {
  const match = await firestore.getOne('matches', currentMatchId);
  if (!match) return;
  
  const result = generateMatchResult({
    team1: { id: match.team1, name: match.team1Name },
    team2: { id: match.team2, name: match.team2Name },
    scoring: scoringEngine.getScore(),
    target: scoringEngine.target,
    currentInnings: currentInnings,
    totalOvers: scoringEngine.totalOvers,
    battingStats: scoringEngine.battingStats,
    bowlingStats: scoringEngine.bowlingStats
  });
  
  await firestore.update('matches', currentMatchId, {
    result: result.result,
    winner: result.winner?.id || null,
    margin: result.margin,
    motm: result.motm?.name || null,
    status: 'completed'
  });
  
  if (match.tournamentId && result.winner) {
    await updatePointsTable(match.tournamentId, {
      team1: { id: match.team1, name: match.team1Name },
      team2: { id: match.team2, name: match.team2Name },
      winner: result.winner,
      isTie: result.isTie || false,
      nrrData: {
        team1Runs: scoringEngine.runs,
        team1Overs: scoringEngine.overs + (scoringEngine.ballsInOver / 6),
        team2Runs: 0,
        team2Overs: 0,
        team1AllOut: scoringEngine.wickets >= 10,
        totalOvers: scoringEngine.totalOvers
      }
    });
  }
  
  alert(`Match Complete! ${result.result} 🏆`);
  if (result.motm) {
    alert(`🎖️ Man of the Match: ${result.motm.name}`);
  }
}

function autoSave() {
  if (currentMatchId) {
    clearTimeout(window._autoSaveTimeout);
    window._autoSaveTimeout = setTimeout(() => {
      window.saveScore();
    }, 3000);
  }
}

window.startSecondInnings = async function() {
  if (!currentMatchId) {
    alert('No match found!');
    return;
  }
  
  const match = await firestore.getOne('matches', currentMatchId);
  if (!match) return;
  
  const firstInningsData = {
    runs: scoringEngine.runs,
    wickets: scoringEngine.wickets,
    overs: scoringEngine.getOvers(),
    ballByBall: scoringEngine.ballByBall,
    fallOfWickets: scoringEngine.fallOfWickets,
    battingStats: scoringEngine.battingStats,
    bowlingStats: scoringEngine.bowlingStats,
    partnership: scoringEngine.partnership,
    extras: scoringEngine.extras,
    fours: scoringEngine.fours,
    sixes: scoringEngine.sixes
  };
  
  const innings = match.innings || [];
  innings.push(firstInningsData);
  
  const target = scoringEngine.runs + 1;
  
  await firestore.update('matches', currentMatchId, {
    innings: innings,
    currentInnings: 2,
    target: target
  });
  
  scoringEngine.reset();
  scoringEngine.setTarget(target);
  scoringEngine.totalOvers = match.overs || 20;
  scoringEngine.matchType = match.type || 't20';
  undoManager.clear();
  
  updateScoreDisplay();
  alert(`2nd Innings started! Target: ${target} 🎯`);
};

window.shareLiveScore = function() {
  if (!currentMatchId) {
    alert('No active match to share');
    return;
  }
  
  const link = `${window.location.origin}${window.location.pathname}?match=${currentMatchId}&view=live`;
  const score = scoringEngine.getScore();
  const text = `🏏 Pandavas Cricket Live\nScore: ${score.runs}/${score.wickets}\nOvers: ${score.overs}\nRR: ${score.runRate}`;
  
  if (navigator.share) {
    navigator.share({
      title: '🏏 Pandavas Cricket Live Score',
      text: text,
      url: link
    }).catch(() => {
      copyToClipboard(link);
    });
  } else {
    copyToClipboard(link);
  }
};

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('Live score link copied! 📋');
  }).catch(() => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    alert('Live score link copied! 📋');
  });
}

function updateScoreDisplay() {
  const container = document.querySelector('.live-scoring');
  if (!container) return;
  
  const newContent = renderScoringUI();
  container.innerHTML = newContent;
}

scoringEngine.onOverComplete((data) => {
  console.log(`Over ${data.over} completed: ${data.runs}/${data.wickets}`);
});
