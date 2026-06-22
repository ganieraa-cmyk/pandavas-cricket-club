import { firestore } from '../firebase-config.js';
import { StatsCalculator } from '../utils/cricket.js';

export async function Leaderboards() {
  const players = await firestore.getAll('players');
  
  const batters = players.map(p => ({
    id: p.id,
    name: p.name,
    photo: p.photo,
    runs: p.stats?.batting?.runs || 0,
    balls: p.stats?.batting?.balls || 0,
    average: p.stats?.batting?.dismissals > 0 ?
      ((p.stats.batting.runs || 0) / p.stats.batting.dismissals).toFixed(2) : '0.00',
    strikeRate: p.stats?.batting?.balls > 0 ?
      ((p.stats.batting.runs || 0) / p.stats.batting.balls * 100).toFixed(2) : '0.00',
    fours: p.stats?.batting?.fours || 0,
    sixes: p.stats?.batting?.sixes || 0
  }));
  
  const bowlers = players.map(p => ({
    id: p.id,
    name: p.name,
    photo: p.photo,
    wickets: p.stats?.bowling?.wickets || 0,
    runs: p.stats?.bowling?.runsConceded || 0,
    overs: p.stats?.bowling?.overs || 0,
    economy: p.stats?.bowling?.overs > 0 ?
      ((p.stats.bowling.runsConceded || 0) / p.stats.bowling.overs).toFixed(2) : '0.00',
    maidens: p.stats?.bowling?.maidens || 0
  }));
  
  const fielders = players.map(p => ({
    id: p.id,
    name: p.name,
    photo: p.photo,
    catches: p.stats?.fielding?.catches || 0,
    runOuts: p.stats?.fielding?.runOuts || 0,
    stumpings: p.stats?.fielding?.stumpings || 0
  }));
  
  const orangeCap = batters.sort((a, b) => b.runs - a.runs)[0] || null;
  const purpleCap = bowlers.sort((a, b) => b.wickets - a.wickets)[0] || null;
  const bestFielder = fielders.sort((a, b) => (b.catches + b.runOuts + b.stumpings) - (a.catches + a.runOuts + a.stumpings))[0] || null;
  
  const topBatters = batters.sort((a, b) => b.runs - a.runs).slice(0, 5);
  const topBowlers = bowlers.sort((a, b) => b.wickets - a.wickets).slice(0, 5);
  
  return `
    <div class="leaderboards-page">
      <h2 class="text-gold" style="font-size: 28px; font-weight: 700; margin-bottom: 16px;">
        <i class="fas fa-crown"></i> Leaderboards
      </h2>
      
      <div class="grid-3" style="margin-bottom: 24px;">
        <div class="card" style="border: 2px solid #FFA500; text-align: center;">
          <div style="font-size: 48px;">🧡</div>
          <h3 style="color: #FFA500;">Orange Cap</h3>
          ${orangeCap ? `
            <div style="margin-top: 8px;">
              <div style="width: 60px; height: 60px; border-radius: 50%; background: var(--black); border: 2px solid #FFA500; overflow: hidden; margin: 0 auto;">
                ${orangeCap.photo ? `<img src="${orangeCap.photo}" style="width: 100%; height: 100%; object-fit: cover;">` : `<i class="fas fa-user" style="font-size: 24px; color: #FFA500; display: flex; align-items: center; justify-content: center; height: 100%;"></i>`}
              </div>
              <div style="font-weight: 700; font-size: 18px; margin-top: 4px;">${orangeCap.name}</div>
              <div class="text-muted">${orangeCap.runs} runs • Avg: ${orangeCap.average}</div>
            </div>
          ` : '<p class="text-muted">No data yet</p>'}
        </div>
        
        <div class="card" style="border: 2px solid #7B2FBE; text-align: center;">
          <div style="font-size: 48px;">💜</div>
          <h3 style="color: #7B2FBE;">Purple Cap</h3>
          ${purpleCap ? `
            <div style="margin-top: 8px;">
              <div style="width: 60px; height: 60px; border-radius: 50%; background: var(--black); border: 2px solid #7B2FBE; overflow: hidden; margin: 0 auto;">
                ${purpleCap.photo ? `<img src="${purpleCap.photo}" style="width: 100%; height: 100%; object-fit: cover;">` : `<i class="fas fa-user" style="font-size: 24px; color: #7B2FBE; display: flex; align-items: center; justify-content: center; height: 100%;"></i>`}
              </div>
              <div style="font-weight: 700; font-size: 18px; margin-top: 4px;">${purpleCap.name}</div>
              <div class="text-muted">${purpleCap.wickets} wickets • Eco: ${purpleCap.economy}</div>
            </div>
          ` : '<p class="text-muted">No data yet</p>'}
        </div>
        
        <div class="card" style="border: 2px solid #FFD700; text-align: center;">
          <div style="font-size: 48px;">🧤</div>
          <h3 style="color: #FFD700;">Best Fielder</h3>
          ${bestFielder ? `
            <div style="margin-top: 8px;">
              <div style="width: 60px; height: 60px; border-radius: 50%; background: var(--black); border: 2px solid #FFD700; overflow: hidden; margin: 0 auto;">
                ${bestFielder.photo ? `<img src="${bestFielder.photo}" style="width: 100%; height: 100%; object-fit: cover;">` : `<i class="fas fa-user" style="font-size: 24px; color: #FFD700; display: flex; align-items: center; justify-content: center; height: 100%;"></i>`}
              </div>
              <div style="font-weight: 700; font-size: 18px; margin-top: 4px;">${bestFielder.name}</div>
              <div class="text-muted">${bestFielder.catches} catches • ${bestFielder.runOuts} run outs</div>
            </div>
          ` : '<p class="text-muted">No data yet</p>'}
        </div>
      </div>
      
      <div class="grid-2">
        <div class="card">
          <h4 style="color: var(--gold);">Top 5 Batters</h4>
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
          <h4 style="color: var(--gold);">Top 5 Bowlers</h4>
          <div class="table-container" style="font-size: 13px;">
            <table>
              <thead><tr><th>#</th><th>Player</th><th>Wickets</th><th>Eco</th><th>Avg</th></tr></thead>
              <tbody>
                ${topBowlers.map((b, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td>${b.name}</td>
                    <td><strong>${b.wickets}</strong></td>
                    <td>${b.economy}</td>
                    <td>${b.wickets > 0 ? (b.runs / b.wickets).toFixed(2) : '0.00'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}
