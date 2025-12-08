import { Rnd } from "react-rnd";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { X, Maximize2, Minimize2 } from "lucide-react";
import { useState } from "react";
import { usePlanningStore } from "@/store/planningStore";

export function ReferenceViewer() {
    const { drawingUrl, drawingName } = usePlanningStore();
    const [isMinimized, setIsMinimized] = useState(false);
    const [isOpen, setIsOpen] = useState(true);

    // Don't render if no drawing is uploaded
    if (!drawingUrl) return null;
    if (!isOpen) return null;

    return (
        <Rnd
            default={{
                x: 80,
                y: 80,
                width: 400,
                height: 300,
            }}
            minWidth={200}
            minHeight={isMinimized ? 40 : 150}
            bounds="parent"
            className="z-50 pointer-events-auto"
            dragHandleClassName="drag-handle"
            enableResizing={!isMinimized}
        >
            <GlassPanel className="w-full h-full flex flex-col overflow-hidden" intensity="medium">
                {/* Header */}
                <div className="flex items-center justify-between p-2 border-b border-surface-3 bg-surface-2 drag-handle cursor-move shrink-0">
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider truncate max-w-[200px]">
                        参照: {drawingName}
                    </span>
                    <div className="flex gap-1">
                        <button
                            onClick={() => setIsMinimized(!isMinimized)}
                            className="p-1 text-text-muted hover:text-text-main rounded hover:bg-surface-3"
                        >
                            {isMinimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 text-text-muted hover:text-danger rounded hover:bg-surface-3"
                        >
                            <X size={12} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                {!isMinimized && (
                    <div className="flex-1 bg-white overflow-auto flex items-center justify-center">
                        <img
                            src={drawingUrl}
                            alt={drawingName || "Drawing"}
                            className="max-w-full max-h-full object-contain"
                            draggable={false}
                        />
                    </div>
                )}
            </GlassPanel>
        </Rnd>
    );
}
