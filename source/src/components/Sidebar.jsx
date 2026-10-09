import { I } from "./icons";

export const NAV = [
  { id: "overview", label: "Overview", icon: I.grid },
  { id: "ledger", label: "Ledger", icon: I.list },
  { id: "pipeline", label: "Pipeline", icon: I.kanban },
  { id: "analytics", label: "Analytics", icon: I.chart },
];

export default function Sidebar({ view, setView, onCommand, onAdd, count }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">EL</div>
        <div>
          <h1>Editing Ledger</h1>
          <p>{count} videos tracked</p>
        </div>
      </div>
      <div className="nav-label">Workspace</div>
      <nav className="nav">
        {NAV.map((n) => (
          <button
            key={n.id}
            className={"nav-item" + (view === n.id ? " active" : "")}
            onClick={() => setView(n.id)}
          >
            <n.icon />
            {n.label}
          </button>
        ))}
      </nav>
      <div className="nav-label">Actions</div>
      <nav className="nav">
        <button className="nav-item" onClick={onAdd}>
          <I.plus /> New video
        </button>
        <button className="nav-item" onClick={onCommand}>
          <I.command /> Command
          <span className="kbd-hint"><span className="kbd">⌘K</span></span>
        </button>
      </nav>
      <div className="sidebar-foot">
        <div className="sync-line"><span className="dot" /> Local-first · auto-saved</div>
      </div>
    </aside>
  );
}
