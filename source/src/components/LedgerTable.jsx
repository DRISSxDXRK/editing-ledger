import { useMemo, useState } from "react";
import { I } from "./icons";
import { STATUSES, fmtMoney, fmtDate, fmtDuration, hourlyRoi, incomeFor, earnedFor } from "../lib/ledger";

const statusClass = (s) => s.toLowerCase().replace(" ", "");
const formatClass = (f) => f.toLowerCase();

export default function LedgerTable({ videos, onAdd, onEdit, onDelete, onExport, onImport }) {
  const [q, setQ] = useState("");
  const [statusF, setStatusF] = useState("");
  const [formatF, setFormatF] = useState("");
  const [sort, setSort] = useState({ key: "createdAt", dir: -1 });

  const rows = useMemo(() => {
    let r = videos.filter((v) => {
      if (q && !(v.name || "").toLowerCase().includes(q.toLowerCase())) return false;
      if (statusF && v.status !== statusF) return false;
      if (formatF && v.format !== formatF) return false;
      return true;
    });
    const dir = sort.dir;
    const val = (v) => {
      switch (sort.key) {
        case "income": return incomeFor(v);
        case "earned": return earnedFor(v);
        case "handoffDate": return v.handoffDate || 0;
        case "name": return (v.name || "").toLowerCase();
        default: return v.createdAt || 0;
      }
    };
    return [...r].sort((a, b) => {
      const va = val(a), vb = val(b);
      return (va < vb ? -1 : va > vb ? 1 : 0) * dir;
    });
  }, [videos, q, statusF, formatF, sort]);

  const toggleSort = (key) =>
    setSort((s) => (s.key === key ? { key, dir: -s.dir } : { key, dir: key === "name" ? 1 : -1 }));

  const th = (label, key, num) => (
    <th className={(key ? "sortable " : "") + (num ? "num" : "")} onClick={key ? () => toggleSort(key) : undefined}>
      {label} {sort.key === key && (sort.dir === 1 ? "▲" : "▼")}
    </th>
  );

  const totEarn = rows.reduce((s, v) => s + earnedFor(v), 0);

  return (
    <div className="view-enter">
      <div className="view-head">
        <div>
          <h2>Ledger</h2>
          <div className="sub">{rows.length} videos · {fmtMoney(totEarn)} earned in view</div>
        </div>
        <div style={{ display: "flex", gap: 9 }}>
          <button className="btn ghost" onClick={onImport}><I.upload /> Import</button>
          <button className="btn ghost" onClick={onExport}><I.download /> Export</button>
          <button className="btn primary" onClick={onAdd}><I.plus /> New video</button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-wrap">
          <I.search />
          <input placeholder="Search videos…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select value={statusF} onChange={(e) => setStatusF(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={formatF} onChange={(e) => setFormatF(e.target.value)}>
          <option value="">All formats</option>
          <option value="Reel">Reel</option>
          <option value="YouTube">YouTube</option>
        </select>
      </div>

      <div className="panel table-panel">
        {rows.length === 0 ? (
          <div className="empty">
            <div className="glyph"><I.film /></div>
            <h3>No videos found</h3>
            <p>{videos.length === 0 ? "Add your first video to start tracking." : "Try clearing your filters."}</p>
            {videos.length === 0 && <button className="btn primary" onClick={onAdd}><I.plus /> New video</button>}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                {th("Video", "name")}
                {th("Format")}
                {th("Status")}
                {th("Hand-off", "handoffDate")}
                {th("Duration")}
                {th("Edit hrs", null, true)}
                {th("Income", "income", true)}
                {th("Earned", "earned", true)}
                {th("$/h")}
                <th className="row-actions"> </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <tr key={v.id}>
                  <td className="vname">{v.name || "Untitled"}</td>
                  <td><span className={"pill " + formatClass(v.format)}>{v.format}</span></td>
                  <td><span className={"pill " + statusClass(v.status)}>{v.status}</span></td>
                  <td className="mono">{fmtDate(v.handoffDate)}</td>
                  <td className="mono">{fmtDuration(v)}</td>
                  <td className="num mono">{Number(v.editHours) || 0}</td>
                  <td className="num mono">{fmtMoney(incomeFor(v))}</td>
                  <td className="num mono" style={{ color: v.status === "Completed" ? "var(--accent)" : "var(--faint)" }}>
                    {fmtMoney(earnedFor(v))}
                  </td>
                  <td className="mono">{hourlyRoi(v)}</td>
                  <td className="row-actions">
                    <button className="icon-btn" title="Edit" onClick={() => onEdit(v)}><I.edit /></button>
                    <button className="icon-btn del" title="Delete" onClick={() => onDelete(v)}><I.trash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
