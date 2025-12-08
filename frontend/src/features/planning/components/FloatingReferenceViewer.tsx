'use client';

import React, { useState, useCallback } from 'react';
import { Rnd } from 'react-rnd';
import { usePlanningStore } from '@/store/planningStore';
import { XIcon, ZoomInIcon, ZoomOutIcon, ImageIcon } from '@/components/icons';

export function FloatingReferenceViewer() {
  const {
    referenceViewer,
    setReferenceViewerVisible,
    updateReferenceViewerPosition,
    updateReferenceViewerSize,
    drawings,
  } = usePlanningStore();

  const [imageScale, setImageScale] = useState(1);
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedDrawing, setSelectedDrawing] = useState(0);

  // Demo drawing for preview
  const hasDrawings = drawings.length > 0;

  const handleZoom = useCallback((direction: 'in' | 'out') => {
    setImageScale((prev) => {
      const factor = direction === 'in' ? 1.2 : 0.8;
      return Math.max(0.1, Math.min(5, prev * factor));
    });
  }, []);

  const handleImageMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDraggingImage(true);
      setDragStart({ x: e.clientX - imageOffset.x, y: e.clientY - imageOffset.y });
    }
  }, [imageOffset]);

  const handleImageMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDraggingImage) {
      setImageOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDraggingImage, dragStart]);

  const handleImageMouseUp = useCallback(() => {
    setIsDraggingImage(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    handleZoom(e.deltaY < 0 ? 'in' : 'out');
  }, [handleZoom]);

  if (!referenceViewer.visible) return null;

  return (
    <Rnd
      default={{
        x: referenceViewer.x,
        y: referenceViewer.y,
        width: referenceViewer.width,
        height: referenceViewer.height,
      }}
      minWidth={280}
      minHeight={200}
      bounds="parent"
      onDragStop={(_, d) => updateReferenceViewerPosition(d.x, d.y)}
      onResizeStop={(_, __, ref, ___, position) => {
        updateReferenceViewerSize(ref.offsetWidth, ref.offsetHeight);
        updateReferenceViewerPosition(position.x, position.y);
      }}
      dragHandleClassName="drag-handle"
      className="z-50"
    >
      <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900/95 shadow-2xl backdrop-blur-xl">
        {/* Header - Drag handle */}
        <div className="drag-handle flex h-10 cursor-move items-center justify-between border-b border-zinc-800 bg-zinc-800/50 px-3">
          <div className="flex items-center gap-2">
            <ImageIcon size={14} className="text-zinc-400" />
            <span className="text-xs font-medium text-zinc-300">Reference Drawing</span>
          </div>
          <div className="flex items-center gap-1">
            {/* Zoom controls */}
            <button
              onClick={() => handleZoom('out')}
              className="flex h-6 w-6 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
              title="Zoom Out"
            >
              <ZoomOutIcon size={14} />
            </button>
            <span className="min-w-[40px] text-center text-xs font-mono text-zinc-500">
              {Math.round(imageScale * 100)}%
            </span>
            <button
              onClick={() => handleZoom('in')}
              className="flex h-6 w-6 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
              title="Zoom In"
            >
              <ZoomInIcon size={14} />
            </button>
            <div className="mx-1 h-4 w-px bg-zinc-700" />
            <button
              onClick={() => setReferenceViewerVisible(false)}
              className="flex h-6 w-6 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-red-500/20 hover:text-red-400"
              title="Close"
            >
              <XIcon size={14} />
            </button>
          </div>
        </div>

        {/* Drawing selector tabs */}
        {hasDrawings && drawings.length > 1 && (
          <div className="flex border-b border-zinc-800 bg-zinc-800/30">
            {drawings.map((drawing, index) => (
              <button
                key={drawing.id}
                onClick={() => setSelectedDrawing(index)}
                className={`px-3 py-1.5 text-xs transition-colors ${
                  selectedDrawing === index
                    ? 'border-b-2 border-blue-500 text-blue-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {drawing.name}
              </button>
            ))}
          </div>
        )}

        {/* Image viewer area */}
        <div
          className="relative flex-1 cursor-grab overflow-hidden bg-zinc-950 active:cursor-grabbing"
          onMouseDown={handleImageMouseDown}
          onMouseMove={handleImageMouseMove}
          onMouseUp={handleImageMouseUp}
          onMouseLeave={handleImageMouseUp}
          onWheel={handleWheel}
        >
          {hasDrawings ? (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `translate(${imageOffset.x}px, ${imageOffset.y}px) scale(${imageScale})`,
                transformOrigin: 'center',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={drawings[selectedDrawing]?.url || '/placeholder-drawing.png'}
                alt="Reference Drawing"
                className="max-h-full max-w-full object-contain"
                draggable={false}
              />
            </div>
          ) : (
            /* Placeholder when no drawings */
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-3 rounded-full bg-zinc-800 p-4">
                <ImageIcon size={24} className="text-zinc-600" />
              </div>
              <p className="text-sm font-medium text-zinc-400">No Drawing Uploaded</p>
              <p className="mt-1 text-xs text-zinc-600">
                Upload a drawing from the Building tab
              </p>
            </div>
          )}

          {/* Grid overlay hint */}
          {hasDrawings && (
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]" />
          )}
        </div>

        {/* Footer info */}
        <div className="flex h-7 items-center justify-between border-t border-zinc-800 bg-zinc-800/30 px-3 text-xs text-zinc-500">
          <span>Drag to pan, scroll to zoom</span>
          {hasDrawings && drawings[selectedDrawing] && (
            <span>{drawings[selectedDrawing].type === 'plan' ? 'Plan View' : 'Elevation View'}</span>
          )}
        </div>
      </div>
    </Rnd>
  );
}
