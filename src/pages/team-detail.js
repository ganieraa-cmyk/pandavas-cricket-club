import { firestore } from '../firebase-config.js';

export async function TeamDetail(params) {
  const teamId = params?.id;
  if (!teamId) {
    return `<div class="card"><p class="text-muted">Team not found</p></div>`;
  }
  
  const team = await firestore.getOne('teams', teamId);
  if (!team) {
    return `<div class="card"><p class="text-muted">Team not found</p></div>`;
  }
  
  const allPlayers = await firestore.getAll('players');
  const teamPlayers = allPlayers.filter(p => p.team === teamId);
  
  return `
    <div class="team-detail">
      <div class="flex justify-between items-center mb-16">
        <h2 class="text-gold" style="font-size: 28px; font-weight: 700;">
          <i class="fas fa-users"></i> ${team.name}
        </h2>
        <button class="btn btn-outline-gold" onclick="window.navigateTo('teams')">
          <i class="fas fa-arrow-left"></i> Back to Teams
        </button>
      </div>
      
      <div class="card" style="margin-bottom: 20px;">
        <div class="flex items-center gap-16">
          <div style="width: 120px; height: 120px; border-radius: 50%; background: var(--black); border: 3px solid var(--gold); overflow: hidden; display: flex; align-items: center; justify-content: center;">
            ${team.logo ? `<img src="${team.logo}" style="width: 100%; height: 100%; object-fit: cover;">` : `<i class="fas fa-users" style="font-size: 48px; color: var(--gold);"></i>`}
          </div>
          <div>
            <h3 style="font-size: 24px;">${team.name}</h3>
            <p class="text-muted">Captain: ${team.captain || 'Not set'}</p>
            <p class="text-muted">City: ${team.city || 'Not specified'}</p>
            <p class="text-muted">Players: ${teamPlayers.length}</p>
          </div>
        </div>
      </div>
      
      <h3 class="text-gold" style="margin-bottom: 12px;">Squad</h3>
      <div class="grid-3">
        ${teamPlayers.map(player => `
          <div class="card">
            <div class="flex items-center gap-12">
              <div style="width: 50px; height: 50px; border-radius: 50%; background: var(--black); border: 2px solid var(--gold); overflow: hidden; display: flex; align-items: center; justify-content: center;">
                ${player.photo ? `<img src="${player.photo}" style="width: 100%; height: 100%; object-fit: cover;">` : `<i class="fas fa-user" style="font-size: 20px; color: var(--gold);"></i>`}
              </div>
              <div>
                <h4>${player.name}</h4>
                <p class="text-muted" style="font-size: 12px;">#${player.jerseyNumber || 'N/A'} • ${player.role || 'Player'}</p>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      
      ${teamPlayers.length === 0 ? `
        <div class="text-center text-muted" style="padding: 40px 0;">
          <i class="fas fa-user-plus" style="font-size: 48px; display: block; margin-bottom: 12px;"></i>
          <p>No players in this team yet</p>
          <button class="btn btn-outline-gold" onclick="window.navigateTo('players')">Add Players</button>
        </div>
      ` : ''}
    </div>
  `;
}
