import { firestore } from '../firebase-config.js';
import { showModal } from '../components/modal.js';
import { generateFixtures } from '../utils/tournament-utils.js';

export async function Tournament() {
  const tournaments = await firestore.getAll('tournaments');
  const teams = await firestore.getAll('teams');
  window.teams = teams;
  window.tournaments = tournaments;
  
  return `
    <div class="tournament-page">
      <div class="flex justify-between items-center mb-16">
        <h2 class="text-gold" style="font-size: 28px; font-weight: 700;">
          <i class="fas fa-trophy"></i> Tournaments
        </h2>
        <div class="flex gap-8">
          <button class="btn btn-outline-gold" onclick="window.autoBackup()">
            <i class="fas fa-download"></i> Backup
          </button>
          <button class="btn btn-gold" onclick="window.showCreateTournamentModal()">
            <i class="fas fa-plus"></i> Create Tournament
          </button>
        </div>
      </div>
      
      <div class="grid-2">
        ${tournaments.map(t => `
          <div class="card">
            <div class="flex items-center gap-12">
              <div style="font-size: 40px;">🏆</div>
              <div style="flex: 1;">
                <h3>${t.name}</h3>
                <p class="text-muted" style="font-size: 14px;">
                  ${t.teams?.length || 0} Teams • ${t.matches?.length || 0} Matches
                </p>
                <p class="text-muted" style="font-size: 12px;">
                  ${t.startDate ? new Date(t.startDate).toLocaleDateString() : 'TBD'} - 
                  ${t.endDate ? new Date(t.endDate).toLocaleDateString() : 'TBD'}
                </p>
                <p class="text-muted" style="font-size: 12px;">
                  Type: ${t.type || 'League'} • Status: ${t.status || 'Upcoming'}
                </p>
              </div>
              <div>
                <button class="btn btn-outline-gold" style="padding: 4px 12px; font-size: 12px; margin-bottom: 4px;" onclick="window.viewTournament('${t.id}')">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-danger" style="padding: 4px 12px; font-size: 12px;" onclick="window.deleteTournament('${t.id}')">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
            
            ${t.pointsTable && t.pointsTable.length > 0 ? `
              <div style="margin-top: 12px;">
                <h4 style="font-size: 14px; color: var(--text-secondary);">Points Table</h4>
                <div class="table-container" style="font-size: 12px;">
                  <table>
                    <thead><tr><th>Team</th><th>P</th><th>W</th><th>L</th><th>NR</th><th>Pts</th><th>NRR</th></tr></thead>
                    <tbody>
                      ${t.pointsTable.sort((a,b) => b.points - a.points || (b.nrr || 0) - (a.nrr || 0)).map(team => `
                        <tr>
                          <td>${team.teamName || 'Team'}</td>
                          <td>${team.played || 0}</td>
                          <td>${team.won || 0}</td>
                          <td>${team.lost || 0}</td>
                          <td>${team.noResult || 0}</td>
                          <td><strong>${team.points || 0}</strong></td>
                          <td>${(team.nrr || 0).toFixed(3)}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
      
      ${tournaments.length === 0 ? `
        <div class="text-center text-muted" style="padding: 60px 0;">
          <i class="fas fa-trophy" style="font-size: 64px; display: block; margin-bottom: 16px;"></i>
          <h3>No Tournaments</h3>
          <p>Create a tournament to organize matches!</p>
        </div>
      ` : ''}
    </div>
  `;
}

window.showCreateTournamentModal = function() {
  const teams = window.teams || [];
  
  showModal(`
    <h2><i class="fas fa-trophy text-gold"></i> Create Tournament</h2>
    <form id="createTournamentForm">
      <div class="form-group">
        <label>Tournament Name *</label>
        <input type="text" class="form-control" id="tournamentName" required>
      </div>
      <div class="form-group">
        <label>Start Date</label>
        <input type="date" class="form-control" id="tournamentStart">
      </div>
      <div class="form-group">
        <label>End Date</label>
        <input type="date" class="form-control" id="tournamentEnd">
      </div>
      <div class="form-group">
        <label>Type</label>
        <select class="form-control" id="tournamentType">
          <option value="league">League (Round Robin)</option>
          <option value="knockout">Knockout</option>
          <option value="group">Group Stage + Knockout</option>
        </select>
      </div>
      <div class="form-group">
        <label>Overs per match</label>
        <select class="form-control" id="tournamentOvers">
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="10">10</option>
          <option value="5">5</option>
        </select>
      </div>
      <div class="form-group">
        <label>Teams</label>
        <select class="form-control" id="tournamentTeams" multiple style="height: 120px;">
          ${teams.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
        </select>
        <small class="text-muted">Hold Ctrl/Cmd to select multiple</small>
      </div>
      <button type="submit" class="btn btn-gold" style="width: 100%;">
        <i class="fas fa-save"></i> Create Tournament
      </button>
    </form>
  `);
  
  document.getElementById('createTournamentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const teamSelect = document.getElementById('tournamentTeams');
    const selectedTeams = Array.from(teamSelect.selectedOptions).map(opt => opt.value);
    
    if (selectedTeams.length < 2) {
      alert('Please select at least 2 teams');
      return;
    }
    
    const tournamentData = {
      name: document.getElementById('tournamentName').value,
      startDate: document.getElementById('tournamentStart').value || null,
      endDate: document.getElementById('tournamentEnd').value || null,
      type: document.getElementById('tournamentType').value,
      oversPerMatch: parseInt(document.getElementById('tournamentOvers').value),
      teams: selectedTeams,
      matches: [],
      pointsTable: selectedTeams.map(teamId => {
        const team = window.teams.find(t => t.id === teamId);
        return {
          teamId,
          teamName: team?.name || teamId,
          played: 0, won: 0, lost: 0, tie: 0, noResult: 0,
          points: 0,
          runsScored: 0, oversFaced: 0,
          runsConceded: 0, oversBowled: 0,
          nrr: 0
        };
      }),
      status: 'upcoming',
      createdAt: new Date().toISOString()
    };
    
    // Generate fixtures
    const fixtures = generateFixtures(selectedTeams.map(id => {
      const team = window.teams.find(t => t.id === id);
      return { id, name: team?.name || id };
    }), tournamentData.type);
    
    tournamentData.fixtures = fixtures;
    
    const id = await firestore.create('tournaments', tournamentData);
    alert(`Tournament created! ID: ${id}`);
    window.location.reload();
  });
};

window.viewTournament = function(id) {
  window.navigateTo('tournament-detail', { id });
};

window.deleteTournament = async function(id) {
  if (confirm('Delete this tournament and all its data?')) {
    await firestore.delete('tournaments', id);
    window.location.reload();
  }
};

window.autoBackup = async function() {
  const { autoBackup } = await import('../utils/backup.js');
  await autoBackup();
};
