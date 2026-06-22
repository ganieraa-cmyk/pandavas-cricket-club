// src/pages/teams.js - CLEAN VERSION
import { firestore } from '../firebase-config.js';
import { showModal } from '../components/modal.js';
import { uploadFile } from '../firebase-config.js';

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

// Show Create Team Modal
window.showCreateTeamModal = function() {
  showModal(`
    <h2><i class="fas fa-plus-circle text-gold"></i> Create New Team</h2>
    <form id="createTeamForm">
      <div class="form-group">
        <label>Team Name *</label>
        <input type="text" class="form-control" id="teamName" placeholder="e.g., Pandavas XI" required>
      </div>
      <div class="form-group">
        <label>Team Logo</label>
        <input type="file" class="form-control" id="teamLogoFile" accept="image/*" onchange="window.previewLogo(event)">
        <div id="logoPreview" style="margin-top: 8px; display: none;">
          <img id="logoPreviewImg" style="max-width: 100px; max-height: 100px; border-radius: 8px; border: 2px solid var(--gold);">
        </div>
        <small class="text-muted">Upload PNG, JPG, or SVG (max 5MB)</small>
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
    
    // Handle logo upload
    const logoFile = document.getElementById('teamLogoFile').files[0];
    let logoUrl = null;
    
    if (logoFile) {
      try {
        logoUrl = await uploadFile(`logos/${Date.now()}_${logoFile.name}`, logoFile);
      } catch (error) {
        console.error('Logo upload error:', error);
        alert('Failed to upload logo. Please try again.');
        return;
      }
    }
    
    const teamData = {
      name: document.getElementById('teamName').value,
      logo: logoUrl || null,
      captain: document.getElementById('teamCaptain').value || null,
      city: document.getElementById('teamCity').value || null,
      players: [],
      createdAt: new Date().toISOString()
    };
    
    await firestore.create('teams', teamData);
    window.location.reload();
  });
};

// Logo Preview
window.previewLogo = function(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('logoPreview').style.display = 'block';
      document.getElementById('logoPreviewImg').src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

// Delete Team
window.deleteTeam = async function(id) {
  if (confirm('Are you sure you want to delete this team?')) {
    await firestore.delete('teams', id);
    window.location.reload();
  }
};
