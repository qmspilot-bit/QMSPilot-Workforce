"use client";

import { ScanLine, X } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { ScanResult } from "./shared";

function parseCode(raw: string): ScanResult {
  const text = raw.trim();
  const fields: Record<string, string> = {};
  try { const object = JSON.parse(text); if (object && typeof object === "object") Object.entries(object).forEach(([key, value]) => { fields[key] = String(value); }); } catch {}
  if (!Object.keys(fields).length) { try { const url = new URL(text); url.searchParams.forEach((value, key) => { fields[key] = value; }); } catch {} }
  if (!Object.keys(fields).length && /[=:|;\n]/.test(text)) text.split(/[|;\n]+/).forEach((part) => { const match = part.match(/^\s*([^:=]+)\s*[:=]\s*(.+)\s*$/); if (match) fields[match[1].trim()] = match[2].trim(); });
  return { raw: text, fields };
}

export function ScannerModal({ onClose, onResult }: { onClose: () => void; onResult: (result: ScanResult) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timer = useRef<number | null>(null);
  const [manual, setManual] = useState("");
  const [status, setStatus] = useState("Starting camera…");
  useEffect(() => {
    let active = true;
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } });
        if (!active) return;
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
        const Detector = (window as unknown as { BarcodeDetector?: new (options: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
        if (!Detector) { setStatus("Live detection is not supported by this browser. Use manual or handheld-scanner input below."); return; }
        const detector = new Detector({ formats: ["qr_code", "code_128", "code_39", "ean_13", "ean_8", "upc_a", "upc_e", "data_matrix"] });
        setStatus("Point the camera at a barcode or QR code");
        timer.current = window.setInterval(async () => { try { if (!videoRef.current) return; const codes = await detector.detect(videoRef.current); if (codes?.[0]?.rawValue) onResult(parseCode(codes[0].rawValue)); } catch {} }, 500);
      } catch { setStatus("Camera access was unavailable. Use manual or handheld-scanner input below."); }
    };
    start();
    return () => { active = false; if (timer.current) window.clearInterval(timer.current); streamRef.current?.getTracks().forEach((track) => track.stop()); };
  }, [onResult]);
  return <div className="workflow-modal" role="dialog" aria-modal="true"><div className="workflow-modal-card"><div className="workflow-modal-head"><div><small>SMART CAPTURE</small><h2>Scan barcode or QR code</h2></div><button onClick={onClose}><X /></button></div><div className="scanner-view"><video ref={videoRef} muted playsInline /><div className="scan-frame" /></div><p className="scanner-status"><ScanLine size={16} />{status}</p><label>Manual or handheld-scanner input<input autoFocus value={manual} onChange={(event) => setManual(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && manual.trim()) onResult(parseCode(manual)); }} placeholder="Scan with a USB scanner or type the code" /></label><div className="modal-actions"><button onClick={onClose}>Cancel</button><button className="primary" disabled={!manual.trim()} onClick={() => onResult(parseCode(manual))}>Use code</button></div></div></div>;
}

export function SignatureModal({ onClose, onSave }: { onClose: () => void; onSave: (url: string, size: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const point = (event: ReactPointerEvent<HTMLCanvasElement>) => { const canvas = canvasRef.current!; const rect = canvas.getBoundingClientRect(); return { x: (event.clientX - rect.left) * (canvas.width / rect.width), y: (event.clientY - rect.top) * (canvas.height / rect.height) }; };
  const down = (event: ReactPointerEvent<HTMLCanvasElement>) => { drawing.current = true; const position = point(event); const context = canvasRef.current!.getContext("2d")!; context.beginPath(); context.moveTo(position.x, position.y); event.currentTarget.setPointerCapture(event.pointerId); };
  const move = (event: ReactPointerEvent<HTMLCanvasElement>) => { if (!drawing.current) return; const position = point(event); const context = canvasRef.current!.getContext("2d")!; context.lineWidth = 3; context.lineCap = "round"; context.strokeStyle = "#092b4d"; context.lineTo(position.x, position.y); context.stroke(); };
  const clear = () => canvasRef.current?.getContext("2d")?.clearRect(0, 0, 900, 260);
  const save = () => canvasRef.current?.toBlob((blob) => { if (blob) onSave(URL.createObjectURL(blob), blob.size); }, "image/png");
  return <div className="workflow-modal" role="dialog" aria-modal="true"><div className="workflow-modal-card signature-card"><div className="workflow-modal-head"><div><small>HUMAN AUTHORIZATION</small><h2>Electronic signature evidence</h2></div><button onClick={onClose}><X /></button></div><p>Sign inside the box. The signature becomes evidence on this controlled record and does not replace the customer’s required authorization rules.</p><canvas ref={canvasRef} width={900} height={260} onPointerDown={down} onPointerMove={move} onPointerUp={() => { drawing.current = false; }} onPointerCancel={() => { drawing.current = false; }} /><div className="modal-actions"><button onClick={clear}>Clear</button><button onClick={onClose}>Cancel</button><button className="primary" onClick={save}>Attach signature</button></div></div></div>;
}
