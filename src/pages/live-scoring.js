// src/pages/live-scoring.js - Updated UI with all extras

// Replace the scoring buttons section with this:

<div style="margin-bottom: 20px;">
  <h4 style="margin-bottom: 12px; color: var(--text-secondary);">Scoring Options</h4>
  
  <!-- Normal Runs -->
  <div class="scoring-grid">
    ${[0,1,2,3,4,5,6].map(runs => `
      <button class="scoring-btn" onclick="window.addRuns(${runs})">
        ${runs === 4 ? '🏏 4' : runs === 6 ? '🚀 6' : runs}
      </button>
    `).join('')}
  </div>
  
  <!-- Wides -->
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
        { label: 'Wide Bye', fn: 'addWideBye', args: 1 }
      ].map(item => `
        <button class="scoring-btn special" onclick="window.${item.fn}(${item.args})">
          ${item.label}
        </button>
      `).join('')}
    </div>
  </div>
  
  <!-- No Balls -->
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
        { label: 'NB Bye', fn: 'addNoBallBye', args: 1 }
      ].map(item => `
        <button class="scoring-btn special" onclick="window.${item.fn}(${item.args})">
          ${item.label}
        </button>
      `).join('')}
    </div>
  </div>
  
  <!-- Byes, Leg Byes, Wickets -->
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

// Add these functions to window:
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

window.addPenalty = function() {
  const runs = parseInt(prompt('Enter penalty runs (5 or 10):') || '5');
  saveStateBeforeAction();
  scoringEngine.addPenalty(runs);
  updateScoreDisplay();
  autoSave();
};
