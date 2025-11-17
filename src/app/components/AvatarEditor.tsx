'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Props {
  open: boolean;
  src: string | null | undefined;
  onClose: () => void;
  onApply: (dataUrl: string) => void;
}

export const AvatarEditor: React.FC<Props> = ({ open, src, onClose, onApply }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(0.5);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // load image and compute a good default scale so the image fits the crop circle
    setImageSrc(src ?? null);
    setPos({ x: 0, y: 0 });

    if (!src) {
      setScale(1);
      setMinScale(0.5);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const cont = containerRef.current;
      const contRect = cont?.getBoundingClientRect();
      const contW = contRect?.width ?? 256;
      const contH = contRect?.height ?? 256;

      // store natural image size
      setImgSize({ w: img.width, h: img.height });

      // compute scale so the image covers the container without unnecessary zoom
      const fitScale = Math.max(contW / img.width, contH / img.height);
      setMinScale(fitScale);
      // set initial scale to fitScale (so image isn't pre-zoomed past necessary)
      setScale(fitScale);
      // reset position
      setPos({ x: 0, y: 0 });
    };
    img.src = src ?? '';
  }, [src, open]);

  useEffect(() => {
    // reset when closed
    if (!open) {
      setIsDragging(false);
      dragStart.current = null;
    }
  }, [open]);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart.current) return;
    setPos({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };

  const onMouseUp = () => {
    setIsDragging(false);
    dragStart.current = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY / 500; // smooth zoom
    setScale((s) => Math.min(3, Math.max(minScale, +(s + delta).toFixed(3))));
  };

  const applyCrop = async () => {
    if (!imageSrc) return;
    const canvasSize = 512; // square output
    const canvas = document.createElement('canvas');
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    await new Promise((res) => (img.onload = res));

    const container = containerRef.current;
    const contRect = container?.getBoundingClientRect();

    // use the rendered image size (including CSS scale) for accurate mapping
    const imgEl = imgRef.current;
    const imgRect = imgEl?.getBoundingClientRect();

    const contW = contRect?.width || canvasSize;
    const contH = contRect?.height || canvasSize;
    const Sx = canvasSize / contW;
    const Sy = canvasSize / contH;

    const cx = canvasSize / 2 + pos.x * Sx;
    const cy = canvasSize / 2 + pos.y * Sy;

    const drawW = (imgRect?.width ?? (img.width * scale)) * Sx;
    const drawH = (imgRect?.height ?? (img.height * scale)) * Sy;

  // clear to transparent and draw the image so the exported PNG has no unexpected bars
  ctx.clearRect(0, 0, canvasSize, canvasSize);
  ctx.drawImage(img, cx - drawW / 2, cy - drawH / 2, drawW, drawH);

    const dataUrl = canvas.toDataURL('image/png');
    onApply(dataUrl);
    onClose();
  };

  const onFileChange = async (f: File | null) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setImageSrc(typeof reader.result === 'string' ? reader.result : null);
    reader.readAsDataURL(f);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-80 pointer-events-auto w-[94%] max-w-2xl bg-[#070708]/95 border border-white/6 rounded-2xl p-6 shadow-[0_30px_80px_rgba(0,0,0,0.8)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Edit Avatar</h3>
          <button onClick={onClose} className="text-gray-300 px-2">×</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="w-full h-72 bg-transparent rounded-lg flex items-center justify-center">
              <div
                ref={containerRef}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                onWheel={onWheel}
                className="w-64 h-64 rounded-full overflow-hidden relative cursor-grab bg-black/10 flex items-center justify-center"
              >
                {/* circular crop area */}
                {imageSrc ? (
                  <img
                    ref={imgRef}
                    src={imageSrc}
                    alt="avatar-edit"
                    draggable={false}
                    style={{
                        // position the image centered then offset by pos and scale from that center
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        width: imgSize.w ? `${imgSize.w}px` : 'auto',
                        height: imgSize.h ? `${imgSize.h}px` : 'auto',
                        transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px)) scale(${scale})`,
                        transformOrigin: 'center center'
                      }}
                    className="select-none"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">No image</div>
                )}

                {/* circular border */}
                <div className="pointer-events-none absolute inset-0 rounded-full border-2 border-white/10" />
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <label className="px-3 py-2 bg-black/30 rounded-md border border-white/6 cursor-pointer text-sm">
                Upload
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onFileChange(e.target.files?.[0] ?? null)} />
              </label>
              <input
                type="text"
                placeholder="Paste image URL"
                className="flex-1 bg-black/20 px-3 py-2 rounded-md border border-white/6 text-white text-sm"
                onBlur={(e) => setImageSrc(e.target.value)}
              />
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-300 mb-2">Zoom</div>
            <input type="range" min={minScale} max={3} step={0.01} value={scale} onChange={(e) => setScale(Number(e.target.value))} className="w-full" />

            <div className="mt-4 text-sm text-gray-300 mb-2">Position</div>
            <div className="text-xs text-gray-400">Drag the image inside the box or use the zoom slider. Mouse wheel also zooms.</div>

            <div className="mt-6 flex gap-2">
              <button onClick={applyCrop} className="flex-1 py-2 rounded-md bg-white/10">Apply</button>
              <button onClick={() => { setScale(minScale); setPos({ x: 0, y: 0 }); }} className="py-2 px-3 rounded-md bg-black/20 border border-white/6">Reset</button>
              <button onClick={onClose} className="flex-1 py-2 rounded-md bg-black/30 border border-white/6">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarEditor;
