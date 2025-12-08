"use client";

import { useState, useCallback } from "react";
import { Rnd } from "react-rnd";
import { X, Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { usePlanningStore, DRAWING_TYPE_LABELS, FLOOR_COLORS, DrawingFile } from "@/store/planningStore";

interface FloatingViewerProps {
    drawing: DrawingFile;
    index: number;
    onClose: () => void;
}

function FloatingViewer({ drawing, index, onClose }: FloatingViewerProps) {
    const [isMinimized, setIsMinimized] = useState(false);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Stagger window positions
    const defaultX = 100 + (index % 3) * 50;
    const defaultY = 100 + (index % 3) * 50;

    const handleZoomIn = () => setScale((s) => Math.min(s * 1.2, 5));
    const handleZoomOut = () => setScale((s) => Math.max(s / 1.2, 0.2));
    const handleReset = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setScale((s) => Math.max(0.2, Math.min(s * delta, 5)));
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return;
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }, [position]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
        });
    }, [isDragging, dragStart]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Title with type and floor
    const title = `${DRAWING_TYPE_LABELS[drawing.type]}${drawing.type === 'plan' && drawing.floor ? ` ${drawing.floor}F` : ''}`;
    const floorColor = drawing.type === 'plan' && drawing.floor ? FLOOR_COLORS[drawing.floor] || '#6366f1' : null;

    return (
        <Rnd
            default={{
                x: defaultX,
                y: defaultY,
                width: 450,
                height: 350,
            }}
            minWidth={280}
            minHeight={isMinimized ? 44 : 200}
            bounds="parent"
            className="z-50 pointer-events-auto"
            dragHandleClassName="drag-handle"
            enableResizing={!isMinimized}
        >
            <GlassPanel className="w-full h-full flex flex-col overflow-hidden shadow-xl" intensity="high">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-surface-3 bg-surface-2/80 drag-handle cursor-move shrink-0">
                    <div className="flex items-center gap-2">
                        {floorColor && (
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: floorColor }}
                            />
                        )}
                        <span className="text-sm font-bold truncate max-w-[200px]">
                            {title}
                        </span>
                        <span className="text-xs text-text-muted truncate max-w-[100px]">
                            {drawing.name}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIsMinimized(!isMinimized)}
                            className="p-1.5 text-text-muted hover:text-text-main rounded hover:bg-surface-3 transition-colors"
                        >
                            {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-text-muted hover:text-danger rounded hover:bg-danger/10 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                {!isMinimized && (
                    <div className="flex items-center gap-1 px-2 py-1 border-b border-surface-3 bg-surface-2/50 shrink-0">
                        <button
                            onClick={handleZoomOut}
                            className="p-1 rounded hover:bg-surface-3 text-text-muted hover:text-text-main transition-colors"
                            title="縮小"
                        >
                            <ZoomOut size={14} />
                        </button>
                        <span className="text-xs text-text-muted w-12 text-center font-mono">
                            {Math.round(scale * 100)}%
                        </span>
                        <button
                            onClick={handleZoomIn}
                            className="p-1 rounded hover:bg-surface-3 text-text-muted hover:text-text-main transition-colors"
                            title="拡大"
                        >
                            <ZoomIn size={14} />
                        </button>
                        <div className="w-px h-4 bg-surface-3 mx-1" />
                        <button
                            onClick={handleReset}
                            className="p-1 rounded hover:bg-surface-3 text-text-muted hover:text-text-main transition-colors"
                            title="リセット"
                        >
                            <RotateCcw size={14} />
                        </button>
                    </div>
                )}

                {/* Content */}
                {!isMinimized && (
                    <div
                        className="flex-1 overflow-hidden bg-surface-1 relative cursor-grab active:cursor-grabbing"
                        onWheel={handleWheel}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        <div
                            className="absolute inset-0 flex items-center justify-center"
                            style={{
                                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                                transformOrigin: 'center center',
                            }}
                        >
                            <img
                                src={drawing.url}
                                alt={drawing.name}
                                className="max-w-none select-none"
                                draggable={false}
                            />
                        </div>
                    </div>
                )}
            </GlassPanel>
        </Rnd>
    );
}

export function FloatingDrawingViewers() {
    const { drawings, openDrawingTabs, closeDrawingTab } = usePlanningStore();

    // Get drawings that are open as tabs
    const openDrawings = openDrawingTabs
        .map((id) => drawings.find((d) => d.id === id))
        .filter((d): d is DrawingFile => d !== undefined);

    if (openDrawings.length === 0) return null;

    return (
        <>
            {openDrawings.map((drawing, index) => (
                <FloatingViewer
                    key={drawing.id}
                    drawing={drawing}
                    index={index}
                    onClose={() => closeDrawingTab(drawing.id)}
                />
            ))}
        </>
    );
}
