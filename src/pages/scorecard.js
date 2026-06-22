import { firestore } from '../firebase-config.js';
import { generateScorecardPDF } from '../utils/pdf-generator.js';

export async function Scorecard(params) {
  const matchId = params?.id;
  let match = null;
  
  if (matchId) {
    match = await firestore.getOne('matches', matchId);
  }
  
  if (!match) {
    const matches = await firestore.getAll('matches');
    const sortedMatches = matches.sort((a, b) => new Date(b.date) - new Date(a.date));
    const recentMatches = sortedMatches.slice(0, 10);
    
    return `
      <div class="scorecard-page">
        <h2 class="text-gold" style="font-size: 28px; font-weight: 700; margin-bottom: 16px;">
          <i class="fas fa-scroll"></i> Scorecard
        </h2>
        <div class="card">
          <h3 style="margin-bottom: 12px;">Recent Matches</h3>
          <div class="table-container">
            <table>
              <thead><tr><th>Match</th><th>Date</th><th>Result</th><th>Action</th></tr></thead>
              <tbody>
                ${recentMatches.map(m => `
                  <tr>
                    <td><strong>${m.title || m.team1Name + ' vs ' + m.team2Name}</strong></td>
                    <td>${new Date(m.date).toLocaleDateString()}</td>
                    <td>${m.result || '—'}</td>
                    <td>
                      <button class="btn btn-outline-gold" style="padding: 4px 12px; font-size: 12px;" 
                        onclick="window.navigateTo('scorecard', { id: '${m.id}' })">
                        <i class="fas fa-eye"></i> View
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }
  
  const score = match.scoring || {};
  const team1Name = match.team1Name || 'Team 1';
  const team2Name = match.team2Name || 'Team 2';
  
  // Prepare batting stats from innings data
  const battingStats = score.battingStats || [];
  const bowlingStats = score.bowlingStats || [];
  const fallOfWickets = score.fallOfWickets || [];
  
  return `
    <div class="scorecard-page">
      <div class="flex justify-between items-center mb-16">
        <h2 class="text-gold" style="font-size: 28px; font-weight: 700;">
          <i class="fas fa-scroll"></i> ${match.title || 'Match Scorecard'}
        </h2>
        <div class="flex gap-8">
          <button class="btn btn-outline-gold" onclick="window.navigateTo('match-center')">
            <i class="fas fa-arrow-left"></i> Back
          </button>
          <button class="btn btn-gold" onclick="window.downloadScorecard('${matchId}')">
            <i class="fas fa-file-pdf"></i> PDF
          </button>
        </div>
      </div>
      
      <div class="card" style="margin-bottom: 20px;" id="scorecardContent">
        <div class="flex justify-between items-center">
          <div>
            <h3>${team1Name} vs ${team2Name}</h3>
            <p class="text-muted">${new Date(match.date).toLocaleString()}</p>
            <p class="text-muted">${match.type || 'T20'} • ${match.overs || 20} overs</p>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 32px; font-weight: 800; color: var(--gold);">
              ${score.runs || 0}/${score.wickets || 0}
            </div>
            <div class="text-muted">Overs: ${score.overs || '0.0'}</div>
            <div class="text-muted">RR: ${score.runRate || '0.00'}</div>
          </div>
        </div>
        ${match.result ? `<div style="margin-top: 12px; padding: 8px 16px; background: rgba(255,215,0,0.1); border-radius: 8px;">${match.result}</div>` : ''}
        ${match.motm ? `<div style="margin-top: 8px; color: var(--gold);">🏆 Player of the Match: ${match.motm}</div>` : ''}
      </div>
      
      ${battingStats.length > 0 ? `
        <div class="card" style="margin-bottom: 16px;">
          <h3 style="color: var(--gold); margin-bottom: 12px;">Batting</h3>
          <div class="table-container">
            <table>
              <thead><tr><th>Batter</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr></thead>
              <tbody>
                ${battingStats.map(b => `
                  <tr>
                    <td>${b.name}</td>
                    <td><strong>${b.runs}</strong></td>
                    <td>${b.balls}</td>
                    <td>${b.fours}</td>
                    <td>${b.sixes}</td>
                    <td>${b.strikeRate || '0.00'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}
      
      ${bowlingStats.length > 0 ? `
        <div class="card" style="margin-bottom: 16px;">
          <h3 style="color: var(--gold); margin-bottom: 12px;">Bowling</h3>
          <div class="table-container">
            <table>
              <thead><tr><th>Bowler</th><th>O</th><th>M</th><th>R</th><th>W</th><th>ECO</th></tr></thead>
              <tbody>
                ${bowlingStats.map(b => `
                  <tr>
                    <td>${b.name}</td>
                    <td>${b.overs}</td>
                    <td>${b.maidens || 0}</td>
                    <td>${b.runs}</td>
                    <td><strong>${b.wickets}</strong></td>
                    <td>${b.economy || '0.00'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}
      
      ${fallOfWickets.length > 0 ? `
        <div class="card">
          <h3 style="color: var(--gold); margin-bottom: 12px;">Fall of Wickets</h3>
          <div class="flex flex-wrap gap-8">
            ${fallOfWickets.map(fow => `
              <span style="background: rgba(220,38,38,0.1); padding: 4px 12px; border-radius: 12px; font-size: 12px; border: 1px solid rgba(220,38,38,0.2);">
                ${fow.wicketNumber}-${fow.batsman} (${fow.runs}, ${fow.overs} ov)
              </span>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

window.downloadScorecard = async function(matchId) {
  const match = await firestore.getOne('matches', matchId);
  if (!match) {
    alert('Match not found');
    return;
  }
  
  const score = match.scoring || {};
  generateScorecardPDF({
    title: match.title,
    date: match.date,
    team1Name: match.team1Name || 'Team 1',
    team2Name: match.team2Name || 'Team 2',
    result: match.result,
    battingStats: score.battingStats || [],
    bowlingStats: score.bowlingStats || []
  }, `${match.title || 'scorecard'}.pdf`);
};
