/**
 * Baho Counselling: One-Command Start Script
 * Usage: npm start  (from project root)
 * Uses Node.js built-ins only. No root-level dependencies required.
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync, spawnSync, spawn } from "child_process";
import { createConnection } from "net";
import { platform } from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const PINE   = "\x1b[32m";
const CYAN   = "\x1b[36m";
const YELLOW = "\x1b[33m";
const RED    = "\x1b[31m";
const BOLD   = "\x1b[1m";
const RESET  = "\x1b[0m";

function log(prefix, msg, color = CYAN) {
  console.log(`${color}${BOLD}[${prefix}]${RESET} ${msg}`);
}
function step(msg) {
  console.log(`\n${PINE}${BOLD} ${msg}${RESET}`);
}

// ---- 1. Create server/.env ----
step("1/6  Checking environment config ...");
const envPath    = join(root, "server", ".env");
const envExample = join(root, ".env.example");
if (!existsSync(envPath)) {
  const template = existsSync(envExample)
    ? readFileSync(envExample, "utf8")
    : "MONGODB_URI=mongodb://127.0.0.1:27017\nDB_NAME=baho_counselling\nJWT_SECRET=change_this_secret\nPORT=5000\nCLIENT_PORT=5173\nHOSPITAL_PHONE=+250 000 000 000\nEMERGENCY_PHONE=112\n";
  writeFileSync(envPath, template);
  log("ENV", "Created server/.env from .env.example");
} else {
  log("ENV", "server/.env already exists");
}

// Parse env values from server/.env
const envContents = readFileSync(envPath, "utf8");
function getEnvVal(key, fallback) {
  const m = envContents.match(new RegExp(`^${key}=(.+)$`, "m"));
  return m ? m[1].trim() : fallback;
}
const MONGO_URI   = getEnvVal("MONGODB_URI", "mongodb://127.0.0.1:27017");
const PORT        = parseInt(getEnvVal("PORT", "5000"), 10);
const CLIENT_PORT = parseInt(getEnvVal("CLIENT_PORT", "5173"), 10);
const DB_NAME     = getEnvVal("DB_NAME", "baho_counselling");

// ---- 2. Install dependencies ----
step("2/6  Checking dependencies ...");

if (!existsSync(join(root, "server", "node_modules"))) {
  log("NPM", "Installing server dependencies ...", YELLOW);
  execSync("npm install", { cwd: join(root, "server"), stdio: "inherit" });
  log("NPM", "Server dependencies installed", PINE);
} else {
  log("NPM", "Server node_modules found");
}

if (!existsSync(join(root, "client", "node_modules"))) {
  log("NPM", "Installing client dependencies ...", YELLOW);
  execSync("npm install", { cwd: join(root, "client"), stdio: "inherit" });
  log("NPM", "Client dependencies installed", PINE);
} else {
  log("NPM", "Client node_modules found");
}

// ---- 3. Check MongoDB (TCP ping) ----
step("3/6  Checking MongoDB ...");

function checkMongoTCP(uri) {
  return new Promise((resolve) => {
    let host = "127.0.0.1", port = 27017;
    const m = uri.match(/mongodb:\/\/([^:/]+):?(\d+)?/);
    if (m) { host = m[1]; if (m[2]) port = parseInt(m[2], 10); }
    const conn = createConnection({ host, port });
    const t = setTimeout(() => { conn.destroy(); resolve(false); }, 3000);
    conn.on("connect", () => { clearTimeout(t); conn.destroy(); resolve(true); });
    conn.on("error",   () => { clearTimeout(t); resolve(false); });
  });
}

const mongoOk = await checkMongoTCP(MONGO_URI);
if (!mongoOk) {
  console.log(`\n${RED}${BOLD}[ERROR] Cannot reach MongoDB at ${MONGO_URI}${RESET}`);
  console.log(`\n  Start MongoDB first, then run npm start again.\n`);
  console.log(`  ${CYAN}Windows:${RESET}  Open Services and start "MongoDB Server", or run: mongod`);
  console.log(`  ${CYAN}macOS:${RESET}    brew services start mongodb/brew/mongodb-community`);
  console.log(`  ${CYAN}Linux:${RESET}    sudo systemctl start mongod\n`);
  process.exit(1);
}
log("MONGO", `MongoDB is reachable at ${MONGO_URI}`, PINE);

// ---- 4. Seed if the users collection is empty ----
step("4/6  Checking seed data ...");

// We must run the check inside server/ so that the mongodb package resolves
// from server/node_modules, not from the root (which has no node_modules).
const checkScript = `
import { MongoClient } from 'mongodb';
const c = new MongoClient(${JSON.stringify(MONGO_URI)});
try {
  await c.connect();
  const n = await c.db(${JSON.stringify(DB_NAME)}).collection('users').countDocuments();
  await c.close();
  // Write result to stdout so the parent can read it without relying on exit code
  process.stdout.write(String(n));
} catch (e) {
  process.stderr.write(e.message);
  process.exit(2);
}
`;

const checkResult = spawnSync(
  process.execPath,                          // same node binary that is running us
  ["--input-type=module"],
  { cwd: join(root, "server"), input: checkScript, encoding: "utf8" }
);

if (checkResult.status === 2) {
  log("WARN", "Could not query user count: " + checkResult.stderr.trim(), YELLOW);
}

const userCount = parseInt(checkResult.stdout.trim(), 10) || 0;
if (userCount === 0) {
  log("SEED", "Database is empty. Running seed script ...", YELLOW);
  execSync("node scripts/seed.js", { cwd: join(root, "server"), stdio: "inherit" });
  log("SEED", "Database seeded successfully", PINE);
} else {
  log("SEED", `Data present (${userCount} users), skipping seed`);
}

// ---- 5. Start API + Vite ----
step("5/6  Starting servers ...");
const processes = [];
const isWin = platform() === "win32";

function startProcess(name, cmdLine, cwd, color) {
  // Pass the full command as a single string with shell:true.
  // We do NOT pass an args array, which avoids the Node 22 deprecation warning
  // about arrays being joined without escaping when shell:true.
  const proc = spawn(cmdLine, { cwd, shell: true, stdio: "pipe" });
  proc.stdout.on("data", (d) =>
    d.toString().split("\n").filter(Boolean)
      .forEach((l) => console.log(`${color}[${name}]${RESET} ${l}`))
  );
  proc.stderr.on("data", (d) =>
    d.toString().split("\n").filter(Boolean)
      .forEach((l) => console.log(`${YELLOW}[${name}]${RESET} ${l}`))
  );
  proc.on("exit", (code) => {
    if (code !== 0 && code !== null)
      console.log(`${RED}[${name}] Exited with code ${code}${RESET}`);
  });
  processes.push(proc);
  return proc;
}

// Build command strings - no array args, so no deprecation warning
const nodeExe  = JSON.stringify(process.execPath);   // quoted path to this node binary
const viteBin  = isWin
  ? JSON.stringify(join(root, "client", "node_modules", ".bin", "vite.cmd"))
  : JSON.stringify(join(root, "client", "node_modules", ".bin", "vite"));

startProcess("API",  `${nodeExe} index.js`, join(root, "server"), PINE);
startProcess("VITE", `${viteBin} --host`,  join(root, "client"), CYAN);

// ---- 6. Wait for both ports, then open browser ----
step("6/6  Waiting for servers to be ready ...");

function waitForPort(port, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    (function attempt() {
      const conn = createConnection({ host: "127.0.0.1", port });
      conn.on("connect", () => { conn.destroy(); resolve(); });
      conn.on("error",   () => {
        if (Date.now() > deadline) { reject(new Error(`Port ${port} not ready after ${timeoutMs}ms`)); return; }
        setTimeout(attempt, 800);
      });
    })();
  });
}

try {
  await Promise.all([waitForPort(PORT), waitForPort(CLIENT_PORT)]);
  log("READY", `API   http://localhost:${PORT}`,        PINE);
  log("READY", `App   http://localhost:${CLIENT_PORT}`, PINE);

  const appUrl = `http://localhost:${CLIENT_PORT}`;
  const openCmd =
    isWin                 ? `start "" "${appUrl}"` :
    platform() === "darwin" ? `open "${appUrl}"`     :
                              `xdg-open "${appUrl}"`;
  try { execSync(openCmd, { stdio: "ignore" }); } catch {}
} catch (err) {
  log("WARN", err.message + " -- servers may still be starting", YELLOW);
}

// ---- Summary ----
console.log(`
${PINE}${BOLD}+--------------------------------------------------+${RESET}
${PINE}${BOLD}|          Baho Counselling is running             |${RESET}
${PINE}${BOLD}+--------------------------------------------------+${RESET}
${BOLD}  App URL :${RESET}  http://localhost:${CLIENT_PORT}
${BOLD}  API URL :${RESET}  http://localhost:${PORT}

${BOLD}  Demo logins:${RESET}
    Admin      : admin@baho.rw        / Admin@1234
    Counsellor : counsellor@baho.rw   / Counsellor@1234
    Client     : client@baho.rw       / Client@1234

  Press ${BOLD}Ctrl+C${RESET} to stop both servers.
${PINE}${BOLD}+--------------------------------------------------+${RESET}
`);

function shutdown() {
  console.log(`\n${YELLOW}[STOP] Shutting down ...${RESET}`);
  processes.forEach((p) => { try { p.kill("SIGTERM"); } catch {} });
  setTimeout(() => process.exit(0), 500);
}
process.on("SIGINT",  shutdown);
process.on("SIGTERM", shutdown);

// Keep the process alive while children run
setInterval(() => {}, 60_000);
