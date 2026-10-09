/* Editing Ledger — rates: Reel $10 flat · YouTube $12/min prorated to ms · earned only when Completed */
"use strict";

const LS_KEY = "editing-ledger-v1";
const STATUSES = ["Todo", "In Progress", "Review", "Completed"];
const statusClass = s => ({ "Todo": "todo", "In Progress": "inprogress", "Review": "review", "Completed": "completed" }[s] || "todo");

let videos = [];
let editingId = null;
let activeTab = "table";

const $ = id => document.getElementById(id);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const money = n => "$" + Number(n || 0).toFixed(2);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------- data ---------- */
function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) videos = JSON.parse(raw);
  } catch { videos = []; }
}
function save() { localStorage.setItem(LS_KEY, JSON.stringify(videos)); }

function totalMs(v) { return (v.min | 0) * 60000 + (v.sec | 0) * 1000 + (v.ms | 0); }
function incomeOf(v) {
  if (v.type === "Reel") return 10;
  return Math.round((totalMs(v) / 60000) * 12 * 100) / 100; // $12/min prorated to ms, rounded to cents
}
function earnedOf(v) { return v.status === "Completed" ? incomeOf(v) : 0; }
function monthKey(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return isNaN(d) ? "" : d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}
function monthLabel(key) {
  if (!key) return "—";
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
function currentMonthKey() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}
function durLabel(v) {
  return `${v.min | 0}:${String(v.sec | 0).padStart(2, "0")}.${String(v.ms | 0).padStart(3, "0")}`;
}

/* ---------- filters ---------- */
function filtered() {
  const q = $("search").value.trim().toLowerCase();
  const fm = $("filter-month").value;
  const ft = $("filter-type").value;
  return videos
    .filter(v =>
      (!q || v.name.toLowerCase().includes(q)) &&
      (!fm || monthKey(v.dateFinished) === fm) &&
      (!ft || v.type === ft))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

function refreshMonthOptions() {
  const sel = $("filter-month");
  const cur = sel.value;
  const months = [...new Set(videos.map(v => monthKey(v.dateFinished)).filter(Boolean))].sort().reverse();
  sel.innerHTML = `<option value="">All months</option>` +
    months.map(m => `<option value="${m}">${monthLabel(m)}</option>`).join("");
  if (months.includes(cur)) sel.value = cur;
}

/* ---------- stats ---------- */
function renderStats() {
  const cm = currentMonthKey();
  const earned = videos.reduce((s, v) => s + earnedOf(v), 0);
  const earnedMonth = videos.reduce((s, v) => s + (monthKey(v.dateFinished) === cm ? earnedOf(v) : 0), 0);
  const pipeline = videos.filter(v => v.status !== "Completed");
  const pipelineValue = pipeline.reduce((s, v) => s + incomeOf(v), 0);
  const done = videos.filter(v => v.status === "Completed").length;
  $("stats").innerHTML = `
    <div class="stat"><div class="label">Total earned</div><div class="value accent">${money(earned)}</div><div class="sub">${done} video${done === 1 ? "" : "s"} completed</div></div>
    <div class="stat"><div class="label">Earned · ${monthLabel(cm)}</div><div class="value">${money(earnedMonth)}</div><div class="sub">this month so far</div></div>
    <div class="stat"><div class="label">In pipeline</div><div class="value">${pipeline.length}</div><div class="sub">${money(pipelineValue)} potential</div></div>
    <div class="stat"><div class="label">All videos</div><div class="value">${videos.length}</div><div class="sub">${videos.filter(v => v.type === "Reel").length} reels · ${videos.filter(v => v.type === "YouTube").length} youtube</div></div>`;
}

/* ---------- table ---------- */
function renderTable() {
  const rows = filtered();
  const cm = currentMonthKey();
  $("table-empty").hidden = rows.length > 0;
  $("ledger-body").innerHTML = rows.map(v => {
    const mk = monthKey(v.dateFinished);
    return `<tr>
      <td class="vname">${esc(v.name)}</td>
      <td><span class="pill ${v.type === "Reel" ? "reel" : "youtube"}">${v.type}</span></td>
      <td><span class="pill ${statusClass(v.status)}">${v.status}</span></td>
      <td class="num mono">${v.min | 0}</td>
      <td class="num mono">${v.sec | 0}</td>
      <td class="num mono">${v.ms | 0}</td>
      <td class="mono">${v.dateFinished || "—"}</td>
      <td class="num mono">${money(incomeOf(v))}</td>
      <td class="num mono">${v.status === "Completed" ? money(earnedOf(v)) : "—"}</td>
      <td>${monthLabel(mk)}</td>
      <td>${mk && mk === cm ? "Yes" : "—"}</td>
      <td class="row-actions">
        <button data-act="edit" data-id="${v.id}" title="Edit">Edit</button>
        <button class="del" data-act="del" data-id="${v.id}" title="Delete">Delete</button>
      </td>
    </tr>`;
  }).join("");
}

/* ---------- kanban ---------- */
function renderKanban() {
  const rows = filtered();
  $("kanban").innerHTML = STATUSES.map(s => {
    const items = rows.filter(v => v.status === s);
    return `<div class="kcol">
      <h3>${s}<span class="count">${items.length}</span></h3>
      ${items.map(v => `<div class="kcard" data-act="edit" data-id="${v.id}">
        <div class="t">${esc(v.name)}</div>
        <div class="meta"><span class="dur">${v.type} · ${durLabel(v)}</span><span class="inc">${money(incomeOf(v))}</span></div>
      </div>`).join("") || `<div style="color:var(--muted);font-size:12px;padding:8px 0;">Empty</div>`}
    </div>`;
  }).join("");
}

/* ---------- analytics ---------- */
function renderAnalytics() {
  // monthly earned
  const byMonth = {};
  videos.forEach(v => {
    const mk = monthKey(v.dateFinished);
    if (!mk || v.status !== "Completed") return;
    byMonth[mk] = (byMonth[mk] || 0) + earnedOf(v);
  });
  const months = Object.keys(byMonth).sort().slice(-12);
  drawBars($("month-chart"), months.map(m => ({ label: monthLabel(m).replace(" ", "\n"), value: byMonth[m] })));

  const reels = videos.filter(v => v.type === "Reel");
  const yt = videos.filter(v => v.type === "YouTube");
  const rEarn = reels.reduce((s, v) => s + earnedOf(v), 0);
  const yEarn = yt.reduce((s, v) => s + earnedOf(v), 0);
  const avgYt = yt.length ? (yt.reduce((s, v) => s + incomeOf(v), 0) / yt.length) : 0;
  $("breakdown").innerHTML = `
    <div class="bk-row"><span class="k">Reels completed</span><span class="v">${reels.filter(v => v.status === "Completed").length} / ${reels.length}</span></div>
    <div class="bk-row"><span class="k">Earned from reels</span><span class="v accent">${money(rEarn)}</span></div>
    <div class="bk-row"><span class="k">YouTube completed</span><span class="v">${yt.filter(v => v.status === "Completed").length} / ${yt.length}</span></div>
    <div class="bk-row"><span class="k">Earned from YouTube</span><span class="v accent">${money(yEarn)}</span></div>
    <div class="bk-row"><span class="k">Avg YouTube video value</span><span class="v">${money(avgYt)}</span></div>`;
}

function drawBars(canvas, data) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = 240;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);
  const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#b6f34a";
  const muted = "#8e8e93";
  if (!data.length) {
    ctx.fillStyle = muted; ctx.font = "13px Inter, sans-serif"; ctx.textAlign = "center";
    ctx.fillText("No completed videos yet", w / 2, h / 2);
    return;
  }
  const max = Math.max(...data.map(d => d.value), 1);
  const padL = 46, padB = 34, padT = 26;
  const cw = (w - padL - 12) / data.length;
  const bw = Math.min(cw * 0.55, 64);
  ctx.font = "11px Inter, sans-serif";
  data.forEach((d, i) => {
    const bh = Math.max(3, ((h - padB - padT) * d.value) / max);
    const x = padL + i * cw + (cw - bw) / 2;
    const y = h - padB - bh;
    const g = ctx.createLinearGradient(0, y, 0, y + bh);
    g.addColorStop(0, accent); g.addColorStop(1, "rgba(182,243,74,0.35)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.roundRect(x, y, bw, bh, 5); ctx.fill();
    ctx.fillStyle = "#f4f4f5"; ctx.textAlign = "center";
    ctx.fillText("$" + d.value.toFixed(0), x + bw / 2, y - 8);
    ctx.fillStyle = muted;
    const parts = d.label.split("\n");
    parts.forEach((p, j) => ctx.fillText(p, x + bw / 2, h - padB + 14 + j * 12));
  });
}

/* ---------- render all ---------- */
function render() {
  refreshMonthOptions();
  renderStats();
  renderTable();
  renderKanban();
  renderAnalytics();
}

/* ---------- modal ---------- */
function openModal(video) {
  editingId = video ? video.id : null;
  $("modal-title").textContent = video ? "Edit video" : "New video";
  $("f-name").value = video ? video.name : "";
  $("f-type").value = video ? video.type : "Reel";
  $("f-status").value = video ? video.status : "Todo";
  $("f-min").value = video ? video.min : 0;
  $("f-sec").value = video ? video.sec : 0;
  $("f-ms").value = video ? video.ms : 0;
  $("f-date").value = video ? (video.dateFinished || "") : "";
  updatePreview();
  $("modal").hidden = false;
  $("f-name").focus();
}
function closeModal() { $("modal").hidden = true; editingId = null; }
function updatePreview() {
  const v = {
    type: $("f-type").value,
    min: +$("f-min").value || 0, sec: +$("f-sec").value || 0, ms: +$("f-ms").value || 0
  };
  $("f-income").textContent = money(incomeOf(v));
}

$("video-form").addEventListener("submit", e => {
  e.preventDefault();
  const data = {
    name: $("f-name").value.trim(),
    type: $("f-type").value,
    status: $("f-status").value,
    min: Math.max(0, +$("f-min").value || 0),
    sec: Math.min(59, Math.max(0, +$("f-sec").value || 0)),
    ms: Math.min(999, Math.max(0, +$("f-ms").value || 0)),
    dateFinished: $("f-date").value || ""
  };
  if (!data.name) return;
  if (editingId) {
    const v = videos.find(x => x.id === editingId);
    if (v) Object.assign(v, data);
  } else {
    videos.push({ id: uid(), createdAt: Date.now(), ...data });
  }
  save(); render(); closeModal();
});

/* ---------- actions ---------- */
document.addEventListener("click", e => {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const v = videos.find(x => x.id === btn.dataset.id);
  if (!v) return;
  if (btn.dataset.act === "edit") openModal(v);
  if (btn.dataset.act === "del" && confirm(`Delete "${v.name}"?`)) {
    videos = videos.filter(x => x.id !== v.id);
    save(); render();
  }
});

$("btn-add").addEventListener("click", () => openModal(null));
$("btn-cancel").addEventListener("click", closeModal);
$("modal").addEventListener("click", e => { if (e.target === $("modal")) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
["f-type", "f-min", "f-sec", "f-ms"].forEach(id => $(id).addEventListener("input", updatePreview));

/* ---------- tabs / filters ---------- */
document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
  t.classList.add("active");
  activeTab = t.dataset.tab;
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  $("view-" + activeTab).classList.add("active");
  if (activeTab === "analytics") renderAnalytics();
}));
["search", "filter-month", "filter-type"].forEach(id =>
  $(id).addEventListener("input", () => { renderTable(); renderKanban(); }));
window.addEventListener("resize", () => { if (activeTab === "analytics") renderAnalytics(); });

/* ---------- export / import ---------- */
$("btn-export").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(videos, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "editing-ledger-backup.json";
  a.click();
  URL.revokeObjectURL(a.href);
});
$("btn-import").addEventListener("click", () => $("import-file").click());
$("import-file").addEventListener("change", e => {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const arr = JSON.parse(r.result);
      if (!Array.isArray(arr)) throw 0;
      videos = arr.filter(v => v && v.name).map(v => ({
        id: v.id || uid(), createdAt: v.createdAt || Date.now(),
        name: String(v.name), type: v.type === "YouTube" ? "YouTube" : "Reel",
        status: STATUSES.includes(v.status) ? v.status : "Todo",
        min: +v.min || 0, sec: +v.sec || 0, ms: +v.ms || 0,
        dateFinished: v.dateFinished || ""
      }));
      save(); render();
    } catch { alert("That file doesn't look like a ledger backup."); }
  };
  r.readAsText(f);
  e.target.value = "";
});

/* ---------- init ---------- */
async function init() {
  load();
  if (!localStorage.getItem("editing-ledger-seeded-v2")) {
    try {
      const r = await fetch("seed.json");
      if (r.ok) {
        const data = await r.json();
        videos = Array.isArray(data) ? data : (data.videos || []);
        save();
      }
    } catch (e) { /* offline or no seed — start empty */ }
    try { localStorage.setItem("editing-ledger-seeded-v2", "1"); } catch (e) {}
  }
  render();
}
init();
