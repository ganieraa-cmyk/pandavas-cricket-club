import { db, auth } from "./firebase.js";

console.log("Pandavas Cricket Club Loaded");
console.log("DB =", db);
console.log("AUTH =", auth);

document.body.insertAdjacentHTML(
  "beforeend",
  "<p style='color:white'>Firebase Connected ✅</p>"
);
