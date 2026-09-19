const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs");
const { randomUUID } = require("node:crypto");

const port = Number(process.env.PORT || 10000);
const publicDir = path.join(__dirname, "public");

function isoDateDaysAgo(days) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const users = [
  { id: "maya", pseudonym: "Maya R.", initials: "MR", story: "Finding steadiness through small creative rituals." },
  { id: "jordan", pseudonym: "Jordan K.", initials: "JK", story: "Making room to breathe during a busy work season." },
  { id: "sam", pseudonym: "Sam T.", initials: "ST", story: "Noticing how connection changes the shape of a day." },
  { id: "shashank", pseudonym: "Shashank M.", initials: "SM", story: "Learning to create a little more space in a very full schedule." }
];

const checkIns = [
  { id: randomUUID(), userId: "maya", moodScore: 3, note: "A little tired, but I took a walk.", tags: ["movement", "rest"], date: isoDateDaysAgo(1) },
  { id: randomUUID(), userId: "maya", moodScore: 4, note: "Work felt manageable today.", tags: ["work"], date: isoDateDaysAgo(2) },
  { id: randomUUID(), userId: "maya", moodScore: 2, note: "A difficult day. Reached out to a friend.", tags: ["connection"], date: isoDateDaysAgo(3) },
  { id: randomUUID(), userId: "maya", moodScore: 3, note: "Quiet evening and an early night.", tags: ["rest"], date: isoDateDaysAgo(4) },
  { id: randomUUID(), userId: "maya", moodScore: 4, note: "Made time for something creative.", tags: ["creativity"], date: isoDateDaysAgo(5) },
  { id: randomUUID(), userId: "jordan", moodScore: 2, note: "Lots on my mind, taking it one task at a time.", tags: ["stress"], date: isoDateDaysAgo(1) },
  { id: randomUUID(), userId: "jordan", moodScore: 3, note: "A steady day with a good lunch break.", tags: ["rest"], date: isoDateDaysAgo(2) },
  { id: randomUUID(), userId: "sam", moodScore: 5, note: "Feeling connected and grateful.", tags: ["connection", "creativity"], date: isoDateDaysAgo(1) },
  { id: randomUUID(), userId: "sam", moodScore: 4, note: "A slow morning helped me feel present.", tags: ["rest"], date: isoDateDaysAgo(2) },
  { id: randomUUID(), userId: "sam", moodScore: 4, note: "Called my sister on the way home.", tags: ["connection"], date: isoDateDaysAgo(3) },
  { id: randomUUID(), userId: "shashank", moodScore: 2, note: "Back-to-back meetings and too many open tabs.", tags: ["work", "stress"], date: isoDateDaysAgo(1) },
  { id: randomUUID(), userId: "shashank", moodScore: 3, note: "Managed a proper lunch away from my desk.", tags: ["rest", "work"], date: isoDateDaysAgo(2) },
  { id: randomUUID(), userId: "shashank", moodScore: 2, note: "Finished late again. I want a better off-switch.", tags: ["work", "sleep"], date: isoDateDaysAgo(3) },
  { id: randomUUID(), userId: "shashank", moodScore: 3, note: "A short walk between calls helped.", tags: ["movement", "rest"], date: isoDateDaysAgo(4) },
  { id: randomUUID(), userId: "shashank", moodScore: 2, note: "Said yes to too many things today.", tags: ["stress", "work"], date: isoDateDaysAgo(5) }
];

const allResources = [
  { title: "A two-minute reset", description: "Put both feet on the floor, relax your shoulders, and take five slow breaths." },
  { title: "Name what you need", description: "Try completing: “Right now, I need a little more ___.” Small needs count." },
  { title: "Reach out", description: "Send a simple message to someone you trust: “I could use a little company today.”" },
  { title: "What helped?", description: "Notice one thing that made today 1% easier. You can return to it later." },
  { title: "Make it smaller", description: "Choose the next kind, doable step—not the whole staircase." },
  { title: "The three-minute landing", description: "Before switching tasks, close one tab, take three slow breaths, and name what comes next." },
  { title: "Create an off-switch", description: "Pick a repeatable end-of-day cue: write tomorrow's first task, then step away for ten minutes." },
  { title: "A kind no", description: "Try: “I can't take that on this week, but I can revisit it on Monday.” Protecting space is useful work." }
];

const userResources = {
  shashank: [
    allResources[5],
    allResources[6],
    allResources[7]
  ]
};

function getInsights(entries) {
  const average = entries.length ? entries.reduce((sum, item) => sum + item.moodScore, 0) / entries.length : 0;
  const tagCounts = entries.flatMap((item) => item.tags || []).reduce((counts, tag) => {
    counts[tag] = (counts[tag] || 0) + 1;
    return counts;
  }, {});
  const topTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0];
  const reflection = entries.length >= 4
    ? `You checked in ${entries.length} times recently${topTag ? `, and ${topTag[0]} appeared most often` : ""}. Notice what you want to carry into next week.`
    : "A few check-ins can help a pattern emerge. You can start again whenever it feels useful.";
  return {
    average: Number(average.toFixed(1)),
    checkInCount: entries.length,
    topTag: topTag ? { name: topTag[0], count: topTag[1] } : null,
    reflection,
    tagCounts
  };
}

function sendJson(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

function requestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 10_000) reject(new Error("Request body is too large"));
    });
    request.on("end", () => {
      try { resolve(JSON.parse(body || "{}")); } catch { reject(new Error("Invalid JSON")); }
    });
    request.on("error", reject);
  });
}

function apiResponse(request, response, url) {
  if (request.method === "GET" && url.pathname === "/api/users") {
    sendJson(response, 200, users);
    return true;
  }
  if (request.method === "GET" && url.pathname === "/api/dashboard") {
    const userId = url.searchParams.get("userId") || users[0].id;
    const user = users.find((candidate) => candidate.id === userId);
    if (!user) {
      sendJson(response, 404, { error: "Demo user not found" });
      return true;
    }
    const entries = checkIns
      .filter((checkIn) => checkIn.userId === userId)
      .sort((a, b) => b.date.localeCompare(a.date));
    const latestMood = entries[0]?.moodScore || 3;
    const resources = userResources[userId] || (latestMood <= 2 ? allResources.slice(0, 3) : latestMood >= 4 ? [allResources[3], allResources[1], allResources[4]] : [allResources[0], allResources[2], allResources[4]]);
    sendJson(response, 200, { user, checkIns: entries, resources, insights: getInsights(entries) });
    return true;
  }
  if (request.method === "POST" && url.pathname === "/api/check-ins") {
    return requestBody(request)
      .then(({ userId, moodScore, note, tags = [] }) => {
        const user = users.find((candidate) => candidate.id === userId);
        const score = Number(moodScore);
        if (!user || !Number.isInteger(score) || score < 1 || score > 5) {
          sendJson(response, 400, { error: "Choose a demo user and a mood from 1 to 5." });
          return;
        }
        const today = isoDateDaysAgo(0);
        const entry = {
          id: randomUUID(),
          userId,
          moodScore: score,
          note: String(note || "").trim().slice(0, 500),
          tags: Array.isArray(tags) ? tags.slice(0, 3).map(String).filter(Boolean) : [],
          date: today
        };
        checkIns.unshift(entry);
        sendJson(response, 201, entry);
      })
      .catch((error) => sendJson(response, 400, { error: error.message }));
  }
  return false;
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  if (url.pathname.startsWith("/api/")) {
    if (apiResponse(request, response, url)) return;
    return sendJson(response, 404, { error: "Not found" });
  }

  const filePath = url.pathname === "/" ? path.join(publicDir, "index.html") : path.join(publicDir, url.pathname);
  if (!filePath.startsWith(publicDir)) {
    response.writeHead(404);
    return response.end("Not found");
  }
  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404);
      return response.end("Not found");
    }
    const contentType = filePath.endsWith(".css") ? "text/css; charset=utf-8" : filePath.endsWith(".js") ? "text/javascript; charset=utf-8" : "text/html; charset=utf-8";
    response.writeHead(200, { "Content-Type": contentType });
    response.end(content);
  });
});

server.listen(port, "0.0.0.0", () => console.log(`Demo listening on port ${port}`));
