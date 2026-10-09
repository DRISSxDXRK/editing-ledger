import { useState } from "react";
import { I } from "./icons";
import { STATUSES, fmtMoney, fmtDuration, incomeFor } from "../lib/ledger";

const statusClass = (s) => s.toLowerCase().replace(" ", "");
const formatClass = (f) => f.toLowerCase();

export default function Kanban({ videos, onMove, onAdd, onOpen }) {
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);

  const onDragStart = (e, id) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };
  const onDragEnd = () => { setDragId(null); setOverCol(null); };
  const onDropCol = (e, status) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || dragId;
    if (id) onMove(id, status);
    setOverCol(null);
    setDragId(null);
  };

  return (
    <div className="view-enter">
      <div className="view-head">
        <div>
          <h2>Pipeline</h2>
          <div className="sub">Drag cards between stages.</div>
        </div>
        <button className="btn primary" onClick={onAdd}><I.plus /> New video</button>
      </div>
      <div className="kanban">
        {STATUSES.map((st) => {
          const cards = videos.filter((v) => v.status === st);
          const val = cards.reduce((s, v) => s + incomeFor(v), 0);
          return (
            <div
              key={st}
              className={"kcol" + (overCol === st ? " drag-over" : "")}
              onDragOver={(e) => { e.preventDefault(); setOverCol(st); }}
              onDragLeave={() => setOverCol((c) => (c === st ? null : c))}
              onDrop={(e) => onDropCol(e, st)}
            >
              <div className="kcol-head">
                <h3><span className={"pill " + statusClass(st)} style={{ padding: "3px 10px" }}>{st}</span></h3>
                <span className="count">{cards.length}</span>
              </div>
              {cards.map((v) => (
                <div
                  key={v.id}
                  className={"kcard" + (dragId === v.id ? " dragging" : "")}
                  draggable
                  onDragStart={(e) => onDragStart(e, v.id)}
                  onDragEnd={onDragEnd}
                  onClick={() => onOpen(v)}
                >
                  <div className="tags">
                    <span className={"pill " + formatClass(v.format)}>{v.format}</span>
                  </div>
                  <div className="t">{v.name || "Untitled"}</div>
                  <div className="meta">
                    <span className="dur">{fmtDuration(v)}</span>
                    <span className="inc">{fmtMoney(incomeFor(v))}</span>
                  </div>
                </div>
              ))}
              {cards.length === 0 && (
                <div style={{ textAlign: "center", color: "var(--faint)", fontSize: 12, padding: "18px 0" }}>
                  Drop here
                </div>
              )}
              <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--faint)", textAlign: "right", fontFamily: "var(--font-mono)" }}>
                {fmtMoney(val)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
