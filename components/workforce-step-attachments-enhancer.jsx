"use client";

import { FileText, ImagePlus, Paperclip, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const DB_NAME = "qmspilot-northstar-work-instructions";
const DB_VERSION = 1;
const STORE_NAME = "step-attachments";
const MAX_FILES_PER_STEP = 8;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPT = "image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv";

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "key" });
        store.createIndex("documentKey", "documentKey", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function dbRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function listDocumentAttachments(documentKey) {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_NAME, "readonly");
    const index = tx.objectStore(STORE_NAME).index("documentKey");
    return await dbRequest(index.getAll(documentKey));
  } finally {
    db.close();
  }
}

async function saveAttachment(record) {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_NAME, "readwrite");
    await dbRequest(tx.objectStore(STORE_NAME).put(record));
  } finally {
    db.close();
  }
}

async function deleteAttachment(key) {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_NAME, "readwrite");
    await dbRequest(tx.objectStore(STORE_NAME).delete(key));
  } finally {
    db.close();
  }
}

function getDocumentKey() {
  const labels = Array.from(document.querySelectorAll(".wr-content label"));
  const label = labels.find((node) => node.textContent?.trim().startsWith("Document Number"));
  const value = label?.querySelector("input")?.value?.trim();
  return (value || "DRAFT").toUpperCase();
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(type) {
  return type?.startsWith("image/");
}

function AttachmentPanel({ stepIndex, attachments, onAdd, onRemove, notice }) {
  const inputRef = useRef(null);
  const images = attachments.filter((item) => isImage(item.type));
  const files = attachments.filter((item) => !isImage(item.type));

  return (
    <div className="wr-step-assets">
      <div className="wr-step-assets-head">
        <div>
          <span><Paperclip size={14} /> Visuals & Attachments <em>Optional</em></span>
          <small>Add photos, marked-up images, drawings, PDFs, or supporting files for this step.</small>
        </div>
        <button type="button" className="wr-step-upload-button" onClick={() => inputRef.current?.click()} disabled={attachments.length >= MAX_FILES_PER_STEP}>
          <Plus size={14} /> Add visual or file
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          hidden
          onChange={(event) => {
            const selected = Array.from(event.target.files || []);
            onAdd(stepIndex, selected);
            event.target.value = "";
          }}
        />
      </div>

      {notice && <div className="wr-step-assets-notice">{notice}</div>}

      {!attachments.length ? (
        <button type="button" className="wr-step-assets-empty" onClick={() => inputRef.current?.click()}>
          <ImagePlus size={18} />
          <span><strong>Add step visuals or supporting files</strong><small>Photos are especially useful for orientation, tooling, quality checkpoints, and expected results.</small></span>
        </button>
      ) : (
        <div className="wr-step-assets-content">
          {images.length > 0 && <div className="wr-step-image-grid">
            {images.map((item) => <figure key={item.key}>
              <img src={item.url} alt={item.name} />
              <figcaption><span title={item.name}>{item.name}</span><button type="button" aria-label={`Remove ${item.name}`} onClick={() => onRemove(item)}><X size={13} /></button></figcaption>
            </figure>)}
          </div>}

          {files.length > 0 && <div className="wr-step-file-list">
            {files.map((item) => <div key={item.key}>
              <FileText size={16} />
              <span><strong title={item.name}>{item.name}</strong><small>{formatBytes(item.size)}</small></span>
              <a href={item.url} download={item.name}>Open</a>
              <button type="button" aria-label={`Remove ${item.name}`} onClick={() => onRemove(item)}><Trash2 size={14} /></button>
            </div>)}
          </div>}

          <div className="wr-step-assets-meta">{attachments.length} of {MAX_FILES_PER_STEP} attachments · Maximum 10 MB each</div>
        </div>
      )}
    </div>
  );
}

export default function WorkforceStepAttachmentsEnhancer() {
  const [slots, setSlots] = useState([]);
  const [items, setItems] = useState([]);
  const [notices, setNotices] = useState({});
  const [documentKey, setDocumentKey] = useState("DRAFT");

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
    setSlots((current) => {
      if (current.length === next.length && current.every((node, index) => node === next[index])) return current;
      return next;
    });
  }, []);

  useEffect(() => {
    const sync = () => {
      discoverSlots();
      setDocumentKey(getDocumentKey());
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("input", sync, true);
    return () => {
      observer.disconnect();
      document.removeEventListener("input", sync, true);
    };
  }, [discoverSlots]);

  useEffect(() => {
    let cancelled = false;
    const urls = [];
    listDocumentAttachments(documentKey).then((records) => {
      if (cancelled) return;
      const loaded = records.map((record) => {
        const url = URL.createObjectURL(record.blob);
        urls.push(url);
        return { ...record, url };
      });
      setItems((current) => {
        current.forEach((item) => item.url && URL.revokeObjectURL(item.url));
        return loaded;
      });
    }).catch(() => {});
    return () => {
      cancelled = true;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [documentKey]);

  const byStep = useMemo(() => {
    const map = new Map();
    items.forEach((item) => {
      if (!map.has(item.stepIndex)) map.set(item.stepIndex, []);
      map.get(item.stepIndex).push(item);
    });
    return map;
  }, [items]);

  const flashStep = (stepIndex, message) => {
    setNotices((current) => ({ ...current, [stepIndex]: message }));
    window.setTimeout(() => setNotices((current) => ({ ...current, [stepIndex]: "" })), 3200);
  };

  const addFiles = async (stepIndex, selected) => {
    const existing = byStep.get(stepIndex) || [];
    const available = Math.max(0, MAX_FILES_PER_STEP - existing.length);
    if (!available) {
      flashStep(stepIndex, `This step already has the maximum of ${MAX_FILES_PER_STEP} attachments.`);
      return;
    }

    const accepted = selected.slice(0, available);
    const oversized = accepted.find((file) => file.size > MAX_FILE_SIZE);
    if (oversized) {
      flashStep(stepIndex, `${oversized.name} exceeds the 10 MB per-file limit.`);
    }

    const valid = accepted.filter((file) => file.size <= MAX_FILE_SIZE);
    const created = [];
    for (const file of valid) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const record = {
        key: `${documentKey}:${stepIndex}:${id}`,
        id,
        documentKey,
        stepIndex,
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        blob: file,
        createdAt: new Date().toISOString(),
      };
      try {
        await saveAttachment(record);
        created.push({ ...record, url: URL.createObjectURL(file) });
      } catch {
        flashStep(stepIndex, "Northstar could not store one of the selected files on this device.");
      }
    }

    if (created.length) {
      setItems((current) => [...current, ...created]);
      flashStep(stepIndex, `${created.length} attachment${created.length === 1 ? "" : "s"} added to Step ${stepIndex + 1}.`);
    }
  };

  const removeFile = async (item) => {
    try {
      await deleteAttachment(item.key);
      if (item.url) URL.revokeObjectURL(item.url);
      setItems((current) => current.filter((entry) => entry.key !== item.key));
    } catch {
      flashStep(item.stepIndex, "Northstar could not remove that attachment.");
    }
  };

  if (!slots.length) return null;

  return (
    <>
      {slots.map((slot, index) => createPortal(
        <AttachmentPanel
          key={`${documentKey}-${index}`}
          stepIndex={index}
          attachments={byStep.get(index) || []}
          onAdd={addFiles}
          onRemove={removeFile}
          notice={notices[index]}
        />,
        slot,
      ))}

      <style>{`
        .wr-step-attachment-slot{grid-column:1/-1;width:100%}.wr-step-assets{margin:14px 0 2px 70px;padding-top:14px;border-top:1px solid #dbe5ed}.wr-step-assets-head{display:flex;align-items:center;justify-content:space-between;gap:14px}.wr-step-assets-head>div{min-width:0}.wr-step-assets-head span{display:flex;align-items:center;gap:7px;color:#355872;font-size:9px;font-weight:900}.wr-step-assets-head span svg{color:#0a66b7}.wr-step-assets-head em{padding:3px 6px;border-radius:999px;background:#edf4fa;color:#698196;font-size:7px;font-style:normal;font-weight:900;text-transform:uppercase;letter-spacing:.06em}.wr-step-assets-head small{display:block;margin-top:4px;color:#7b8f9f;font-size:8px;line-height:1.45}.wr-step-upload-button{display:inline-flex;align-items:center;gap:6px;min-height:34px;padding:0 11px;border:1px solid #c7d7e4;border-radius:8px;background:#fff;color:#244b68;font-size:8px;font-weight:900;white-space:nowrap}.wr-step-upload-button:hover{border-color:#7da9cc;background:#f7fbfe}.wr-step-upload-button:disabled{opacity:.45;cursor:not-allowed}.wr-step-assets-empty{width:100%;display:flex;align-items:center;gap:11px;margin-top:10px;padding:12px 14px;border:1px dashed #bfd0dd;border-radius:9px;background:#fbfdff;color:#355872;text-align:left}.wr-step-assets-empty:hover{border-color:#78a8cc;background:#f7fbfe}.wr-step-assets-empty>svg{flex:0 0 auto;color:#0a66b7}.wr-step-assets-empty span{display:block}.wr-step-assets-empty strong,.wr-step-assets-empty small{display:block}.wr-step-assets-empty strong{font-size:8px}.wr-step-assets-empty small{margin-top:3px;color:#7a8f9f;font-size:8px;font-weight:500;line-height:1.4}.wr-step-assets-notice{margin-top:9px;padding:8px 10px;border:1px solid #b9d5e8;border-radius:7px;background:#eef7fd;color:#245e85;font-size:8px;font-weight:800}.wr-step-assets-content{margin-top:10px}.wr-step-image-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}.wr-step-image-grid figure{overflow:hidden;margin:0;border:1px solid #d3dfe8;border-radius:9px;background:#fff}.wr-step-image-grid img{display:block;width:100%;height:125px;object-fit:cover;background:#edf3f7}.wr-step-image-grid figcaption{display:flex;align-items:center;gap:7px;padding:7px 8px}.wr-step-image-grid figcaption span{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#48677d;font-size:8px;font-weight:800}.wr-step-image-grid figcaption button,.wr-step-file-list button{display:grid;place-items:center;width:26px;height:26px;border:0;border-radius:6px;background:transparent;color:#8e4851}.wr-step-image-grid figcaption button:hover,.wr-step-file-list button:hover{background:#fdeef0}.wr-step-file-list{display:grid;gap:7px;margin-top:9px}.wr-step-file-list>div{display:grid;grid-template-columns:auto 1fr auto auto;align-items:center;gap:9px;padding:8px 10px;border:1px solid #d9e3ea;border-radius:8px;background:#fff}.wr-step-file-list>div>svg{color:#52728a}.wr-step-file-list span{min-width:0}.wr-step-file-list strong,.wr-step-file-list small{display:block}.wr-step-file-list strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#355872;font-size:8px}.wr-step-file-list small{margin-top:2px;color:#8293a0;font-size:7px}.wr-step-file-list a{color:#0a66b7;font-size:8px;font-weight:900;text-decoration:none}.wr-step-assets-meta{margin-top:8px;color:#8496a4;font-size:7px;text-align:right}@media(max-width:900px){.wr-step-image-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:650px){.wr-step-assets{margin-left:0}.wr-step-assets-head{align-items:stretch;flex-direction:column}.wr-step-upload-button{justify-content:center;min-height:42px}.wr-step-image-grid{grid-template-columns:1fr 1fr}.wr-step-image-grid img{height:110px}.wr-step-assets-empty{min-height:58px}.wr-step-file-list>div{grid-template-columns:auto 1fr auto}.wr-step-file-list a{display:none}}
      `}</style>
    </>
  );
}
