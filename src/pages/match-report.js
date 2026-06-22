import { firestore } from '../firebase-config.js';
import { generateMatchResult } from '../utils/match-result.js';
import { generatePDF } from '../utils/pdf-generator.js';

export async function MatchReport(params) {
  const matchId = params?.id;
  let match = null;
  
  if (matchId) {
    match = await firestore.getOne('matches', matchId);
  }
  
  if (!match) {
    const matches = await firestore.getAll('matches');
    const completedMatches = matches.filter(m => m.status === 'completed');
    const sortedMatches = completedMatches.sort((a, b) => new Date(b.date) - new Date(a.date));
    const recentMatches = sortedMatches.slice(0, 10);
    
    return `
      <div class="match-report-page">
        <h2 class="text-gold" style="font-size: 28px; font-weight: 700; margin-bottom: 16px;">
          <i class="fas fa-file-alt"></i> Match Reports
        </h2>
        <div class="card">
          <h3 style="margin-bottom: 12px;">Completed Matches</h3>
          ${recentMatches.length > 0 ? `
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
                          onclick="window.navigateTo('match-report', { id: '${m.id}' })">
                          <i class="fas fa-eye"></i> View Report
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : `
            <div class="text-center text-muted" style="padding: 40px 0;">
              <i class="fas fa-inbox" style="font-size: 48px; display: block; margin-bottom: 12px;"></i>
              No completed matches yet. Complete a match to generate a report.
            </div>
          `}
        </div>
      </div>
    `;
  }
  
  // Generate report for specific match
  const score = match.scoring || {};
  const team1Name = match.team1Name || 'Team 1';
  const team2Name = match.team2Name || 'Team 2';
  
  // Generate match summary
  const result = generateMatchResult({
    team1: { id: match.team1, name: team1Name },
    team2: { id: match.team2, name: team2Name },
    scoring: score,
    target: match.target,
    currentInnings: match.currentInnings || 2,
    totalOvers: match.overs || 20
  });
  
  const battingStats = score.battingStats || [];
  const bowlingStats = score.bowlingStats || [];
  const fallOfWickets = score.fallOfWickets || [];
  
  // Find top performers
  const topBatter = battingStats.sort((a, b) => b.runs - a.runs)[0] || null;
  const topBowler = bowlingStats.sort((a, b) => b.wickets - a.wickets)[0] || null;
  
  return `
    <div class="match-report-page">
      <div class="flex justify-between items-center mb-16">
        <h2 class="text-gold" style="font-size: 28px; font-weight: 700;">
          <i class="fas fa-file-alt"></i> Match Report
        </h2>
        <div class="flex gap-8">
          <button class="btn btn-outline-gold" onclick="window.navigateTo('match-report')">
            <i class="fas fa-arrow-left"></i> Back
          </button>
          <button class="btn btn-gold" onclick="window.downloadReport('${matchId}')">
            <i class="fas fa-file-pdf"></i> PDF Report
          </button>
        </div>
      </div>
      
      <div class="card" style="margin-bottom: 20px;" id="reportContent">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid var(--gold); padding-bottom: 16px;">
          <h1 style="color: var(--gold); font-size: 28px;">🏏 ${match.title || 'Match Report'}</h1>
          <p class="text-muted">${new Date(match.date).toLocaleString()}</p>
          <p class="text-muted">${team1Name} vs ${team2Name} • ${match.type || 'T20'} (${match.overs || 20} overs)</p>
        </div>
        
        <!-- Result -->
        <div style="background: rgba(255,215,0,0.05); padding: 16px; border-radius: 12px; margin-bottom: 20px; border: 1px solid var(--gold);">
          <div style="font-size: 20px; font-weight: 700; color: var(--gold); text-align: center;">
            ${result.result || 'Match in progress'}
          </div>
          ${result.winner ? `<div style="text-align: center; color: var(--text-secondary);">Winner: ${result.winner.name}</div>` : ''}
          ${match.motm ? `<div style="text-align: center; color: var(--gold);">🏆 Player of the Match: ${match.motm}</div>` : ''}
        </div>
        
        <!-- Score Summary -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
          <div style="background: var(--black); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,215,0,0.1);">
            <div style="color: var(--text-secondary); font-size: 12px;">${team1Name}</div>
            <div style="font-size: 24px; font-weight: 700;">${score.runs || 0}/${score.wickets || 0}</div>
            <div style="color: var(--text-muted); font-size: 12px;">Overs: ${score.overs || '0.0'}</div>
          </div>
          <div style="background: var(--black); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,215,0,0.1);">
            <div style="color: var(--text-secondary); font-size: 12px;">${team2Name}</div>
            <div style="font-size: 24px; font-weight: 700;">-</div>
            <div style="color: var(--text-muted); font-size: 12px;">Yet to bat</div>
          </div>
        </div>
        
        <!-- Top Performers -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
          <div style="background: rgba(255,215,0,0.03); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,215,0,0.1);">
            <h4 style="color: var(--gold); font-size: 14px;">🏏 Best Batter</h4>
            ${topBatter ? `
              <div style="font-weight: 600;">${topBatter.name}</div>
              <div style="color: var(--text-muted); font-size: 12px;">${topBatter.runs} runs (${topBatter.balls}b) • SR: ${topBatter.strikeRate}</div>
            ` : '<div class="text-muted">No data</div>'}
          </div>
          <div style="background: rgba(255,215,0,0.03); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,215,0,0.1);">
            <h4 style="color: var(--gold); font-size: 14px;">🎯 Best Bowler</h4>
            ${topBowler ? `
              <div style="font-weight: 600;">${topBowler.name}</div>
              <div style="color: var(--text-muted); font-size: 12px;">${topBowler.wickets} wickets • Eco: ${topBowler.economy}</div>
            ` : '<div class="text-muted">No data</div>'}
          </div>
        </div>
        
        <!-- Fall of Wickets -->
        ${fallOfWickets.length > 0 ? `
          <div style="margin-bottom: 16px;">
            <h4 style="color: var(--gold); font-size: 14px;">Fall of Wickets</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${fallOfWickets.map(fow => `
                <span style="background: rgba(220,38,38,0.1); padding: 4px 12px; border-radius: 12px; font-size: 12px; border: 1px solid rgba(220,38,38,0.2);">
                  ${fow.wicketNumber}-${fow.batsman} (${fow.runs}, ${fow.overs} ov)
                </span>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        <!-- Match Summary Text -->
        <div style="margin-top: 16px; padding: 12px; background: rgba(255,215,0,0.03); border-radius: 8px; border-left: 3px solid var(--gold);">
          <p style="color: var(--text-secondary); font-size: 14px; font-style: italic;">
            ${generateReportSummary(match, score, result, topBatter, topBowler)}
          </p>
        </div>
        
        <div style="text-align: center; color: var(--text-muted); font-size: 11px; margin-top: 20px; border-top: 1px solid rgba(255,215,0,0.1); padding-top: 12px;">
          Generated by Pandavas Cricket Club Scorer v3.1
        </div>
      </div>
    </div>
  `;
}

function generateReportSummary(match, score, result, topBatter, topBowler) {
  const team1Name = match.team1Name || 'Team 1';
  const team2Name = match.team2Name || 'Team 2';
  
  let summary = `${team1Name} scored ${score.runs}/${score.wickets} in ${score.overs || '0.0'} overs. `;
  
  if (topBatter) {
    summary += `${topBatter.name} top-scored with ${topBatter.runs} runs. `;
  }
  
  if (topBowler) {
    summary += `${topBowler.name} took ${topBowler.wickets} wickets. `;
  }
  
  if (result.result && result.result !== 'Match in progress') {
    summary += result.result;
  }
  
  if (match.motm) {
    summary += ` ${match.motm} was named Player of the Match.`;
  }
  
  return summary;
}

window.downloadReport = async function(matchId) {
  const match = await firestore.getOne('matches', matchId);
  if (!match) {
    alert('Match not found');
    return;
  }
  
  const element = document.getElementById('reportContent');
  if (element) {
    generatePDF('reportContent', `${match.title || 'match-report'}.pdf`);
  }
};
