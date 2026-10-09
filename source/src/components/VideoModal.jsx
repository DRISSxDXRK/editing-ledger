import { useEffect, useState } from "react";
import { I } from "./icons";
import { STATUSES, incomeFor, fmtMoney, uid } from "../lib/ledger";

function toDateInput(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function VideoModal({ video, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    name: video?.name || "",
    format: video?.format || "Reel",
    status: video?.status || "Todo",
    handoffDate: toDateInput(video?.handoffDate),
    lengthMin: video?.lengthMin ?? "",
    lengthSec: video?.lengthSec ?? "",
    lengthMs: video?.lengthMs ?? "",
    editHours: video?.editHours ?? "",
  }));

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const preview = incomeFor({
    format: form.format,
    lengthMin: Number(form.lengthMin) || 0,
    lengthSec: Number(form.lengthSec) || 0,
    lengthMs: Number(form.lengthMs) || 0,
  });

  const submit = () => {
    const v = {
      id: video?.id || uid(),
      createdAt: video?.createdAt || Date.now(),
      name: form.name.trim(),
      format: form.format,
      status: form.status,
      handoffDate: form.handoffDate ? new Date(form.handoffDate + "T12:00:00").getTime() : null,
      lengthMin: Number(form.lengthMin) || 0,
      lengthSec: Number(form.lengthSec) || 0,
      lengthMs: Number(form.lengthMs) || 0,
      editHours: Number(form.editHours) || 0,
    };
    onSave(v);
  };

  const isYT = form.format === "YouTube";

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{video ? "Edit video" : "New video"}</h2>
        <div className="field">
          <span>Video title</span>
          <input autoFocus placeholder="e.g. Binder Battle Ep. 12" value={form.name} onChange={set("name")}
            onKeyDown={(e) => e.key === "Enter" && submit()} />
        </div>
        <div className="row2">
          <div className="field">
            <span>Format</span>
            <select value={form.format} onChange={set("format")}>
              <option value="Reel">Reel — $10 flat</option>
              <option value="YouTube">YouTube — $12/min</option>
            </select>
          </div>
          <div className="field">
            <span>Status</span>
            <select value={form.status} onChange={set("status")}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        {isYT && (
          <div className="field">
            <span>Final video length</span>
            <div className="row3">
              <input type="number" min="0" placeholder="Min" value={form.lengthMin} onChange={set("lengthMin")} />
              <input type="number" min="0" max="59" placeholder="Sec" value={form.lengthSec} onChange={set("lengthSec")} />
              <input type="number" min="0" max="999" placeholder="Ms" value={form.lengthMs} onChange={set("lengthMs")} />
            </div>
          </div>
        )}
        <div className="row2">
          <div className="field">
            <span>Hand-off date</span>
            <input type="date" value={form.handoffDate} onChange={set("handoffDate")} />
          </div>
          <div className="field">
            <span>Edit time (hours)</span>
            <input type="number" min="0" step="0.5" placeholder="0" value={form.editHours} onChange={set("editHours")} />
          </div>
        </div>
        <div className="income-preview">
          <span>Income for this video</span>
          <strong>{fmtMoney(preview)}</strong>
        </div>
        <div className="modal-actions">
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={submit}>{video ? "Save changes" : "Add video"}</button>
        </div>
      </div>
    </div>
  );
}
