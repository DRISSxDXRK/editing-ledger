import { useEffect, useMemo, useRef, useState } from "react";
import { I } from "./icons";
import { NAV } from "./Sidebar";
import { incomeFor, fmtMoney } from "../lib/ledger";

export default function CommandPalette({ videos, onClose, onAction }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const actions = useMemo(() => {
    const list = [
      { id: "add", label: "New video", icon: I.plus, hint: "N" },
      ...NAV.map((n) => ({ id: "go-" + n.id, label: "Go to " + n.label, icon: n.icon })),
      { id: "export", label: "Export JSON", icon: I.download },
      { id: "import", label: "Import JSON", icon: I.upload },
    ];
    if (!q) return list;
    const ql = q.toLowerCase();
    return list.filter((a) => a.label.toLowerCase().includes(ql));
  }, [q]);

  const vids = useMemo(() => {
    if (!q) return videos.slice(0, 5);
    const ql = q.toLowerCase();
    return videos.filter((v) => (v.name || "").toLowerCase().includes(ql)).slice(0, 6);
  }, [q, videos]);

  const items = [...actions.map((a) => ({ type: "action", ...a })), ...vids.map((v) => ({ type: "video", id: v.id, label: v.name || "Untitled", icon: I.film, hint: fmtMoney(incomeFor(v)) }))];

  useEffect(() => setSel(0), [q]);

  const run = (item) => {
    if (!item) return;
    onClose();
    onAction(item);
  };

  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, items.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    else if (e.key === "Enter") run(items[sel]);
    else if (e.key === "Escape") onClose();
  };

  return (
    <div className="overlay" style={{ alignItems: "flex-start", paddingTop: "14vh" }} onClick={onClose}>
      <div className="palette" onClick={(e) => e.stopPropagation()}>
        <div className="palette-input">
          <I.search />
          <input ref={inputRef} placeholder="Type a command or search videos…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} />
          <span className="kbd">esc</span>
        </div>
        <div className="palette-list">
          {items.length === 0 && <div style={{ padding: "22px", textAlign: "center", color: "var(--faint)", fontSize: 13 }}>No results</div>}
          {actions.length > 0 && <div className="palette-group">Commands</div>}
          {actions.map((a, i) => {
            const idx = i;
            return (
              <button key={a.id} className={"palette-item" + (sel === idx ? " selected" : "")}
                onMouseEnter={() => setSel(idx)} onClick={() => run({ type: "action", ...a })}>
                <a.icon /> {a.label} {a.hint && <span className="meta">{a.hint}</span>}
              </button>
            );
          })}
          {vids.length > 0 && <div className="palette-group">Videos</div>}
          {vids.map((v, i) => {
            const idx = actions.length + i;
            return (
              <button key={v.id} className={"palette-item" + (sel === idx ? " selected" : "")}
                onMouseEnter={() => setSel(idx)} onClick={() => run({ type: "video", id: v.id, label: v.name })}>
                <I.film /> {v.name || "Untitled"} <span className="meta">{fmtMoney(incomeFor(v))}</span>
              </button>
            );
          })}
        </div>
        <div className="palette-foot">
          <span><span className="kbd">↑↓</span> navigate</span>
          <span><span className="kbd">↵</span> select</span>
          <span><span className="kbd">esc</span> close</span>
        </div>
      </div>
    </div>
  );
}
