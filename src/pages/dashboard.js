import { firestore } from '../firebase-config.js';

function sortByDate(array, field = 'date', order = 'desc') {
  return array.sort((a, b) => {
    const dateA = new Date(a[field]);
    const dateB = new Date(b[field]);
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}

export async function Dashboard() {
  const [matches, players, teams, tournaments] = await Promise.all([
    firestore.getAll('matches'),
    firestore.getAll('players'),
    firestore.getAll('teams'),
    firestore.getAll('tournaments')
  ]);
  
  const totalMatches = matches.length;
  const totalPlayers = players.length;
  const totalTeams = teams.length;
  const totalTournaments = tournaments.length;
  const recentMatches = sortByDate(matches).slice(0, 5);
  
  return `
    <div class="dashboard">
      <div class="flex justify-between items-center mb-16">
        <h2 class="text-gold" style="font-size: 28px; font-weight: 700;">
          <i class="fas fa-home"></i> Dashboard
        </h2>
        <button class="btn btn-gold" onclick="window.navigateTo('match-center')">
          <i class="fas fa-plus"></i> New Match
        </button>
      </div>
      
      <div class="stats-grid">
        ${[
          { icon: '🏏', label: 'Total Matches', value: totalMatches },
          { icon: '👥', label: 'Total Players', value: totalPlayers },
          { icon: '🏆', label: 'Tournaments', value: totalTournaments },
          { icon: '⭐', label: 'Teams', value: totalTeams }
        ].map(stat => `
          <div class="stat-card">
            <div class="stat-icon">${stat.icon}</div>
            <div class="stat-number">${stat.value}</div>
            <div class="stat-label">${stat.label}</div>
          </div>
        `).join('')}
      </div>
      
      <div class="card" style="margin-top: 24px;">
        <h3 class="text-gold" style="margin-bottom: 16px;">
          <i class="fas fa-clock"></i> Recent Matches
        </h3>
        ${recentMatches.length > 0 ? `
          <div class="table-container">
            <table>
              <thead><tr><th>Match</th><th>Date</th><th>Result</th><th>Status</th></tr></thead>
              <tbody>
                ${recentMatches.map(m => `
                  <tr>
                    <td><strong>${m.title || m.team1 + ' vs ' + m.team2}</strong></td>
                    <td>${new Date(m.date).toLocaleDateString()}</td>
                    <td>${m.result || '—'}</td>
                    <td><span class="badge ${m.status === 'completed' ? 'badge-success' : m.status === 'live' ? 'badge-warning' : 'badge'}">${m.status || 'Upcoming'}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `
          <div class="text-center text-muted" style="padding: 40px 0;">
            <i class="fas fa-inbox" style="font-size: 48px; display: block; margin-bottom: 12px;"></i>
            No matches played yet. Start your first match!
          </div>
        `}
      </div>
      
      <div class="grid-3" style="margin-top: 24px;">
        ${[
          { icon: 'fa-users', label: 'Manage Teams', page: 'teams' },
          { icon: 'fa-user-cog', label: 'Manage Players', page: 'players' },
          { icon: 'fa-trophy', label: 'Tournaments', page: 'tournaments' }
        ].map(action => `
          <div class="card text-center" style="cursor: pointer;" onclick="window.navigateTo('${action.page}')">
            <i class="fas ${action.icon}" style="font-size: 32px; color: var(--gold); margin-bottom: 8px;"></i>
            <h4>${action.label}</h4>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
