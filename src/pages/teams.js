import { firestore } from '../firebase-config.js';
import { showModal } from '../components/modal.js';

export async function Teams() {
  const teams = await firestore.getAll('teams');
  window.teams = teams;
  
  return `
    <div class="teams-page">
      <div class="flex justify-between items-center mb-16">
        <h2 class="text-gold" style="font-size: 28px; font-weight: 700;">
          <i class="fas fa-users"></i> Team Management
        </h2>
        <button class="btn btn-gold" onclick="window.showCreateTeamModal()">
          <i class="fas fa-plus"></i> Create Team
        </button>
      </div>
      
      <div class="grid-2">
        ${teams.map(team => `
          <div class="card">
            <div class="flex items-center gap-16">
              <div style="width: 80px; height: 80px; border-radius: 50%; background: var(--black); border: 2px solid var(--gold); overflow: hidden; display: flex; align-items: center; justify-content: center;">
                ${team.logo ? `<img src="${team.logo}" style="width: 100%; height: 100%; object-fit: cover;">` : `<i class="fas fa-users" style="font-size: 32px; color: var(--gold);"></i>`}
              </div>
              <div style="flex: 1;">
                <h3 style="font-size: 20px;">${team.name}</h3>
                <p class="text-muted" style="font-size: 14px;">Captain: ${team.captain || 'Not set'}</p>
                <p class="text-muted" style="font-size: 14px;">Players: ${team.players?.length || 0}</p>
                <div style="margin-top: 8px;">
                  <button class="btn btn-outline-gold" style="padding: 4px 12px; font-size: 12px;" onclick="window.navigateTo('team-detail', { id: '${team.id}' })">
                    <i class="fas fa-eye"></i> View
                  </button>
                  <button class="btn btn-danger" style="padding: 4px 12px; font-size: 12px;" onclick="window.deleteTeam('${team.id}')">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      
      ${teams.length === 0 ? `
        <div class="text-center text-muted" style="padding: 60px 0;">
          <i class="fas fa-users" style="font-size: 64px; display: block; margin-bottom: 16px;"></i>
          <h3>No Teams Created Yet</h3>
          <p>Create your first team to get started!</p>
        </div>
      ` : ''}
    </div>
  `;
}

window.showCreateTeamModal = function() {
  showModal(`
    <h2><i class="fas fa-plus-circle text-gold"></i> Create New Team</h2>
    <form id="createTeamForm">
      <div class="form-group">
        <label>Team Name *</label>
        <input type="text" class="form-control" id="teamName" placeholder="e.g., Pandavas XI" required>
      </div>
      <div class="form-group">
        <label>Team Logo URL</label>
        <input type="url" class="form-control" id="teamLogo" placeholder="https://example.com/logo.png">
      </div>
      <div class="form-group">
        <label>Captain</label>
        <input type="text" class="form-control" id="teamCaptain" placeholder="Captain name">
      </div>
      <div class="form-group">
        <label>City</label>
        <input type="text" class="form-control" id="teamCity" placeholder="City">
      </div>
      <button type="submit" class="btn btn-gold" style="width: 100%;">
        <i class="fas fa-save"></i> Create Team
      </button>
    </form>
  `);
  
  document.getElementById('createTeamForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const teamData = {
      name: document.getElementById('teamName').value,
      logo: document.getElementById('teamLogo').value || null,
      captain: document.getElementById('teamCaptain').value || null,
      city: document.getElementById('teamCity').value || null,
      players: [],
      createdAt: new Date().toISOString()
    };
    await firestore.create('teams', teamData);
    window.location.reload();
  });
};

window.deleteTeam = async function(id) {
  if (confirm('Are you sure you want to delete this team?')) {
    await firestore.delete('teams', id);
    window.location.reload();
  }
};
