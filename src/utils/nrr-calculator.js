// src/utils/nrr-calculator.js - NRR Calculation
export function calculateNRR(teamData) {
  // NRR = (Runs Scored / Overs Faced) - (Runs Conceded / Overs Bowled)
  
  let runsScored = teamData.runsScored || 0;
  let oversFaced = teamData.oversFaced || 0;
  let runsConceded = teamData.runsConceded || 0;
  let oversBowled = teamData.oversBowled || 0;
  const totalOvers = teamData.totalOvers || 20;
  
  // SPECIAL: All-out handling
  // If team all out before full overs, denominator = full overs
  if (teamData.isAllOut) {
    oversFaced = totalOvers;
  }
  if (teamData.bowledAllOut) {
    oversBowled = totalOvers;
  }
  
  // Convert overs to decimal for calculation
  const oversFacedDecimal = Math.floor(oversFaced) + ((oversFaced % 1) * 0.6);
  const oversBowledDecimal = Math.floor(oversBowled) + ((oversBowled % 1) * 0.6);
  
  // Minimum overs for NRR calculation
  const minOvers = 0.1;
  const actualOversFaced = Math.max(oversFacedDecimal, minOvers);
  const actualOversBowled = Math.max(oversBowledDecimal, minOvers);
  
  const runRateScored = runsScored / actualOversFaced;
  const runRateConceded = runsConceded / actualOversBowled;
  
  const nrr = runRateScored - runRateConceded;
  
  return {
    nrr: parseFloat(nrr.toFixed(3)),
    runsScored,
    oversFaced: actualOversFaced,
    runRateScored: parseFloat(runRateScored.toFixed(2)),
    runsConceded,
    oversBowled: actualOversBowled,
    runRateConceded: parseFloat(runRateConceded.toFixed(2)),
    isAllOut: teamData.isAllOut || false,
    totalOvers
  };
}

export function calculateTournamentNRR(teamsData) {
  return teamsData.map(team => ({
    ...team,
    nrr: calculateNRR(team).nrr
  })).sort((a, b) => b.nrr - a.nrr);
}
