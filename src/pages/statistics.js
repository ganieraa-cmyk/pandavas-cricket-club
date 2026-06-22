import { firestore } from '../firebase-config.js';
import { StatsCalculator } from '../utils/cricket.js';

export async function Statistics() {
  const players = await firestore.getAll('players');
  const matches = await firestore.getAll('matches');
  
  // Calculate batting stats
  const batters = players.map(p => ({
    id: p.id,
    name: p.name,
    photo: p.photo,
    team: p.team,
    runs: p.stats?.batting?.runs || 0,
    balls: p.stats?.batting?.balls || 0,
    fours: p.stats?.batting?.fours || 0,
    sixes: p.stats?.batting?.sixes || 0,
    dismissals: p.stats?.batting?.dismissals || 0,
    average: p.stats?.batting?.dismissals > 0 ? 
      ((p.stats.batting.runs || 0) / p.stats.batting.dismissals).toFixed(2) : '0.00',
    strikeRate: p.stats?.batting?.balls > 0 ?
      ((p.stats.batting.runs || 0) / p.stats.batting.balls * 100).toFixed(2) : '0.00'
  }));
  
  // Calculate bowling stats
  const bowlers = players.map(p => ({
    id: p.id,
    name: p.name,
    photo: p.photo,
    team: p.team,
    wickets: p.stats?.bowling?.wickets || 0,
    runs: p.stats?.bowling?.runsConceded || 0,
    overs: p.stats?.bowling?.overs || 0,
    economy: p.stats?.bowling?.overs > 0 ?
      ((p.stats.bowling.runsConceded || 0) / p.stats.bowling.overs).toFixed(2) : '0.00'
  }));
  
  // Fielding stats
  const fielders = players.map(p => ({
    id: p.id,
    name: p.name,
    photo: p.photo,
    catches: p.stats?.fielding?.catches || 0,
    runOuts: p.stats?.fielding?.runOuts || 0,
    stumpings: p.stats?.fielding?.stumpings || 0
  }));
  
  const topBatters = batters.sort((a, b) => b.runs - a.runs).slice(0, 10);
  const topBowlers = bowlers.sort((a, b) => b.wickets - a.wickets).slice(0, 10);
  const topFielders = fielders.sort((a, b) => (b.catches + b.runOuts + b.stumpings) - (a.catches + a.runOuts + a.stumpings)).slice(0, 10);
  
  const totalRuns = batters.reduce((sum, b) => sum + b.runs, 0);
  const totalWickets = bowlers.reduce((sum, b) => sum + b.wickets, 0);
  const totalMatches = matches.length;
  const totalPlayers = players.length;
  
  return `
    <div class="statistics-page">
      <h2 class="text-gold" style="font-size: 28px; font-weight: 700; margin-bottom: 16px;">
        <i class="fas fa-chart-bar"></i> Statistics
      </h2>
      
      <div class="stats-grid" style="margin-bottom: 24px;">
        ${[
          { icon: '🏏', label: 'Total Runs', value: totalRuns },
          { icon: '🎯', label: 'Total Wickets', value: totalWickets },
          { icon: '🏆', label: 'Matches', value: totalMatches },
          { icon: '👥', label: 'Players', value: totalPlayers }
        ].map(stat => `
          <div class="stat-card">
            <div class="stat-icon">${stat.icon}</div>
            <div class="stat-number">${stat.value}</div>
            <div class="stat-label">${stat.label}</div>
          </div>
        `).join('')}
      </div>
      
      <div class="grid-2">
        <div class="card">
          <h3 style="color: var(--gold);">🏏 Top Batters</h3>
          <div class="table-container" style="font-size: 13px;">
            <table>
              <thead><tr><th>#</th><th>Player</th><th>Runs</th><th>Avg</th><th>SR</th></tr></thead>
              <tbody>
                ${topBatters.map((b, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td>${b.name}</td>
                    <td><strong>${b.runs}</strong></td>
                    <td>${b.average}</td>
                    <td>${b.strikeRate}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="card">
          <h3 style="color: var(--gold);">🎯 Top Bowlers</h3>
          <div class="table-container" style="font-size: 13px;">
            <table>
              <thead><tr><th>#</th><th>Player</th><th>Wickets</th><th>Runs</th><th>Eco</th></tr></thead>
              <tbody>
                ${topBowlers.map((b, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td>${b.name}</td>
                    <td><strong>${b.wickets}</strong></td>
                    <td>${b.runs}</td>
                    <td>${b.economy}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div class="card" style="margin-top: 20px;">
        <h3 style="color: var(--gold);">🧤 Fielding Stats</h3>
        <div class="table-container" style="font-size: 13px;">
          <table>
            <thead><tr><th>#</th><th>Player</th><th>Catches</th><th>Run Outs</th><th>Stumpings</th><th>Total</th></tr></thead>
            <tbody>
              ${topFielders.map((f, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${f.name}</td>
                  <td>${f.catches}</td>
                  <td>${f.runOuts}</td>
                  <td>${f.stumpings}</td>
                  <td><strong>${f.catches + f.runOuts + f.stumpings}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}
