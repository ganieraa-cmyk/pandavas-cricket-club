// src/utils/firestore-helpers.js
import { db } from '../firebase-config.js';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export async function getTeams() {
  const snapshot = await getDocs(collection(db, 'teams'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getPlayers() {
  const snapshot = await getDocs(collection(db, 'players'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getMatches(limitCount = 10) {
  const q = query(collection(db, 'matches'), orderBy('date', 'desc'), limit(limitCount));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getTournaments() {
  const snapshot = await getDocs(collection(db, 'tournaments'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getPlayersByTeam(teamId) {
  const q = query(collection(db, 'players'), where('team', '==', teamId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getMatchesByTournament(tournamentId) {
  const q = query(collection(db, 'matches'), where('tournamentId', '==', tournamentId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
