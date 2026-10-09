import { useCallback, useEffect, useRef, useState } from "react";
import Sidebar, { NAV } from "./components/Sidebar";
import Overview from "./components/Overview";
import LedgerTable from "./components/LedgerTable";
import Kanban from "./components/Kanban";
import Analytics from "./components/Analytics";
import VideoModal from "./components/VideoModal";
import ConfirmDialog from "./components/ConfirmDialog";
import CommandPalette from "./components/CommandPalette";
import { loadVideos, loadSeed, saveVideos, stats } from "./lib/ledger";

export default function App() {
  const [videos, setVideos] = useState(() => loadVideos() || []);
  const [ready, setReady] = useState(!!loadVideos());
  const [view, setView] = useState("overview");
  const [modal, setModal] = useState(null); // {video?}
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [palette, setPalette] = useState(false);
  const fileRef = useRef(null);

  // first-run seed
  useEffect(() => {
    if (ready) return;
    loadSeed().then((seed) => {
      if (seed) setVideos(seed);
      setReady(true);
    });
  }, [ready]);

  useEffect(() => { if (ready) saveVideos(videos); }, [videos, ready]);

  const openAdd = useCallback(() => setModal({}), []);
  const openEdit = useCallback((video) => setModal({ video }), []);

  const saveVideo = useCallback((v) => {
    setVideos((vs) => {
      const i = vs.findIndex((x) => x.id === v.id);
      return i >= 0 ? vs.map((x) => (x.id === v.id ? v : x)) : [v, ...vs];
    });
    setModal(null);
  }, []);

  const deleteVideo = useCallback((v) => setConfirmDelete(v), []);

  const confirmDeleteVideo = useCallback(() => {
    setVideos((vs) => vs.filter((x) => x.id !== confirmDelete.id));
    setConfirmDelete(null);
  }, [confirmDelete]);

  const moveVideo = useCallback((id, status) => {
    setVideos((vs) => vs.map((v) => (v.id === id ? { ...v, status } : v)));
  }, []);

  const doExport = useCallback(() => {
    const blob = new Blob([JSON.stringify(videos, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "editing-ledger.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }, [videos]);

  const doImport = useCallback(() => fileRef.current?.click(), []);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        const arr = Array.isArray(data) ? data : data.videos || [];
        if (window.confirm(`Import ${arr.length} videos? This replaces your current data.`)) setVideos(arr);
      } catch {
        alert("Could not read that file.");
      }
    };
    r.readAsText(f);
    e.target.value = "";
  };

  const onPaletteAction = useCallback((item) => {
    if (item.type === "video") {
      const v = videos.find((x) => x.id === item.id);
      if (v) openEdit(v);
      return;
    }
    const id = item.id;
    if (id === "add") openAdd();
    else if (id === "export") doExport();
    else if (id === "import") doImport();
    else if (id.startsWith("go-")) setView(id.slice(3));
  }, [videos, openAdd, openEdit, doExport, doImport]);

  // global shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "");
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette((p) => !p); }
      else if (!typing && e.key.toLowerCase() === "n") openAdd();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openAdd]);

  const viewProps = { videos, onAdd: openAdd };

  return (
    <div className="shell">
      <Sidebar view={view} setView={setView} onCommand={() => setPalette(true)} onAdd={openAdd} count={videos.length} />
      <main className="main" key={view}>
        {view === "overview" && <Overview {...viewProps} onOpen={openEdit} />}
        {view === "ledger" && (
          <LedgerTable {...viewProps} onEdit={openEdit} onDelete={deleteVideo} onExport={doExport} onImport={doImport} />
        )}
        {view === "pipeline" && <Kanban {...viewProps} onMove={moveVideo} onOpen={openEdit} />}
        {view === "analytics" && <Analytics videos={videos} />}
      </main>

      <nav className="mobile-bar">
        {NAV.map((n) => (
          <button key={n.id} className={view === n.id ? "active" : ""} onClick={() => setView(n.id)}>
            <n.icon />{n.label}
          </button>
        ))}
      </nav>

      {modal && <VideoModal video={modal.video} onClose={() => setModal(null)} onSave={saveVideo} />}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete video?"
          message={`"${confirmDelete.name || "Untitled"}" will be permanently removed from your ledger.`}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={confirmDeleteVideo}
        />
      )}
      {palette && (
        <CommandPalette videos={videos} onClose={() => setPalette(false)} onAction={onPaletteAction} />
      )}
      <input ref={fileRef} type="file" accept=".json" style={{ display: "none" }} onChange={onFile} />
    </div>
  );
}
