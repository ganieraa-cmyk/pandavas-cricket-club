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
}

window.addWicket = function() {
  wickets++;
  balls++;
  updateScore();
}

updateScore();
