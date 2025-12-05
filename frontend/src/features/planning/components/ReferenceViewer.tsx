import { Rnd } from "react-rnd";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { X, Minus } from "lucide-react";
import { useState } from "react";

export function ReferenceViewer() {
    const [isOpen, setIsOpen] = useState(true);

    if (!isOpen) return null;

    return (
        <Rnd
            default={{
                x: 100,
                y: 100,
                width: 320,
                height: 240,
            }}
            minWidth={200}
            minHeight={150}
            bounds="parent"
            className="z-50 pointer-events-auto"
            dragHandleClassName="drag-handle"
        >
            <GlassPanel className="w-full h-full flex flex-col overflow-hidden" intensity="medium">
                <div className="flex items-center justify-between p-2 border-b border-white/10 bg-white/5 drag-handle cursor-move">
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Reference: Plan_1F.pdf</span>
                    <div className="flex gap-2">
                        <button onClick={() => setIsOpen(false)} className="text-text-muted hover:text-white"><Minus size={14} /></button>
                        <button onClick={() => setIsOpen(false)} className="text-text-muted hover:text-danger"><X size={14} /></button>
                    </div>
                </div>
                <div className="flex-1 bg-black/50 flex items-center justify-center text-text-muted text-xs">
                    {/* Placeholder for PDF/Image */}
                    [PDF Viewer / Image Content]
                </div>
            </GlassPanel>
        </Rnd>
    );
}
