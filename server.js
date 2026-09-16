const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs");
const { randomUUID } = require("node:crypto");

const port = Number(process.env.PORT || 10000);
const publicDir = path.join(__dirname, "public");

const users = [
  { id: "maya", pseudonym: "Maya R.", initials: "MR" },
  { id: "jordan", pseudonym: "Jordan K.", initials: "JK" },
  { id: "sam", pseudonym: "Sam T.", initials: "ST" }
];

const checkIns = [
  { id: randomUUID(), userId: "maya", moodScore: 3, note: "A little tired, but I took a walk.", tags: ["movement"], date: "2026-09-16" },
  { id: randomUUID(), userId: "maya", moodScore: 4, note: "Work felt manageable today.", tags: ["work"], date: "2026-09-15" },
  { id: randomUUID(), userId: "maya", moodScore: 2, note: "A difficult day. Reached out to a friend.", tags: ["connection"], date: "2026-09-14" },
  { id: randomUUID(), userId: "maya", moodScore: 3, note: "Quiet evening and an early night.", tags: ["rest"], date: "2026-09-13" },
  { id: randomUUID(), userId: "maya", moodScore: 4, note: "Made time for something creative.", tags: ["creativity"], date: "2026-09-12" },
  { id: randomUUID(), userId: "jordan", moodScore: 2, note: "Lots on my mind, taking it one task at a time.", tags: ["stress"], date: "2026-09-16" },
  { id: randomUUID(), userId: "jordan", moodScore: 3, note: "A steady day with a good lunch break.", tags: ["rest"], date: "2026-09-15" },
  { id: randomUUID(), userId: "sam", moodScore: 5, note: "Feeling connected and grateful.", tags: ["connection"], date: "2026-09-16" }
];

const resources = [
  { title: "A two-minute reset", description: "Put both feet on the floor, relax your shoulders, and take five slow breaths." },
  { title: "Name what you need", description: "Try completing: “Right now, I need a little more ___.” Small needs count." },
  { title: "Reach out", description: "Send a simple message to someone you trust: “I could use a little company today.”" }
];

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
    sendJson(response, 200, { user, checkIns: entries, resources });
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
        const today = new Date().toISOString().slice(0, 10);
        const entry = {
          id: randomUUID(),
          userId,
          moodScore: score,
          note: String(note || "").trim().slice(0, 500),
          tags: Array.isArray(tags) ? tags.slice(0, 3).map(String) : [],
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

server.listen(port, () => console.log(`Demo listening on port ${port}`));
