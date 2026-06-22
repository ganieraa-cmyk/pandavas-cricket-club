// src/utils/tournament-utils.js - Tournament Management
import { firestore } from '../firebase-config.js';
import { calculateNRR } from './nrr-calculator.js';

export async function updatePointsTable(tournamentId, matchResult) {
  try {
    const tournament = await firestore.getOne('tournaments', tournamentId);
    if (!tournament) return false;
    
    const pointsTable = tournament.pointsTable || [];
    const { team1, team2, winner, isTie, noResult, nrrData } = matchResult;
    
    // Update team1
    const t1 = pointsTable.find(p => p.teamId === team1.id);
    if (t1) {
      t1.played = (t1.played || 0) + 1;
      t1.runsScored = (t1.runsScored || 0) + (nrrData?.team1Runs || 0);
      t1.oversFaced = (t1.oversFaced || 0) + (nrrData?.team1Overs || 0);
      t1.runsConceded = (t1.runsConceded || 0) + (nrrData?.team2Runs || 0);
      t1.oversBowled = (t1.oversBowled || 0) + (nrrData?.team2Overs || 0);
      
      if (noResult) {
        t1.noResult = (t1.noResult || 0) + 1;
        t1.points = (t1.points || 0) + 1;
      } else if (isTie) {
        t1.tie = (t1.tie || 0) + 1;
        t1.points = (t1.points || 0) + 1;
      } else if (winner && winner.id === team1.id) {
        t1.won = (t1.won || 0) + 1;
        t1.points = (t1.points || 0) + 2;
      } else {
        t1.lost = (t1.lost || 0) + 1;
      }
      
      // Calculate NRR
      const nrrResult = calculateNRR({
        runsScored: t1.runsScored,
        oversFaced: t1.oversFaced,
        runsConceded: t1.runsConceded,
        oversBowled: t1.oversBowled,
        totalOvers: tournament.oversPerMatch || 20
      });
      t1.nrr = nrrResult.nrr;
    }
    
    // Update team2
    const t2 = pointsTable.find(p => p.teamId === team2.id);
    if (t2) {
      t2.played = (t2.played || 0) + 1;
      t2.runsScored = (t2.runsScored || 0) + (nrrData?.team2Runs || 0);
      t2.oversFaced = (t2.oversFaced || 0) + (nrrData?.team2Overs || 0);
      t2.runsConceded = (t2.runsConceded || 0) + (nrrData?.team1Runs || 0);
      t2.oversBowled = (t2.oversBowled || 0) + (nrrData?.team1Overs || 0);
      
      if (noResult) {
        t2.noResult = (t2.noResult || 0) + 1;
        t2.points = (t2.points || 0) + 1;
      } else if (isTie) {
        t2.tie = (t2.tie || 0) + 1;
        t2.points = (t2.points || 0) + 1;
      } else if (winner && winner.id === team2.id) {
        t2.won = (t2.won || 0) + 1;
        t2.points = (t2.points || 0) + 2;
      } else {
        t2.lost = (t2.lost || 0) + 1;
      }
      
      const nrrResult = calculateNRR({
        runsScored: t2.runsScored,
        oversFaced: t2.oversFaced,
        runsConceded: t2.runsConceded,
        oversBowled: t2.oversBowled,
        totalOvers: tournament.oversPerMatch || 20
      });
      t2.nrr = nrrResult.nrr;
    }
    
    // Sort by points, then NRR
    pointsTable.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return (b.nrr || 0) - (a.nrr || 0);
    });
    
    await firestore.update('tournaments', tournamentId, { pointsTable });
    return true;
  } catch (error) {
    console.error('Points table update error:', error);
    return false;
  }
}

export function generateFixtures(teams, type = 'league') {
  const fixtures = [];
  
  if (type === 'league') {
    // Round robin
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        fixtures.push({
          team1: teams[i],
          team2: teams[j],
          round: i + 1,
          status: 'upcoming'
        });
      }
    }
  } else if (type === 'knockout') {
    // Single elimination
    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    for (let i = 0; i < shuffled.length; i += 2) {
      if (i + 1 < shuffled.length) {
        fixtures.push({
          team1: shuffled[i],
          team2: shuffled[i + 1],
          round: 1,
          status: 'upcoming'
        });
      }
    }
  }
  
  return fixtures;
}
