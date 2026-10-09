import { useEffect, useState } from "react";
import { I } from "./icons";
import { fmtMoney, fmtDate, incomeFor, monthKey, monthLabel, stats } from "../lib/ledger";

function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      setVal(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function StatCard({ label, icon, value, prefix = "", suffix = "", accent, sub, delay = 0 }) {
  const v = useCountUp(value);
  const shown = prefix + v.toFixed(suffix === ".2f" ? 2 : suffix === ".1f" ? 1 : 0) + (suffix.startsWith(".") ? "" : suffix);
  return (
    <div className="stat-card reveal" style={{ animationDelay: `${delay}ms` }}>
      <div className="label">{icon}{label}</div>
      <div className={"value" + (accent ? " accent" : "")}>{shown}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

function MonthlyBars({ videos }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = requestAnimationFrame(() => setMounted(true)); return () => cancelAnimationFrame(t); }, []);
  const byMonth = {};
  videos.forEach((v) => {
    if (!v.handoffDate) return;
    const k = monthKey(v.handoffDate);
    byMonth[k] = (byMonth[k] || 0) + incomeFor(v);
  });
  const keys = Object.keys(byMonth).sort().slice(-8);
  if (!keys.length) return <div className="empty" style={{ padding: "30px" }}><p>No dated videos yet.</p></div>;
  const max = Math.max(...keys.map((k) => byMonth[k]));
  const W = 560, H = 190, pad = 34;
  const bw = (W - pad * 2) / keys.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1={pad} x2={W - 8} y1={H - 34 - (H - 60) * f} y2={H - 34 - (H - 60) * f}
          stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}
      {keys.map((k, i) => {
        const h = Math.max(4, (byMonth[k] / max) * (H - 70));
        const x = pad + i * bw + bw * 0.22;
        return (
          <g key={k}>
            <rect x={x} y={H - 34 - (mounted ? h : 4)} width={bw * 0.56} height={mounted ? h : 4} rx="6"
              fill="url(#barGrad)" style={{ transition: "all 0.9s cubic-bezier(0.22,1,0.36,1)", transitionDelay: `${i * 70}ms` }} />
            <text x={x + bw * 0.28} y={H - 12} textAnchor="middle" fill="#52565e" fontSize="10.5" fontFamily="Inter">{monthLabel(k).split(" ")[0]}</text>
            <text x={x + bw * 0.28} y={H - 34 - (mounted ? h : 4) - 8} textAnchor="middle" fill="#b9bdc6" fontSize="10.5" fontFamily="JetBrains Mono"
              style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.5s", transitionDelay: `${i * 70 + 300}ms` }}>
              ${byMonth[k].toFixed(0)}
            </text>
          </g>
        );
      })}
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cdf463" />
          <stop offset="100%" stopColor="#7fae1f" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function Overview({ videos, onAdd, onOpen }) {
  const s = stats(videos);
  const recent = [...videos].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 6);
  return (
    <div className="view-enter">
      <div className="view-head">
        <div>
          <h2>Overview</h2>
          <div className="sub">Your editing business at a glance.</div>
        </div>
        <button className="btn primary" onClick={onAdd}><I.plus /> New video</button>
      </div>

      <div className="stat-grid">
        <StatCard label="Earned" icon={<I.dollar />} value={s.earned} prefix="$" suffix=".2f" accent sub={`${s.completed} videos completed`} delay={0} />
        <StatCard label="Pipeline value" icon={<I.zap />} value={s.pending} prefix="$" suffix=".2f" sub="Awaiting completion" delay={60} />
        <StatCard label="Videos" icon={<I.film />} value={s.total} suffix="" sub={`${s.total - s.completed} in progress`} delay={120} />
        <StatCard label="Hourly ROI" icon={<I.clock />} value={s.roi} prefix="$" suffix=".1f" sub={`${s.hours.toFixed(1)}h tracked`} delay={180} />
      </div>

      <div className="grid-2">
        <div className="panel reveal" style={{ animationDelay: "120ms" }}>
          <h3>Revenue by month</h3>
          <div className="panel-sub">Income potential per hand-off month</div>
          <MonthlyBars videos={videos} />
        </div>
        <div className="panel reveal" style={{ animationDelay: "180ms" }}>
          <h3>Recent videos</h3>
          <div className="panel-sub">Latest additions</div>
          {recent.length === 0 ? (
            <div className="empty" style={{ padding: "24px" }}>
              <p>Nothing here yet.</p>
              <button className="btn primary" onClick={onAdd}><I.plus /> Add your first video</button>
            </div>
          ) : recent.map((v) => (
            <div key={v.id} className="recent-item" style={{ cursor: "pointer" }} onClick={() => onOpen(v)}>
              <div className="t">{v.name || "Untitled"}</div>
              <div className="d">{fmtDate(v.handoffDate)}</div>
              <div className="v">{fmtMoney(incomeFor(v))}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
