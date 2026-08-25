"use client";

import { FileText, ImagePlus, LockKeyhole, Paperclip, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "northstar-controlled-instruction-assets";
const MAX_FILES_PER_STEP = 8;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const SIGNED_URL_SECONDS = 3600;
const ACCEPT = "image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv";
const MIME_BY_EXTENSION = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", heic: "image/heic", heif: "image/heif",
  pdf: "application/pdf", doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain", csv: "text/csv",
};

function getFieldValue(prefix) {
  const labels = Array.from(document.querySelectorAll(".wr-content label"));
  const label = labels.find((node) => node.textContent?.trim().startsWith(prefix));
  return label?.querySelector("input,select,textarea")?.value?.trim() || "";
}

function getDocumentKey() {
  return getFieldValue("Document Number").toUpperCase();
}

function getRevision() {
  return (getFieldValue("Revision") || "A").toUpperCase();
}

function safePathPart(value) {
  return String(value || "").trim().replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90) || "file";
}

function resolvedMime(file) {
  if (file.type && file.type !== "application/octet-stream") return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  return MIME_BY_EXTENSION[ext] || "";
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(type) {
  return type?.startsWith("image/");
}

function AttachmentPanel({ stepIndex, attachments, onAdd, onRemove, notice, ready, documentKey, busy }) {
  const inputRef = useRef(null);
  const images = attachments.filter((item) => isImage(item.type));
  const files = attachments.filter((item) => !isImage(item.type));
  const disabled = !ready || !documentKey || attachments.length >= MAX_FILES_PER_STEP || busy;

  return (
    <div className="wr-step-assets">
      <div className="wr-step-assets-head">
        <div>
          <span><Paperclip size={14} /> Visuals & Attachments <em>Secure cloud</em></span>
          <small>Tenant-isolated photos and supporting files remain tied to this document revision and step.</small>
        </div>
        <button type="button" className="wr-step-upload-button" onClick={() => inputRef.current?.click()} disabled={disabled}>
          {busy ? <LockKeyhole size={14} /> : <Plus size={14} />} {busy ? "Saving…" : "Add visual or file"}
        </button>
        <input ref={inputRef} type="file" multiple accept={ACCEPT} hidden onChange={(event) => {
          const selected = Array.from(event.target.files || []);
          onAdd(stepIndex, selected);
          event.target.value = "";
        }} />
      </div>

      {!documentKey && <div className="wr-step-assets-notice">Enter the controlled Document Number before adding attachments so Northstar can bind them to the correct record.</div>}
      {!ready && documentKey && <div className="wr-step-assets-notice">Sign in to Northstar to store controlled attachments securely.</div>}
      {notice && <div className="wr-step-assets-notice">{notice}</div>}

      {!attachments.length ? (
        <button type="button" className="wr-step-assets-empty" onClick={() => !disabled && inputRef.current?.click()} disabled={disabled}>
          <ImagePlus size={18} />
          <span><strong>Add step visuals or supporting files</strong><small>Photos work well for orientation, tooling, quality checkpoints, warnings, and expected results.</small></span>
        </button>
      ) : (
        <div className="wr-step-assets-content">
          {images.length > 0 && <div className="wr-step-image-grid">{images.map((item) => <figure key={item.key}>
            <a href={item.url} target="_blank" rel="noreferrer"><img src={item.url} alt={item.name} /></a>
            <figcaption><span title={item.name}>{item.name}</span><button type="button" aria-label={`Remove ${item.name}`} onClick={() => onRemove(item)} disabled={busy}><X size={13} /></button></figcaption>
          </figure>)}</div>}
          {files.length > 0 && <div className="wr-step-file-list">{files.map((item) => <div key={item.key}>
            <FileText size={16} /><span><strong title={item.name}>{item.name}</strong><small>{formatBytes(item.size)}</small></span>
            <a href={item.url} target="_blank" rel="noreferrer">Open</a>
            <button type="button" aria-label={`Remove ${item.name}`} onClick={() => onRemove(item)} disabled={busy}><Trash2 size={14} /></button>
          </div>)}</div>}
          <div className="wr-step-assets-meta">{attachments.length} of {MAX_FILES_PER_STEP} attachments · Private Supabase Storage · 10 MB maximum each</div>
        </div>
      )}
    </div>
  );
}

export default function WorkforceStepAttachmentsEnhancer() {
  const supabase = useMemo(() => createClient(), []);
  const [slots, setSlots] = useState([]);
  const [items, setItems] = useState([]);
  const [notices, setNotices] = useState({});
  const [documentKey, setDocumentKey] = useState("");
  const [revision, setRevision] = useState("A");
  const [identity, setIdentity] = useState(null);
  const [busyStep, setBusyStep] = useState(null);

  const discoverSlots = useCallback(() => {
    const next = Array.from(document.querySelectorAll(".wr-step-list > article")).map((article, index) => {
      let slot = article.querySelector(":scope > .wr-step-attachment-slot");
      if (!slot) {
        slot = document.createElement("div");
        slot.className = "wr-step-attachment-slot";
        slot.dataset.stepIndex = String(index);
        article.appendChild(slot);
      }
      return slot;
    });
    setSlots((current) => current.length === next.length && current.every((node, index) => node === next[index]) ? current : next);
  }, []);

  useEffect(() => {
    const sync = () => { discoverSlots(); setDocumentKey(getDocumentKey()); setRevision(getRevision()); };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("input", sync, true);
    document.addEventListener("change", sync, true);
    return () => { observer.disconnect(); document.removeEventListener("input", sync, true); document.removeEventListener("change", sync, true); };
  }, [discoverSlots]);

  useEffect(() => {
    if (!supabase) { setIdentity(null); return; }
    let active = true;
    const loadIdentity = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!active || !userData.user) { setIdentity(null); return; }
      const { data: membership, error } = await supabase.from("organization_members").select("organization_id,role").eq("user_id", userData.user.id).limit(1).maybeSingle();
      if (!active || error || !membership?.organization_id) { setIdentity(null); return; }
      setIdentity({ userId: userData.user.id, organizationId: membership.organization_id, role: membership.role });
    };
    void loadIdentity();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { void loadIdentity(); });
    return () => { active = false; subscription.unsubscribe(); };
  }, [supabase]);

  const refreshAttachments = useCallback(async () => {
    if (!supabase || !identity || !documentKey) { setItems([]); return; }
    const { data, error } = await supabase.from("workforce_step_attachments").select("id,document_number,revision,step_index,storage_path,original_name,mime_type,size_bytes,uploaded_at").eq("organization_id", identity.organizationId).eq("document_number", documentKey).eq("revision", revision).order("uploaded_at", { ascending: true });
    if (error) { setItems([]); return; }
    const paths = (data || []).map((row) => row.storage_path);
    let signed = [];
    if (paths.length) {
      const response = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS);
      signed = response.data || [];
    }
    setItems((data || []).map((row, index) => ({
      key: row.id, id: row.id, stepIndex: row.step_index, path: row.storage_path, name: row.original_name,
      type: row.mime_type, size: Number(row.size_bytes || 0), createdAt: row.uploaded_at, url: signed[index]?.signedUrl || "",
    })));
  }, [supabase, identity, documentKey, revision]);

  useEffect(() => { void refreshAttachments(); }, [refreshAttachments]);

  const byStep = useMemo(() => {
    const map = new Map();
    items.forEach((item) => { if (!map.has(item.stepIndex)) map.set(item.stepIndex, []); map.get(item.stepIndex).push(item); });
    return map;
  }, [items]);

  const flashStep = (stepIndex, message) => {
    setNotices((current) => ({ ...current, [stepIndex]: message }));
    window.setTimeout(() => setNotices((current) => ({ ...current, [stepIndex]: "" })), 3500);
  };

  const addFiles = async (stepIndex, selected) => {
    if (!supabase || !identity) { flashStep(stepIndex, "A signed-in Northstar session is required for secure attachments."); return; }
    if (!documentKey) { flashStep(stepIndex, "Enter the Document Number before adding controlled attachments."); return; }
    const existing = byStep.get(stepIndex) || [];
    const available = Math.max(0, MAX_FILES_PER_STEP - existing.length);
    if (!available) { flashStep(stepIndex, `This step already has the maximum of ${MAX_FILES_PER_STEP} attachments.`); return; }
    setBusyStep(stepIndex);
    let uploaded = 0;
    try {
      for (const file of selected.slice(0, available)) {
        if (file.size > MAX_FILE_SIZE) { flashStep(stepIndex, `${file.name} exceeds the 10 MB limit.`); continue; }
        const mime = resolvedMime(file);
        if (!mime || !Object.values(MIME_BY_EXTENSION).includes(mime)) { flashStep(stepIndex, `${file.name} is not an approved attachment type.`); continue; }
        const id = crypto.randomUUID();
        const path = `${identity.organizationId}/${safePathPart(documentKey)}/rev-${safePathPart(revision)}/step-${stepIndex + 1}/${id}-${safePathPart(file.name)}`;
        const upload = await supabase.storage.from(BUCKET).upload(path, file, { contentType: mime, cacheControl: "3600", upsert: false });
        if (upload.error) { flashStep(stepIndex, `Could not securely upload ${file.name}.`); continue; }
        const meta = await supabase.from("workforce_step_attachments").insert({
          id, organization_id: identity.organizationId, document_number: documentKey, revision, step_index: stepIndex,
          storage_path: path, original_name: file.name, mime_type: mime, size_bytes: file.size, uploaded_by: identity.userId,
        });
        if (meta.error) { await supabase.storage.from(BUCKET).remove([path]); flashStep(stepIndex, `Could not register ${file.name} to the controlled record.`); continue; }
        uploaded += 1;
      }
      await refreshAttachments();
      if (uploaded) flashStep(stepIndex, `${uploaded} secure attachment${uploaded === 1 ? "" : "s"} added to Step ${stepIndex + 1}.`);
    } finally { setBusyStep(null); }
  };

  const removeFile = async (item) => {
    if (!supabase || !identity) return;
    setBusyStep(item.stepIndex);
    try {
      const storageResult = await supabase.storage.from(BUCKET).remove([item.path]);
      if (storageResult.error) { flashStep(item.stepIndex, "Northstar could not remove the stored file."); return; }
      const metaResult = await supabase.from("workforce_step_attachments").delete().eq("id", item.id).eq("organization_id", identity.organizationId);
      if (metaResult.error) { flashStep(item.stepIndex, "The file was removed, but its metadata needs cleanup. Please retry."); return; }
      await refreshAttachments();
      flashStep(item.stepIndex, `${item.name} removed from this controlled step.`);
    } finally { setBusyStep(null); }
  };

  if (!slots.length) return null;
  return <>
    {slots.map((slot, index) => createPortal(<AttachmentPanel key={`${documentKey}-${revision}-${index}`} stepIndex={index} attachments={byStep.get(index) || []} onAdd={addFiles} onRemove={removeFile} notice={notices[index]} ready={Boolean(identity)} documentKey={documentKey} busy={busyStep === index} />, slot))}
    <style>{`
      .wr-step-attachment-slot{grid-column:1/-1;width:100%}.wr-step-assets{margin:14px 0 2px 70px;padding-top:14px;border-top:1px solid #dbe5ed}.wr-step-assets-head{display:flex;align-items:center;justify-content:space-between;gap:14px}.wr-step-assets-head>div{min-width:0}.wr-step-assets-head span{display:flex;align-items:center;gap:7px;color:#355872;font-size:9px;font-weight:900}.wr-step-assets-head span svg{color:#0a66b7}.wr-step-assets-head em{padding:3px 6px;border-radius:999px;background:#e8f4ff;color:#0a66b7;font-size:7px;font-style:normal;font-weight:900;text-transform:uppercase;letter-spacing:.06em}.wr-step-assets-head small{display:block;margin-top:4px;color:#7b8f9f;font-size:8px;line-height:1.45}.wr-step-upload-button{display:inline-flex;align-items:center;gap:6px;min-height:34px;padding:0 11px;border:1px solid #c7d7e4;border-radius:8px;background:#fff;color:#244b68;font-size:8px;font-weight:900;white-space:nowrap}.wr-step-upload-button:hover{border-color:#7da9cc;background:#f7fbfe}.wr-step-upload-button:disabled,.wr-step-assets-empty:disabled{opacity:.5;cursor:not-allowed}.wr-step-assets-empty{width:100%;display:flex;align-items:center;gap:11px;margin-top:10px;padding:12px 14px;border:1px dashed #bfd0dd;border-radius:9px;background:#fbfdff;color:#355872;text-align:left}.wr-step-assets-empty:hover:not(:disabled){border-color:#78a8cc;background:#f7fbfe}.wr-step-assets-empty>svg{flex:0 0 auto;color:#0a66b7}.wr-step-assets-empty span,.wr-step-assets-empty strong,.wr-step-assets-empty small{display:block}.wr-step-assets-empty strong{font-size:8px}.wr-step-assets-empty small{margin-top:3px;color:#7a8f9f;font-size:8px;font-weight:500;line-height:1.4}.wr-step-assets-notice{margin-top:9px;padding:8px 10px;border:1px solid #b9d5e8;border-radius:7px;background:#eef7fd;color:#245e85;font-size:8px;font-weight:800}.wr-step-assets-content{margin-top:10px}.wr-step-image-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}.wr-step-image-grid figure{overflow:hidden;margin:0;border:1px solid #d3dfe8;border-radius:9px;background:#fff}.wr-step-image-grid a{display:block}.wr-step-image-grid img{display:block;width:100%;height:125px;object-fit:cover;background:#edf3f7}.wr-step-image-grid figcaption{display:flex;align-items:center;gap:7px;padding:7px 8px}.wr-step-image-grid figcaption span{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#48677d;font-size:8px;font-weight:800}.wr-step-image-grid figcaption button,.wr-step-file-list button{display:grid;place-items:center;width:26px;height:26px;border:0;border-radius:6px;background:transparent;color:#8e4851}.wr-step-image-grid figcaption button:hover,.wr-step-file-list button:hover{background:#fdeef0}.wr-step-file-list{display:grid;gap:7px;margin-top:9px}.wr-step-file-list>div{display:grid;grid-template-columns:auto 1fr auto auto;align-items:center;gap:9px;padding:8px 10px;border:1px solid #d9e3ea;border-radius:8px;background:#fff}.wr-step-file-list>div>svg{color:#52728a}.wr-step-file-list span{min-width:0}.wr-step-file-list strong,.wr-step-file-list small{display:block}.wr-step-file-list strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#355872;font-size:8px}.wr-step-file-list small{margin-top:2px;color:#8293a0;font-size:7px}.wr-step-file-list a{color:#0a66b7;font-size:8px;font-weight:900;text-decoration:none}.wr-step-assets-meta{margin-top:8px;color:#8496a4;font-size:7px;text-align:right}@media(max-width:900px){.wr-step-image-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:650px){.wr-step-assets{margin-left:0}.wr-step-assets-head{align-items:stretch;flex-direction:column}.wr-step-upload-button{justify-content:center;min-height:42px}.wr-step-image-grid{grid-template-columns:1fr 1fr}.wr-step-image-grid img{height:110px}.wr-step-assets-empty{min-height:58px}.wr-step-file-list>div{grid-template-columns:auto 1fr auto}.wr-step-file-list a{display:none}}
    `}</style>
  </>;
}
