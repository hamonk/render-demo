const select = document.querySelector("#user-select");
const moods = document.querySelector("#moods");
const tags = document.querySelector("#tags");
const note = document.querySelector("#note");
const message = document.querySelector("#message");
const today = new Date();
document.querySelector("#today").textContent = today.toLocaleDateString(undefined, { month: "short", day: "numeric" });

let selectedMood = null;
let selectedTags = [];
let dashboard = null;
const moodLabels = ["Very low", "Low", "Okay", "Good", "Great"];
const moodIcons = ["😞", "😕", "😐", "🙂", "😊"];
const tagOptions = ["sleep", "work", "stress", "relationships", "movement", "rest", "creativity", "connection"];

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

tagOptions.forEach((tag) => {
  const button = document.createElement("button");
  button.className = "tag";
  button.type = "button";
  button.textContent = tag;
  button.addEventListener("click", () => {
    if (selectedTags.includes(tag)) selectedTags = selectedTags.filter((item) => item !== tag);
    else if (selectedTags.length < 3) selectedTags.push(tag);
    button.classList.toggle("selected", selectedTags.includes(tag));
  });
  tags.append(button);
});

function showStep(step) {
  document.querySelectorAll(".step").forEach((item) => item.classList.add("hidden"));
  document.querySelector(`#step-${step}`).classList.remove("hidden");
  document.querySelector("#step-label").textContent = `${step === "mood" ? 1 : step === "tags" ? 2 : 3} of 3`;
  document.querySelector("#step-title").textContent = step === "mood" ? "How are you feeling?" : step === "tags" ? "What shaped it?" : "A little reflection";
}

async function loadUsers() {
  const response = await fetch("/api/users");
  const users = await response.json();
  users.forEach((user) => select.add(new Option(`${user.pseudonym} · ${user.story}`, user.id)));
  select.addEventListener("change", loadDashboard);
  document.querySelector("#try-week").addEventListener("click", () => { select.value = "maya"; loadDashboard(); });
  await loadDashboard();
}

async function loadDashboard() {
  const response = await fetch(`/api/dashboard?userId=${encodeURIComponent(select.value)}`);
  dashboard = await response.json();
  renderChart(dashboard.checkIns);
  renderHistory(dashboard.checkIns);
  renderInsights(dashboard.insights);
  document.querySelector("#resources").innerHTML = dashboard.resources.map((item) => `<div class="resource"><h3>${item.title}</h3><p>${item.description}</p></div>`).join("");
  message.textContent = "";
  note.value = "";
  selectedMood = null;
  selectedTags = [];
  document.querySelectorAll(".mood,.tag").forEach((item) => item.classList.remove("selected"));
  showStep("mood");
}

function renderInsights(insights) {
  document.querySelector("#reflection").textContent = insights.reflection;
  document.querySelector("#average").textContent = insights.average || "—";
  document.querySelector("#count").textContent = insights.checkInCount;
  document.querySelector("#top-tag").textContent = insights.topTag ? insights.topTag.name : "—";
}

function renderChart(entries) {
  const chart = document.querySelector("#chart");
  const recent = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  chart.innerHTML = recent.length ? recent.map((entry) => `<button class="bar-wrap" type="button" data-entry="${entry.id}" title="View ${entry.date}"><span class="score">${entry.moodScore}</span><span class="bar" style="height:${entry.moodScore * 18 + 14}px"></span><span>${new Date(`${entry.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" })}</span></button>`).join("") : "<p>No check-ins yet.</p>";
  chart.querySelectorAll(".bar-wrap").forEach((button) => button.addEventListener("click", () => showEntry(button.dataset.entry)));
}

function showEntry(id) {
  const entry = dashboard.checkIns.find((item) => item.id === id);
  const selected = document.querySelector("#selected-entry");
  selected.classList.remove("hidden");
  selected.innerHTML = `<strong>${moodIcons[entry.moodScore - 1]} ${moodLabels[entry.moodScore - 1]}</strong><span>${entry.note || "No note added."}</span><small>${entry.tags.length ? entry.tags.join(" · ") : "No themes added"} · ${entry.date}</small>`;
}

function renderHistory(entries) {
  document.querySelector("#history").innerHTML = entries.slice(0, 5).map((entry) => `<button class="history-row" type="button" data-entry="${entry.id}"><span class="history-mood">${moodIcons[entry.moodScore - 1]}</span><span><strong>${new Date(`${entry.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</strong><small>${entry.note || "A quiet check-in"} · ${entry.tags.join(", ") || "no themes"}</small></span><b>${entry.moodScore}/5</b></button>`).join("");
  document.querySelectorAll(".history-row").forEach((button) => button.addEventListener("click", () => showEntry(button.dataset.entry)));
}

document.querySelector("#to-tags").addEventListener("click", () => {
  if (!selectedMood) { message.textContent = "Choose a mood before continuing."; return; }
  showStep("tags");
});
document.querySelector("#to-note").addEventListener("click", () => showStep("note"));
document.querySelector("#back-mood").addEventListener("click", () => showStep("mood"));
document.querySelector("#back-tags").addEventListener("click", () => showStep("tags"));
document.querySelector("#submit").addEventListener("click", async () => {
  const response = await fetch("/api/check-ins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: select.value, moodScore: selectedMood, note: note.value, tags: selectedTags }) });
  const data = await response.json();
  if (!response.ok) { message.textContent = data.error; return; }
  message.textContent = "Saved. Thanks for checking in.";
  await loadDashboard();
});

loadUsers().catch(() => { message.textContent = "The demo could not load. Please refresh."; });
