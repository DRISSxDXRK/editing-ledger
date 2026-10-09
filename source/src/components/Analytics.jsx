import { useEffect, useState } from "react";
import { fmtMoney, incomeFor, earnedFor, monthKey, monthLabel, stats } from "../lib/ledger";

function Donut({ reel, yt }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = requestAnimationFrame(() => requestAnimationFrame(() => setMounted(true))); return () => cancelAnimationFrame(t); }, []);
  const total = reel + yt;
  const r = 64, circ = 2 * Math.PI * r;
  const reelFrac = total > 0 ? reel / total : 0;
  const reelLen = mounted ? reelFrac * circ : 0;
  const ytLen = mounted ? (1 - reelFrac) * circ : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
      <svg width="170" height="170" viewBox="0 0 170 170">
        <circle cx="85" cy="85" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="16" />
        <circle cx="85" cy="85" r={r} fill="none" stroke="#a78bfa" strokeWidth="16"
          strokeDasharray={`${reelLen} ${circ}`}
          strokeLinecap="round" transform="rotate(-90 85 85)"
          style={{ transition: "stroke-dasharray 1s cubic-bezier(0.22,1,0.36,1)" }} />
        <circle cx="85" cy="85" r={r} fill="none" stroke="#f87171" strokeWidth="16"
          strokeDasharray={`${ytLen} ${circ}`}
          strokeDashoffset={-reelLen}
          strokeLinecap="round" transform="rotate(-90 85 85)"
          style={{ transition: "stroke-dasharray 1s cubic-bezier(0.22,1,0.36,1), stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)" }} />
        <text x="85" y="80" textAnchor="middle" fill="#eef0f3" fontSize="21" fontWeight="700" fontFamily="Space Grotesk">
          {total > 0 ? Math.round(reelFrac * 100) : 0}%
        </text>
        <text x="85" y="102" textAnchor="middle" fill="#7d828c" fontSize="11" fontFamily="Inter">reels share</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: "#a78bfa" }} />
          Reels <b className="mono" style={{ marginLeft: "auto", paddingLeft: 18 }}>{fmtMoney(reel)}</b>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: "#f87171" }} />
          YouTube <b className="mono" style={{ marginLeft: "auto", paddingLeft: 18 }}>{fmtMoney(yt)}</b>
        </div>
      </div>
    </div>
  );
}

export default function Analytics({ videos }) {
  const s = stats(videos);
  const reels = videos.filter((v) => v.format === "Reel");
  const yts = videos.filter((v) => v.format === "YouTube");
  const reelEarn = reels.reduce((x, v) => x + earnedFor(v), 0);
  const ytEarn = yts.reduce((x, v) => x + earnedFor(v), 0);

  const byMonth = {};
  videos.forEach((v) => {
    if (!v.handoffDate) return;
    const k = monthKey(v.handoffDate);
    byMonth[k] = byMonth[k] || { n: 0, earned: 0 };
    byMonth[k].n++;
    byMonth[k].earned += earnedFor(v);
  });
  const keys = Object.keys(byMonth).sort();
  const best = keys.reduce((b, k) => (byMonth[k].earned > (b ? byMonth[b].earned : -1) ? k : b), null);
  const avgPer = s.completed > 0 ? s.earned / s.completed : 0;

  return (
    <div className="view-enter">
      <div className="view-head">
        <div>
          <h2>Analytics</h2>
          <div className="sub">Where the money comes from.</div>
        </div>
      </div>

      {videos.length === 0 ? (
        <div className="panel"><div className="empty"><h3>No data yet</h3><p>Add videos and come back for insights.</p></div></div>
      ) : (
        <>
          <div className="analytics-grid" style={{ marginBottom: 14 }}>
            <div className="panel reveal">
              <h3>Earned income by month</h3>
              <div className="panel-sub">Completed work, per hand-off month</div>
              {keys.length === 0 ? <p style={{ color: "var(--muted)" }}>Add hand-off dates to see this chart.</p> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {keys.map((k, i) => {
                    const max = Math.max(...keys.map((x) => byMonth[x].earned), 1);
                    return (
                      <div key={k} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 74, fontSize: 12, color: "var(--muted)" }}>{monthLabel(k)}</div>
                        <div style={{ flex: 1, height: 22, background: "rgba(255,255,255,0.04)", borderRadius: 7, overflow: "hidden" }}>
                          <div style={{
                            width: `${(byMonth[k].earned / max) * 100}%`, height: "100%",
                            background: "linear-gradient(90deg,#7fae1f,#cdf463)", borderRadius: 7,
                            transition: "width 0.9s cubic-bezier(0.22,1,0.36,1)", transitionDelay: `${i * 60}ms`,
                          }} />
                        </div>
                        <div className="mono" style={{ width: 78, textAlign: "right", fontSize: 12.5 }}>{fmtMoney(byMonth[k].earned)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="panel reveal" style={{ animationDelay: "80ms" }}>
              <h3>Format split</h3>
              <div className="panel-sub">Earned income by format</div>
              <Donut reel={reelEarn} yt={ytEarn} />
            </div>
          </div>

          <div className="panel reveal" style={{ animationDelay: "140ms" }}>
            <h3>Breakdown</h3>
            <div className="panel-sub">Key ratios</div>
            <div className="bk-row"><span className="k">Total earned</span><span className="v accent">{fmtMoney(s.earned)}</span></div>
            <div className="bk-row"><span className="k">Average per completed video</span><span className="v">{fmtMoney(avgPer)}</span></div>
            <div className="bk-row"><span className="k">Reels completed</span><span className="v">{reels.filter((v) => v.status === "Completed").length} · {fmtMoney(reelEarn)}</span></div>
            <div className="bk-row"><span className="k">YouTube completed</span><span className="v">{yts.filter((v) => v.status === "Completed").length} · {fmtMoney(ytEarn)}</span></div>
            <div className="bk-row"><span className="k">Best month</span><span className="v">{best ? `${monthLabel(best)} · ${fmtMoney(byMonth[best].earned)}` : "—"}</span></div>
            <div className="bk-row"><span className="k">Editing hours logged</span><span className="v">{s.hours.toFixed(1)}h</span></div>
            <div className="bk-row"><span className="k">Effective hourly rate</span><span className="v accent">{fmtMoney(s.roi)}/h</span></div>
          </div>
        </>
      )}
    </div>
  );
}
