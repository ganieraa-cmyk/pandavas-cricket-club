alert("MATCH JS LOADED");
import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

let matchId = null;
document.getElementById("startMatch").addEventListener("click", async () => {
console.log("START MATCH CLICKED");
  const teamA = document.getElementById("teamA").value;
  const teamB = document.getElementById("teamB").value;

  if (!teamA || !teamB) {
    alert("Enter both teams");
    return;
  }

  const matchRef = await addDoc(collection(db, "matches"), {
    teamA,
    teamB,
    runs: 0,
    wickets: 0,
    balls: 0,
    status: "live",
    createdAt: new Date().toISOString()
  });

  matchId = matchRef.id;

  alert("Match Started");
});
let runs = 0;
let wickets = 0;
let balls = 0;

function updateScore() {
  document.getElementById("score").innerText =
    `${runs}/${wickets}`;

  const overs = Math.floor(balls / 6);
  const remBalls = balls % 6;

  document.getElementById("overs").innerText =
    `${overs}.${remBalls} Overs`;
}

window.addRun = function(run) {
  runs += run;
  balls++;
  updateScore();
  saveMatch();
}

window.addWicket = function() {
  wickets++;
  balls++;
  updateScore();
  saveMatch();

}

updateScore();
async function saveMatch() {

  if (!matchId) return;

  await updateDoc(doc(db, "matches", matchId), {
    runs,
    wickets,
    balls
  });
}
