import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const saveBtn = document.getElementById("savePlayer");
const playerList = document.getElementById("playerList");

saveBtn.addEventListener("click", async () => {
  const name = document.getElementById("playerName").value;
  const jerseyNo = Number(document.getElementById("jerseyNo").value);

  if (!name || !jerseyNo) {
    alert("Enter player details");
    return;
  }

  await addDoc(collection(db, "players"), {
    name,
    jerseyNo,
    matches: 0,
    runs: 0,
    wickets: 0
  });

  alert("Player Saved Successfully");
  loadPlayers();
});

async function loadPlayers() {
  const querySnapshot = await getDocs(collection(db, "players"));

  playerList.innerHTML = "<h2>Players</h2>";

  querySnapshot.forEach((doc) => {
    const player = doc.data();

    playerList.innerHTML += `
      <div style="margin:10px;padding:10px;border:1px solid gold;">
        ${player.name} (#${player.jerseyNo})
      </div>
    `;
  });
}

loadPlayers();
