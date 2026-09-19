const chips = document.querySelector("#profile-chips");
const story = document.querySelector("#profile-story");
const moods = document.querySelector("#moods");
const tags = document.querySelector("#tags");
const note = document.querySelector("#note");
const noteCount = document.querySelector("#note-count");
const message = document.querySelector("#message");
document.querySelector("#today").textContent = new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" });

let selectedMood = null;
let selectedTags = [];
let selectedUserId = null;
let dashboard = null;

const moodLabels = ["Very low", "Low", "Okay", "Good", "Great"];
const tagOptions = ["sleep", "work", "stress", "relationships", "movement", "rest", "creativity", "connection"];

const moodSvg = [
  '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M8 15c.8-1.2 2-1.8 4-1.8s3.2.6 4 1.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/></svg>',
  '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M8.5 15.5h7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M8 9.5l1.5 1M16 9.5l-1.5 1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/></svg>',
  '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M8.5 15h7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/></svg>',
  '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M8 14.5c.8 1.2 2 1.8 4 1.8s3.2-.6 4-1.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/></svg>',
  '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M8 14c1 2 2.4 3 4 3s3-1 4-3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/></svg>'
];

function formatDate(date, options) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, options);
}

function showStep(step) {
  document.querySelectorAll(".step").forEach((item) => item.classList.add("hidden"));
  document.querySelector(`#step-${step}`).classList.remove("hidden");
  const n = step === "mood" ? 1 : step === "tags" ? 2 : 3;
  document.querySelector("#step-label").textContent = `${n} of 3`;
  document.querySelector("#step-title").textContent = step === "mood" ? "How are you feeling?" : step === "tags" ? "What shaped it?" : "A little reflection";
  [1, 2, 3].forEach((i) => {
    document.querySelector(`#progress-${i}`).classList.toggle("is-on", i <= n);
  });
}

moodLabels.forEach((label, index) => {
  const button = document.createElement("button");
  button.className = "mood";
  button.type = "button";
  button.setAttribute("role", "radio");
  button.setAttribute("aria-checked", "false");
  button.innerHTML = `${moodSvg[index]}<small>${label}</small>`;
  button.addEventListener("click", () => {
    selectedMood = index + 1;
    document.querySelectorAll(".mood").forEach((item) => {
      item.classList.remove("selected");
      item.setAttribute("aria-checked", "false");
    });
    button.classList.add("selected");
    button.setAttribute("aria-checked", "true");
    message.textContent = "";
  });
  moods.append(button);
});

tagOptions.forEach((tag) => {
  const button = document.createElement("button");
  button.className = "tag";
  button.type = "button";
  button.setAttribute("aria-pressed", "false");
  button.textContent = tag;
  button.addEventListener("click", () => {
    if (selectedTags.includes(tag)) selectedTags = selectedTags.filter((item) => item !== tag);
    else if (selectedTags.length < 3) selectedTags.push(tag);
    button.classList.toggle("selected", selectedTags.includes(tag));
    button.setAttribute("aria-pressed", String(selectedTags.includes(tag)));
  });
  tags.append(button);
});

note.addEventListener("input", () => {
  noteCount.textContent = `${note.value.length}/500`;
});

async function loadUsers() {
  const response = await fetch("/api/users");
  const users = await response.json();
  users.forEach((user, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip" + (index === 0 ? " selected" : "");
    button.dataset.userId = user.id;
    button.innerHTML = `<span class="avatar">${user.initials}</span>${user.pseudonym}`;
    button.addEventListener("click", () => {
      selectedUserId = user.id;
      document.querySelectorAll(".chip").forEach((chip) => chip.classList.toggle("selected", chip.dataset.userId === user.id));
      loadDashboard();
    });
    chips.append(button);
  });
  selectedUserId = users[0].id;
  document.querySelector("#try-week").addEventListener("click", () => {
    selectedUserId = "maya";
    document.querySelectorAll(".chip").forEach((chip) => chip.classList.toggle("selected", chip.dataset.userId === "maya"));
    loadDashboard();
  });
  await loadDashboard();
}

async function loadDashboard() {
  const response = await fetch(`/api/dashboard?userId=${encodeURIComponent(selectedUserId)}`);
  dashboard = await response.json();
  story.textContent = dashboard.user.story;
  renderChart(dashboard.checkIns);
  renderHistory(dashboard.checkIns);
  renderInsights(dashboard.insights);
  document.querySelector("#resources").innerHTML = dashboard.resources.map((item) => `<div class="resource"><h3>${item.title}</h3><p>${item.description}</p></div>`).join("");
  message.textContent = "";
  note.value = "";
  noteCount.textContent = "0/500";
  selectedMood = null;
  selectedTags = [];
  document.querySelectorAll(".mood,.tag").forEach((item) => {
    item.classList.remove("selected");
    if (item.getAttribute("role") === "radio") item.setAttribute("aria-checked", "false");
    if (item.hasAttribute("aria-pressed")) item.setAttribute("aria-pressed", "false");
  });
  showStep("mood");
  document.querySelector("#selected-entry").classList.add("hidden");
}

function renderInsights(insights) {
  document.querySelector("#reflection").textContent = insights.reflection;
  document.querySelector("#average").textContent = insights.average || "—";
  document.querySelector("#count").textContent = insights.checkInCount;
  document.querySelector("#top-tag").textContent = insights.topTag ? insights.topTag.name : "—";
}

function renderChart(entries) {
  const chart = document.querySelector("#chart");
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 6);
  const cutoffIso = cutoff.toISOString().slice(0, 10);
  const recent = [...entries].filter((entry) => entry.date >= cutoffIso).sort((a, b) => a.date.localeCompare(b.date));
  chart.innerHTML = recent.length
    ? recent.map((entry) => `<button class="bar-wrap" type="button" data-entry="${entry.id}" title="View ${entry.date}"><span class="score">${entry.moodScore}</span><span class="bar" style="height:${entry.moodScore * 18 + 14}px"></span><span>${formatDate(entry.date, { weekday: "short" })}</span></button>`).join("")
    : "<p>No check-ins yet. Save one to see a pattern.</p>";
  chart.querySelectorAll(".bar-wrap").forEach((button) => button.addEventListener("click", () => showEntry(button.dataset.entry)));
}

function showEntry(id) {
  const entry = dashboard.checkIns.find((item) => item.id === id);
  if (!entry) return;
  const selected = document.querySelector("#selected-entry");
  selected.classList.remove("hidden");
  selected.innerHTML = `<strong>${moodSvg[entry.moodScore - 1]} ${moodLabels[entry.moodScore - 1]}</strong><span>${entry.note || "No note added."}</span><small>${entry.tags.length ? entry.tags.join(" · ") : "No themes added"} · ${formatDate(entry.date, { month: "short", day: "numeric" })}</small>`;
  document.querySelectorAll(".bar-wrap").forEach((button) => button.classList.toggle("is-dim", button.dataset.entry !== id));
}

function renderHistory(entries) {
  const recent = entries.slice(0, 5);
  document.querySelector("#history").innerHTML = recent.length
    ? recent.map((entry) => `<button class="history-row" type="button" data-entry="${entry.id}"><span class="history-mood">${moodSvg[entry.moodScore - 1]}</span><span><strong>${formatDate(entry.date, { weekday: "long", month: "short", day: "numeric" })}</strong><small>${entry.note || "A quiet check-in"} · ${entry.tags.join(", ") || "no themes"}</small></span><b>${entry.moodScore}/5</b></button>`).join("")
    : "<p>No check-ins yet.</p>";
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
  const response = await fetch("/api/check-ins", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: selectedUserId, moodScore: selectedMood, note: note.value, tags: selectedTags })
  });
  const data = await response.json();
  if (!response.ok) { message.textContent = data.error; return; }
  message.textContent = "Saved. Thanks for checking in.";
  await loadDashboard();
  showEntry(data.id);
});

loadUsers().catch(() => { message.textContent = "The demo could not load. Please refresh."; });
