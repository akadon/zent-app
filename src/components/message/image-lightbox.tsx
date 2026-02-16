"use client";

import { useState, useEffect } from "react";
import { X, Download, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

interface ImageLightboxProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") setScale((s) => Math.min(s + 0.25, 5));
      if (e.key === "-") setScale((s) => Math.max(s - 0.25, 0.25));
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = src;
    a.download = alt || "image";
    a.click();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      {/* Toolbar */}
      <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-background-floating/90 px-3 py-2 shadow-lg">
        <button
          onClick={(e) => { e.stopPropagation(); setScale((s) => Math.min(s + 0.25, 5)); }}
          className="rounded p-1 text-text-muted hover:text-text-normal"
          title="Zoom In"
        >
          <ZoomIn size={18} />
        </button>
        <span className="min-w-[3rem] text-center text-xs text-text-muted">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); setScale((s) => Math.max(s - 0.25, 0.25)); }}
          className="rounded p-1 text-text-muted hover:text-text-normal"
          title="Zoom Out"
        >
          <ZoomOut size={18} />
        </button>
        <div className="mx-1 h-4 w-px bg-background-tertiary" />
        <button
          onClick={(e) => { e.stopPropagation(); setRotation((r) => r + 90); }}
          className="rounded p-1 text-text-muted hover:text-text-normal"
          title="Rotate"
        >
          <RotateCw size={18} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleDownload(); }}
          className="rounded p-1 text-text-muted hover:text-text-normal"
          title="Download"
        >
          <Download size={18} />
        </button>
        <div className="mx-1 h-4 w-px bg-background-tertiary" />
        <button
          onClick={onClose}
          className="rounded p-1 text-text-muted hover:text-text-normal"
          title="Close"
        >
          <X size={18} />
        </button>
      </div>

      {/* Image */}
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] max-w-[90vw] cursor-grab object-contain transition-transform duration-200"
        style={{
          transform: `scale(${scale}) rotate(${rotation}deg)`,
        }}
        draggable={false}
      />
    </div>
  );
}
