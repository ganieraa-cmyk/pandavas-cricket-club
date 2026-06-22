import { firestore } from '../firebase-config.js';
import { showModal } from '../components/modal.js';

export async function Players() {
  const players = await firestore.getAll('players');
  const teams = await firestore.getAll('teams');
  window.teams = teams;
  
  return `
    <div class="players-page">
      <div class="flex justify-between items-center mb-16">
        <h2 class="text-gold" style="font-size: 28px; font-weight: 700;">
          <i class="fas fa-user-cog"></i> Player Management
        </h2>
        <button class="btn btn-gold" onclick="window.showCreatePlayerModal()">
          <i class="fas fa-plus"></i> Add Player
        </button>
      </div>
      
      <div class="grid-3">
        ${players.map(player => `
          <div class="card">
            <div class="flex items-center gap-12">
              <div style="width: 60px; height: 60px; border-radius: 50%; background: var(--black); border: 2px solid var(--gold); overflow: hidden; display: flex; align-items: center; justify-content: center;">
                ${player.photo ? `<img src="${player.photo}" style="width: 100%; height: 100%; object-fit: cover;">` : `<i class="fas fa-user" style="font-size: 24px; color: var(--gold);"></i>`}
              </div>
              <div style="flex: 1;">
                <h4>${player.name}</h4>
                <p class="text-muted" style="font-size: 12px;">#${player.jerseyNumber || 'N/A'} • ${player.role || 'All-rounder'}</p>
                <p class="text-muted" style="font-size: 12px;">${player.team || 'Free Agent'}</p>
                <div style="margin-top: 4px;">
                  <span class="badge" style="background: rgba(255,215,0,0.1); color: var(--gold); padding: 2px 8px; border-radius: 12px; font-size: 11px;">
                    ${player.battingStyle || 'RHB'}
                  </span>
                  <span class="badge" style="background: rgba(255,215,0,0.1); color: var(--gold); padding: 2px 8px; border-radius: 12px; font-size: 11px;">
                    ${player.bowlingStyle || 'RMB'}
                  </span>
                </div>
              </div>
            </div>
            <div style="margin-top: 12px; display: flex; gap: 4px;">
              <button class="btn btn-outline-gold" style="padding: 4px 12px; font-size: 12px;" onclick="window.editPlayer('${player.id}')">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-danger" style="padding: 4px 12px; font-size: 12px;" onclick="window.deletePlayer('${player.id}')">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
      
      ${players.length === 0 ? `
        <div class="text-center text-muted" style="padding: 60px 0;">
          <i class="fas fa-user-plus" style="font-size: 64px; display: block; margin-bottom: 16px;"></i>
          <h3>No Players Added</h3>
          <p>Add players to your squad!</p>
        </div>
      ` : ''}
    </div>
  `;
}

window.showCreatePlayerModal = function() {
  showModal(`
    <h2><i class="fas fa-user-plus text-gold"></i> Add New Player</h2>
    <form id="createPlayerForm">
      <div class="form-group">
        <label>Player Name *</label>
        <input type="text" class="form-control" id="playerName" required>
      </div>
      <div class="form-group">
        <label>Jersey Number</label>
        <input type="number" class="form-control" id="playerJersey">
      </div>
      <div class="form-group">
        <label>Role</label>
        <select class="form-control" id="playerRole">
          <option value="Batsman">Batsman</option>
          <option value="Bowler">Bowler</option>
          <option value="All-rounder" selected>All-rounder</option>
          <option value="Wicket-keeper">Wicket-keeper</option>
        </select>
      </div>
      <div class="form-group">
        <label>Batting Style</label>
        <select class="form-control" id="playerBatting">
          <option value="RHB">Right Hand Bat</option>
          <option value="LHB">Left Hand Bat</option>
        </select>
      </div>
      <div class="form-group">
        <label>Bowling Style</label>
        <select class="form-control" id="playerBowling">
          <option value="RMB">Right Arm Medium</option>
          <option value="RMF">Right Arm Fast</option>
          <option value="RAS">Right Arm Spin</option>
          <option value="LMB">Left Arm Medium</option>
          <option value="LMF">Left Arm Fast</option>
          <option value="LAS">Left Arm Spin</option>
          <option value="None">None</option>
        </select>
      </div>
      <div class="form-group">
        <label>Photo URL</label>
        <input type="url" class="form-control" id="playerPhoto" placeholder="https://example.com/photo.jpg">
      </div>
      <div class="form-group">
        <label>Team</label>
        <select class="form-control" id="playerTeam">
          <option value="">Free Agent</option>
          ${window.teams?.map(t => `<option value="${t.id}">${t.name}</option>`).join('') || ''}
        </select>
      </div>
      <button type="submit" class="btn btn-gold" style="width: 100%;">
        <i class="fas fa-save"></i> Add Player
      </button>
    </form>
  `);
  
  document.getElementById('createPlayerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const playerData = {
      name: document.getElementById('playerName').value,
      jerseyNumber: parseInt(document.getElementById('playerJersey').value) || null,
      role: document.getElementById('playerRole').value,
      battingStyle: document.getElementById('playerBatting').value,
      bowlingStyle: document.getElementById('playerBowling').value,
      photo: document.getElementById('playerPhoto').value || null,
      team: document.getElementById('playerTeam').value || null,
      stats: {
        batting: { runs: 0, balls: 0, fours: 0, sixes: 0, dismissals: 0 },
        bowling: { wickets: 0, runsConceded: 0, overs: 0, maidens: 0 },
        fielding: { catches: 0, runOuts: 0, stumpings: 0 }
      }
    };
    await firestore.create('players', playerData);
    window.location.reload();
  });
};

window.editPlayer = async function(id) {
  const player = await firestore.getOne('players', id);
  if (!player) {
    alert('Player not found');
    return;
  }
  
  const teams = await firestore.getAll('teams');
  
  showModal(`
    <h2><i class="fas fa-edit text-gold"></i> Edit Player</h2>
    <form id="editPlayerForm">
      <div class="form-group">
        <label>Player Name *</label>
        <input type="text" class="form-control" id="editPlayerName" value="${player.name}" required>
      </div>
      <div class="form-group">
        <label>Jersey Number</label>
        <input type="number" class="form-control" id="editPlayerJersey" value="${player.jerseyNumber || ''}">
      </div>
      <div class="form-group">
        <label>Role</label>
        <select class="form-control" id="editPlayerRole">
          <option value="Batsman" ${player.role === 'Batsman' ? 'selected' : ''}>Batsman</option>
          <option value="Bowler" ${player.role === 'Bowler' ? 'selected' : ''}>Bowler</option>
          <option value="All-rounder" ${player.role === 'All-rounder' ? 'selected' : ''}>All-rounder</option>
          <option value="Wicket-keeper" ${player.role === 'Wicket-keeper' ? 'selected' : ''}>Wicket-keeper</option>
        </select>
      </div>
      <div class="form-group">
        <label>Batting Style</label>
        <select class="form-control" id="editPlayerBatting">
          <option value="RHB" ${player.battingStyle === 'RHB' ? 'selected' : ''}>Right Hand Bat</option>
          <option value="LHB" ${player.battingStyle === 'LHB' ? 'selected' : ''}>Left Hand Bat</option>
        </select>
      </div>
      <div class="form-group">
        <label>Bowling Style</label>
        <select class="form-control" id="editPlayerBowling">
          <option value="RMB" ${player.bowlingStyle === 'RMB' ? 'selected' : ''}>Right Arm Medium</option>
          <option value="RMF" ${player.bowlingStyle === 'RMF' ? 'selected' : ''}>Right Arm Fast</option>
          <option value="RAS" ${player.bowlingStyle === 'RAS' ? 'selected' : ''}>Right Arm Spin</option>
          <option value="LMB" ${player.bowlingStyle === 'LMB' ? 'selected' : ''}>Left Arm Medium</option>
          <option value="LMF" ${player.bowlingStyle === 'LMF' ? 'selected' : ''}>Left Arm Fast</option>
          <option value="LAS" ${player.bowlingStyle === 'LAS' ? 'selected' : ''}>Left Arm Spin</option>
          <option value="None" ${player.bowlingStyle === 'None' ? 'selected' : ''}>None</option>
        </select>
      </div>
      <div class="form-group">
        <label>Photo URL</label>
        <input type="url" class="form-control" id="editPlayerPhoto" value="${player.photo || ''}">
      </div>
      <div class="form-group">
        <label>Team</label>
        <select class="form-control" id="editPlayerTeam">
          <option value="">Free Agent</option>
          ${teams.map(t => `<option value="${t.id}" ${player.team === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}
        </select>
      </div>
      <button type="submit" class="btn btn-gold" style="width: 100%;">
        <i class="fas fa-save"></i> Update Player
      </button>
    </form>
  `);
  
  document.getElementById('editPlayerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const updatedData = {
      name: document.getElementById('editPlayerName').value,
      jerseyNumber: parseInt(document.getElementById('editPlayerJersey').value) || null,
      role: document.getElementById('editPlayerRole').value,
      battingStyle: document.getElementById('editPlayerBatting').value,
      bowlingStyle: document.getElementById('editPlayerBowling').value,
      photo: document.getElementById('editPlayerPhoto').value || null,
      team: document.getElementById('editPlayerTeam').value || null,
    };
    await firestore.update('players', id, updatedData);
    window.location.reload();
  });
};

window.deletePlayer = async function(id) {
  if (confirm('Delete this player?')) {
    await firestore.delete('players', id);
    window.location.reload();
  }
};
