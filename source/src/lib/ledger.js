// Ledger domain logic: rates, income calc, formatting, storage.

export const REEL_RATE = 10; // $ flat
export const YT_RATE_PER_MIN = 12; // $ per minute, prorated to ms

export const STATUSES = ["Todo", "In Progress", "Review", "Completed"];
export const FORMATS = ["Reel", "YouTube"];

export function incomeFor(v) {
  if (v.format === "Reel") return REEL_RATE;
  const ms =
    (Number(v.lengthMin) || 0) * 60000 +
    (Number(v.lengthSec) || 0) * 1000 +
    (Number(v.lengthMs) || 0);
  return Math.round((ms / 60000) * YT_RATE_PER_MIN * 100) / 100;
}

export function earnedFor(v) {
  return v.status === "Completed" ? incomeFor(v) : 0;
}

export function fmtMoney(n) {
  return "$" + (Number(n) || 0).toFixed(2);
}

export function fmtDuration(v) {
  if (v.format === "Reel") return "—";
  const m = Number(v.lengthMin) || 0;
  const s = Number(v.lengthSec) || 0;
  const ms = Number(v.lengthMs) || 0;
  return `${m}:${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}

export function fmtDate(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function monthKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function hourlyRoi(v) {
  const hrs = Number(v.editHours) || 0;
  if (!hrs) return "—";
  return fmtMoney(incomeFor(v) / hrs) + "/h";
}

export function uid() {
  return "v" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

const LS_KEY = "editing-ledger-react-v1";
const SEED_KEY = "editing-ledger-react-seeded-v1";

export function loadVideos() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

export function saveVideos(videos) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(videos));
  } catch (e) {}
}

export async function loadSeed() {
  if (localStorage.getItem(SEED_KEY)) return null;
  try {
    const r = await fetch("./seed.json", { cache: "no-store" });
    if (!r.ok) return [];
    const data = await r.json();
    const arr = Array.isArray(data) ? data : data.videos || [];
    localStorage.setItem(SEED_KEY, "1");
    return arr;
  } catch (e) {
    return [];
  }
}

export function stats(videos) {
  const completed = videos.filter((v) => v.status === "Completed");
  const earned = completed.reduce((s, v) => s + earnedFor(v), 0);
  const pending = videos
    .filter((v) => v.status !== "Completed")
    .reduce((s, v) => s + incomeFor(v), 0);
  const hours = videos.reduce((s, v) => s + (Number(v.editHours) || 0), 0);
  const roi = hours > 0 ? earned / hours : 0;
  return { total: videos.length, completed: completed.length, earned, pending, hours, roi };
}
