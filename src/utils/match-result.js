// src/utils/match-result.js - Complete Match Result Generator
export function generateMatchResult(matchData) {
  const { team1, team2, innings, target, currentInnings = 1, totalOvers = 20 } = matchData;
  const score = matchData.scoring || {};
  
  let result = '';
  let winner = null;
  let margin = '';
  let motm = null;
  let isTie = false;
  let isSuperOver = false;
  let isAbandoned = false;
  let isRainAffected = false;
  let dlsTarget = null;

  // Check for abandoned
  if (matchData.isAbandoned) {
    isAbandoned = true;
    result = 'Match Abandoned';
    return { result, winner, margin, motm, isTie, isSuperOver, isAbandoned };
  }

  // Check for rain affected / DLS
  if (matchData.isRainAffected && matchData.dlsTarget) {
    isRainAffected = true;
    dlsTarget = matchData.dlsTarget;
    const battingTeam = currentInnings === 1 ? team1 : team2;
    const bowlingTeam = currentInnings === 1 ? team2 : team1;
    
    if (score.runs >= dlsTarget) {
      winner = battingTeam;
      margin = `${dlsTarget - score.runs} runs (DLS)`;
      result = `${battingTeam.name} won by ${margin}`;
    } else {
      winner = bowlingTeam;
      margin = `${dlsTarget - score.runs} runs (DLS)`;
      result = `${bowlingTeam.name} won by ${margin}`;
    }
    return { result, winner, margin, motm, isTie, isSuperOver, isRainAffected, dlsTarget };
  }

  // Check for tie
  if (currentInnings === 2 && score.runs === target && target) {
    isTie = true;
    result = 'Match Tied!';
    if (matchData.isKnockout) {
      isSuperOver = true;
      result = 'Match Tied! Super Over needed';
    }
    return { result, winner, margin, motm, isTie, isSuperOver };
  }

  // Determine batting and bowling teams
  const battingTeam = currentInnings === 1 ? team1 : team2;
  const bowlingTeam = currentInnings === 1 ? team2 : team1;

  const isAllOut = score.wickets >= 10;
  const isTargetReached = target && score.runs >= target;
  const isOversComplete = score.balls >= (totalOvers || 20) * 6;

  if (currentInnings === 2) {
    if (isTargetReached) {
      winner = battingTeam;
      const wicketsLost = score.wickets;
      margin = `${10 - wicketsLost} wickets`;
      result = `${battingTeam.name} won by ${margin}`;
    } else if (isAllOut || isOversComplete) {
      winner = bowlingTeam;
      const runsShort = target - score.runs;
      margin = `${runsShort} runs`;
      result = `${bowlingTeam.name} won by ${margin}`;
    } else {
      result = 'Match in progress';
    }
  } else {
    result = 'First innings in progress';
  }

  // Calculate MOM for completed matches
  if (winner && matchData.battingStats && matchData.bowlingStats) {
    motm = calculateMOM(matchData.battingStats, matchData.bowlingStats);
  }

  return { 
    result, 
    winner, 
    margin, 
    motm, 
    isTie, 
    isSuperOver, 
    isAbandoned, 
    isRainAffected, 
    dlsTarget 
  };
}

export function calculateMOM(battingStats, bowlingStats) {
  let bestScore = 0;
  let motm = null;
  const allPlayers = {};

  battingStats.forEach(b => {
    allPlayers[b.name] = { 
      name: b.name, 
      runs: b.runs || 0, 
      wickets: 0, 
      score: (b.runs || 0) * 1.5 
    };
  });

  bowlingStats.forEach(b => {
    if (!allPlayers[b.name]) {
      allPlayers[b.name] = { name: b.name, runs: 0, wickets: 0, score: 0 };
    }
    allPlayers[b.name].wickets = b.wickets || 0;
    allPlayers[b.name].score += (b.wickets || 0) * 25;
  });

  Object.values(allPlayers).forEach(p => {
    if (p.score > bestScore) {
      bestScore = p.score;
      motm = p;
    }
  });

  return motm;
}

export function setupSuperOver(matchData) {
  return {
    overs: 1,
    target: matchData.team1Score + 1,
    battingTeam: matchData.team2,
    bowlingTeam: matchData.team1
  };
}
