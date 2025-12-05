import { GlassPanel } from "@/components/ui/GlassPanel";
import { ViewSwitcher } from "../components/ViewSwitcher";
import { NeonButton } from "@/components/ui/NeonButton";
import { Maximize2, Save, ArrowLeft } from "lucide-react";
import React from "react";

interface PlanningLayoutProps {
    children: React.ReactNode;
    toolPalette: React.ReactNode;
    sidePanel: React.ReactNode;
    referenceViewer?: React.ReactNode;
    currentView: "2D" | "3D" | "ISO" | "PERSP";
    onViewChange: (view: "2D" | "3D" | "ISO" | "PERSP") => void;
}

export function PlanningLayout({
    children,
    toolPalette,
    sidePanel,
    referenceViewer,
    currentView,
    onViewChange
}: PlanningLayoutProps) {

    return (
        <div className="relative w-screen h-screen bg-surface-1 bg-dot-grid overflow-hidden text-text-main selection:bg-primary/30">
            {/* Header */}
            <header className="absolute top-0 left-0 right-0 h-16 px-6 flex items-center justify-between z-50 pointer-events-none">
                {/* Left: Branding & Back */}
                <div className="flex items-center gap-4 pointer-events-auto">
                    <button className="p-2 hover:bg-white/5 rounded-full transition-colors text-text-muted hover:text-text-main">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">Project: New Residence 2024</h1>
                        <span className="text-xs text-text-muted uppercase tracking-wider">Scaffold Planning // Phase 1</span>
                    </div>
                </div>

                {/* Center: View Switcher */}
                <div className="pointer-events-auto shadow-lg">
                    <ViewSwitcher currentView={currentView} onChange={onViewChange} />
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3 pointer-events-auto">
                    <NeonButton size="sm" variant="secondary" className="!rounded-lg backdrop-blur-md bg-black/30">
                        <Maximize2 size={16} />
                    </NeonButton>
                    <NeonButton size="sm" variant="primary" className="!px-6">
                        <Save size={16} /> Save
                    </NeonButton>
                </div>
            </header>

            {/* Main Canvas Area */}
            <main className="absolute inset-0 z-0">
                {children}
            </main>

            {/* Floating UI Layers */}
            <div className="absolute inset-0 z-40 pointer-events-none">
                {/* Left: Tool Palette */}
                <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-auto">
                    {toolPalette}
                </div>

                {/* Right: Side Panel */}
                <div className="absolute right-6 top-20 bottom-6 w-80 pointer-events-auto flex flex-col">
                    {sidePanel}
                </div>

                {/* Floating Windows */}
                <div className="absolute inset-0 pointer-events-none">
                    {referenceViewer}
                </div>
            </div>
        </div>
    );
}
