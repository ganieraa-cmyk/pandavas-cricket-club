import { firestore } from '../firebase-config.js';
import { showModal } from '../components/modal.js';
import { renderPlayingXI } from '../components/playing-xi.js';

export async function MatchCenter() {
  const teams = await firestore.getAll('teams');
  const players = await firestore.getAll('players');
  window.teams = teams;
  window.players = players;
  
  const allMatches = await firestore.getAll('matches');
  const sortedMatches = allMatches.sort((a, b) => new Date(b.date) - new Date(a.date));
  const recentMatches = sortedMatches.slice(0, 10);
  
  return `
    <div class="match-center">
      <div class="flex justify-between items-center mb-16">
        <h2 class="text-gold" style="font-size: 28px; font-weight: 700;">
          <i class="fas fa-baseball-ball"></i> Match Center
        </h2>
        <button class="btn btn-gold" onclick="window.showCreateMatchModal()">
          <i class="fas fa-plus"></i> Create Match
        </button>
      </div>
      
      <div class="card" style="margin-bottom: 20px;">
        <h3 style="color: var(--text-secondary); margin-bottom: 12px;">Recent Matches</h3>
        ${recentMatches.length > 0 ? `
          <div class="table-container">
            <table>
              <thead><tr><th>Match</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                ${recentMatches.map(m => `
                  <tr>
                    <td><strong>${m.title || 'Match'}</strong></td>
                    <td>${new Date(m.date).toLocaleDateString()}</td>
                    <td><span class="badge ${m.status === 'completed' ? 'badge-success' : m.status === 'live' ? 'badge-warning' : 'badge'}">${m.status || 'Upcoming'}</span></td>
                    <td>
                      <button class="btn btn-outline-gold" style="padding: 4px 12px; font-size: 12px;" onclick="window.navigateTo('live-scoring', { matchId: '${m.id}' })">
                        <i class="fas fa-play"></i> Score
                      </button>
                      <button class="btn btn-outline-gold" style="padding: 4px 12px; font-size: 12px;" onclick="window.navigateTo('scorecard', { id: '${m.id}' })">
                        <i class="fas fa-eye"></i> View
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `
          <p class="text-muted">No matches yet. Create one!</p>
        `}
      </div>
      
      <div class="grid-2">
        <div class="card">
          <h4><i class="fas fa-coin"></i> Quick Toss</h4>
          <p class="text-muted">Set toss winner and decision</p>
          <button class="btn btn-outline-gold" onclick="window.quickToss()">Quick Toss</button>
        </div>
        <div class="card">
          <h4><i class="fas fa-play"></i> Live Match</h4>
          <p class="text-muted">Go to live scoring</p>
          <button class="btn btn-gold" onclick="window.navigateTo('live-scoring')">Live Scoring</button>
        </div>
      </div>
    </div>
  `;
}

window.showCreateMatchModal = function() {
  const teams = window.teams || [];
  const players = window.players || [];
  
  showModal(`
    <h2><i class="fas fa-plus-circle text-gold"></i> Create New Match</h2>
    <form id="createMatchForm">
      <div class="form-group">
        <label>Match Title</label>
        <input type="text" class="form-control" id="matchTitle" placeholder="e.g., Pandavas vs Warriors">
      </div>
      <div class="form-group">
        <label>Team 1 *</label>
        <select class="form-control" id="matchTeam1" required>
          <option value="">Select Team</option>
          ${teams.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Team 2 *</label>
        <select class="form-control" id="matchTeam2" required>
          <option value="">Select Team</option>
          ${teams.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Overs</label>
        <select class="form-control" id="matchOvers">
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="10">10</option>
          <option value="5">5</option>
        </select>
      </div>
      <div class="form-group">
        <label>Match Type</label>
        <select class="form-control" id="matchType">
          <option value="t20">T20</option>
          <option value="odi">ODI</option>
          <option value="test">Test</option>
          <option value="friendly">Friendly</option>
        </select>
      </div>
      <div class="form-group">
        <label>Tournament (Optional)</label>
        <select class="form-control" id="matchTournament">
          <option value="">None</option>
          ${(window.tournaments || []).map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
        </select>
      </div>
      <button type="submit" class="btn btn-gold" style="width: 100%;">
        <i class="fas fa-play"></i> Create & Start Match
      </button>
    </form>
  `);
  
  document.getElementById('createMatchForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const team1Id = document.getElementById('matchTeam1').value;
    const team2Id = document.getElementById('matchTeam2').value;
    const team1 = window.teams.find(t => t.id === team1Id);
    const team2 = window.teams.find(t => t.id === team2Id);
    
    if (!team1 || !team2) {
      alert('Please select both teams');
      return;
    }
    
    const matchData = {
      title: document.getElementById('matchTitle').value || `${team1.name} vs ${team2.name}`,
      team1: team1Id,
      team2: team2Id,
      team1Name: team1.name,
      team2Name: team2.name,
      overs: parseInt(document.getElementById('matchOvers').value),
      type: document.getElementById('matchType').value,
      tournamentId: document.getElementById('matchTournament').value || null,
      status: 'upcoming',
      toss: null,
      innings: [],
      result: null,
      createdAt: new Date().toISOString(),
      date: new Date().toISOString()
    };
    
    const matchId = await firestore.create('matches', matchData);
    window.navigateTo('live-scoring', { matchId });
    window.closeModal();
  });
};

window.quickToss = function() {
  const teams = window.teams || [];
  if (teams.length < 2) {
    alert('Need at least 2 teams for a toss!');
    return;
  }
  
  const team1 = teams[Math.floor(Math.random() * teams.length)];
  let team2 = teams[Math.floor(Math.random() * teams.length)];
  while (team2.id === team1.id) {
    team2 = teams[Math.floor(Math.random() * teams.length)];
  }
  
  const winner = Math.random() > 0.5 ? team1 : team2;
  const decision = Math.random() > 0.5 ? 'bat' : 'bowl';
  const loser = winner.id === team1.id ? team2 : team1;
  
  showModal(`
    <h2><i class="fas fa-coin"></i> Toss Result</h2>
    <div style="text-align: center; padding: 20px;">
      <div style="font-size: 60px; margin-bottom: 16px;">🪙</div>
      <h3 style="color: var(--gold);">${winner.name} won the toss!</h3>
      <p style="font-size: 20px; margin: 12px 0;">They chose to <strong>${decision === 'bat' ? 'Bat 🏏' : 'Bowl 🎯'}</strong></p>
      <p class="text-muted">${loser.name} will ${decision === 'bat' ? 'bowl' : 'bat'}</p>
      <div style="margin-top: 16px;">
        <button class="btn btn-gold" onclick="window.closeModal(); window.navigateTo('live-scoring')">
          <i class="fas fa-play"></i> Start Match
        </button>
      </div>
    </div>
  `);
};
