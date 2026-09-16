const select = document.querySelector("#user-select");
const moods = document.querySelector("#moods");
const note = document.querySelector("#note");
const message = document.querySelector("#message");
const today = new Date();
document.querySelector("#today").textContent = today.toLocaleDateString(undefined, { month: "short", day: "numeric" });

let selectedMood = null;
const moodLabels = ["Very low", "Low", "Okay", "Good", "Great"];
const moodIcons = ["😞", "😕", "😐", "🙂", "😊"];
moodLabels.forEach((label, index) => {
  const button = document.createElement("button");
  button.className = "mood";
  button.type = "button";
  button.innerHTML = `<span>${moodIcons[index]}</span><small>${label}</small>`;
  button.addEventListener("click", () => {
    selectedMood = index + 1;
    document.querySelectorAll(".mood").forEach((item) => item.classList.remove("selected"));
    button.classList.add("selected");
  });
  moods.append(button);
});

async function loadUsers() {
  const response = await fetch("/api/users");
  const users = await response.json();
  users.forEach((user) => select.add(new Option(user.pseudonym, user.id)));
  select.addEventListener("change", loadDashboard);
  await loadDashboard();
}

async function loadDashboard() {
  const response = await fetch(`/api/dashboard?userId=${encodeURIComponent(select.value)}`);
  const data = await response.json();
  renderChart(data.checkIns);
  document.querySelector("#resources").innerHTML = data.resources.map((item) =>
    `<div class="resource"><h3>${item.title}</h3><p>${item.description}</p></div>`).join("");
  message.textContent = "";
  note.value = "";
  selectedMood = null;
  document.querySelectorAll(".mood").forEach((item) => item.classList.remove("selected"));
}

function renderChart(entries) {
  const chart = document.querySelector("#chart");
  const recent = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  chart.innerHTML = recent.length ? recent.map((entry) =>
    `<div class="bar-wrap"><span class="score">${entry.moodScore}</span><div class="bar" style="height:${entry.moodScore * 18 + 14}px"></div><span>${new Date(`${entry.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" })}</span></div>`).join("") : "<p>No check-ins yet.</p>";
}

document.querySelector("#submit").addEventListener("click", async () => {
  if (!selectedMood) {
    message.textContent = "Choose a mood before saving.";
    return;
  }
  const response = await fetch("/api/check-ins", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: select.value, moodScore: selectedMood, note: note.value })
  });
  const data = await response.json();
  if (!response.ok) {
    message.textContent = data.error;
    return;
  }
  message.textContent = "Saved. Thanks for checking in.";
  await loadDashboard();
});

loadUsers().catch(() => { message.textContent = "The demo could not load. Please refresh."; });
