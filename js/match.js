
import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

console.log("MATCH JS LOADED");

let history = [];
let matchId = null;
let runs = 0;
let wickets = 0;
let balls = 0;

// Start Match
document.getElementById("startMatch").addEventListener("click", async () => {

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
    status: "live"
  });

  matchId = matchRef.id;

  alert("Match Started");
});

// Update Scoreboard
function updateScore() {

 document.getElementById("score").innerText =
runs + "/" + wickets;

  const overs = Math.floor(balls / 6);
  const remBalls = balls % 6;

  document.getElementById("overs").innerText =
overs + "." + remBalls + " Overs";
}

// Save Match to Firestore
async function saveMatch() {

  if (!matchId) return;

  await updateDoc(doc(db, "matches", matchId), {
    runs,
    wickets,
    balls
  });
}

// Runs
window.addRun = function(run) {

  history.push({
    runs,
    wickets,
    balls
  });

  runs += run;
  balls++;

  updateScore();
  saveMatch();
}

// Wicket
window.addWicket = function() {

  history.push({
    runs,
    wickets,
    balls
  });

  wickets++;
  balls++;

  updateScore();
  saveMatch();
}

// Wide
window.addWide = function() {

  history.push({
    runs,
    wickets,
    balls
  });

  runs += 1;

  updateScore();
  saveMatch();
}

// No Ball
window.addNoBall = function() {

  history.push({
    runs,
    wickets,
    balls
  });

  runs += 1;

  updateScore();
  saveMatch();
}

// Undo
window.undoLast = function() {

  if (history.length === 0) return;

  const last = history.pop();

  runs = last.runs;
  wickets = last.wickets;
  balls = last.balls;

  updateScore();
  saveMatch();
}

updateScore();
```
