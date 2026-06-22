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
  engine.extras = savedData.extras || { wide: 0, noBall: 0, bye: 0, legBye: 0 };
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
      
      // Setup realtime sync
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
              ${scoringEngine.runs}/${scoringEngine.wickets}
            </div>
            <div style="font-size: 20px; color: var(--text-secondary);">
              Overs: ${scoringEngine.getOvers()} • RR: ${scoringEngine.getRunRate()}
            </div>
            ${scoringEngine.target ? `
              <div style="font-size: 16px; color: var(--gold);">
                Target: ${scoringEngine.target} • Req RR: ${scoringEngine.getRequiredRunRate()}
              </div>
            ` : ''}
          </div>
          <div style="text-align: right;">
            <div style="font-size: 16px; color: var(--text-secondary);">Partnership</div>
            <div style="font-size: 24px; font-weight: 700; color: var(--gold);">
              ${scoringEngine.partnership.runs} (${scoringEngine.partnership.balls}b)
            </div>
            <div style="font-size: 14px; color: var(--text-muted);">
              4s: ${scoringEngine.fours} • 6s: ${scoringEngine.sixes}
            </div>
            ${scoringEngine.freeHit ? '<div style="color: #F59E0B; font-size: 14px;">🔄 Free Hit</div>' : ''}
          </div>
        </div>
      </div>
      
      <!-- Extras Display -->
      <div id="extrasDisplay" class="flex flex-wrap gap-8" style="margin-bottom: 16px;">
        ${['wide', 'noBall', 'bye', 'legBye'].map(type => `
          <span style="background: var(--black-card); padding: 4px 12px; border-radius: 12px; font-size: 12px; border: 1px solid rgba(255,215,0,0.1);">
            ${type.toUpperCase()}: ${scoringEngine.extras[type] || 0}
          </span>
        `).join('')}
      </div>
      
      <!-- Powerplay Info -->
      ${scoringEngine.powerplayOvers > 0 ? `
        <div style="margin-bottom: 16px; font-size: 14px; color: var(--text-secondary);">
          Powerplay: ${Math.floor(scoringEngine.balls / 6)}/${scoringEngine.powerplayOvers} overs • 
          ${scoringEngine.powerplayData.runs} runs • ${scoringEngine.powerplayData.wickets} wickets
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
        <div class="scoring-grid" style="margin-top: 10px; grid-template-columns: repeat(4, 1fr);">
          ${[
            { label: 'Wide', fn: 'addWide' },
            { label: 'Wide +4', fn: 'addWide4' },
            { label: 'No Ball', fn: 'addNoBall' },
            { label: 'No Ball +6', fn: 'addNoBall6' }
          ].map(item => `
            <button class="scoring-btn special" onclick="window.${item.fn}()">
              ${item.label}
            </button>
          `).join('')}
        </div>
        <div class="scoring-grid" style="margin-top: 10px; grid-template-columns: repeat(4, 1fr);">
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
        </div>
      </div>
      
      <!-- Fall of Wickets -->
      ${scoringEngine.fallOfWickets.length > 0 ? `
        <div class="card" style="margin-bottom: 16px;">
          <h4 style="color: var(--text-secondary);">Fall of Wickets</h4>
          <div class="flex flex-wrap gap-8">
            ${scoringEngine.fallOfWickets.map(fow => `
              <span style="background: rgba(220,38,38,0.1); padding: 4px 12px; border-radius: 12px; font-size: 12px; border: 1px solid rgba(220,38,38,0.2);">
                ${fow.wicketNumber}-${fow.batsman} (${fow.runs}, ${fow.overs} ov)
              </span>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      <!-- Ball-by-Ball -->
      <div class="card">
        <h4 style="margin-bottom: 12px; color: var(--text-secondary);">
          <i class="fas fa-comment"></i> Ball-by-Ball
        </h4>
        <div id="ballByBall" style="max-height: 200px; overflow-y: auto; font-size: 14px;">
          ${scoringEngine.ballByBall.slice().reverse().map(ball => `
            <div style="padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.03); display: flex; justify-content: space-between;">
              <span style="color: var(--text-muted);">Over ${ball.over}.${ball.ball % 6 || 6}:</span>
              <span style="color: ${ball.type.includes('wicket') ? '#DC2626' : ball.type.includes('extra') ? '#F59E0B' : 'var(--text-primary)'}">
                ${ball.type.includes('wicket') ? '🔥 WICKET!' : 
                  ball.type.includes('extra') ? `⚠️ ${ball.type.replace('-', ' ')} ${ball.runs > 1 ? `(${ball.runs} runs)` : ''}` : 
                  `${ball.runs} run${ball.runs > 1 ? 's' : ''}`}
                ${ball.freeHit ? ' (Free Hit)' : ''}
              </span>
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- Innings Break -->
      ${scoringEngine.wickets === 10 || scoringEngine.isComplete ? `
        <div class="card" style="margin-top: 16px; background: rgba(255,215,0,0.05); border: 2px solid var(--gold);">
          <div style="text-align: center; padding: 16px;">
            <h3 style="color: var(--gold);">🏏 Innings Complete!</h3>
            <p class="text-muted">${scoringEngine.runs}/${scoringEngine.wickets} in ${scoringEngine.getOvers()} overs</p>
            <button class="btn btn-gold" onclick="window.startSecondInnings()">
              <i class="fas fa-play"></i> Start 2nd Innings
            </button>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

// Action functions
window.addRuns = function(runs) {
  saveStateBeforeAction();
  scoringEngine.addRuns(runs);
  updateScoreDisplay();
  autoSave();
};

window.addWide = function() {
  saveStateBeforeAction();
  scoringEngine.addWide(0);
  updateScoreDisplay();
  autoSave();
};

window.addWide4 = function() {
  saveStateBeforeAction();
  scoringEngine.addWide(4);
  updateScoreDisplay();
  autoSave();
};

window.addNoBall = function() {
  saveStateBeforeAction();
  scoringEngine.addNoBall(0);
  updateScoreDisplay();
  autoSave();
};

window.addNoBall6 = function() {
  saveStateBeforeAction();
  scoringEngine.addNoBall(6);
  updateScoreDisplay();
  autoSave();
};

window.addBye = function() {
  saveStateBeforeAction();
  scoringEngine.addBye(1);
  updateScoreDisplay();
  autoSave();
};

window.addLegBye = function() {
  saveStateBeforeAction();
  scoringEngine.addLegBye(1);
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
    
    // Check if match is complete
    if (scoringEngine.isComplete || scoringEngine.wickets === 10 || 
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
  
  // Update tournament points
  if (match.tournamentId && result.winner) {
    await updatePointsTable(match.tournamentId, {
      team1: { id: match.team1, name: match.team1Name },
      team2: { id: match.team2, name: match.team2Name },
      winner: result.winner,
      isTie: result.isTie || false
    });
  }
  
  alert(`Match Complete! ${result.result} 🏆`);
  if (result.motm) {
    alert(`🎖️ Man of the Match: ${result.motm.name}`);
  }
}

function autoSave() {
  if (currentMatchId) {
    // Debounced save
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
  
  // Save first innings data
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
  
  // Reset for second innings
  scoringEngine.reset();
  scoringEngine.setTarget(target);
  scoringEngine.totalOvers = match.overs || 20;
  scoringEngine.matchType = match.type || 't20';
  undoManager.clear();
  
  updateScoreDisplay();
  alert(`2nd Innings started! Target: ${target} 🎯`);
};

function updateScoreDisplay() {
  const container = document.querySelector('.live-scoring');
  if (!container) return;
  
  const newContent = renderScoringUI();
  container.innerHTML = newContent;
}

window.shareLiveScore = function() {
  if (!currentMatchId) {
    alert('No active match to share');
    return;
  }
  
  const link = `${window.location.origin}?match=${currentMatchId}&view=live`;
  
  if (navigator.share) {
    navigator.share({
      title: '🏏 Pandavas Cricket Live Score',
      text: `Live Score: ${scoringEngine.runs}/${scoringEngine.wickets}`,
      url: link
    });
  } else {
    navigator.clipboard.writeText(link);
    alert('Link copied: ' + link);
  }
};
