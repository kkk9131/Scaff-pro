import { GlassPanel } from "@/components/ui/GlassPanel";
import { useState } from "react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Layers, Calculator, MessageSquare } from "lucide-react";

// Mock Content Components
const BuildingTab = () => (
    <div className="space-y-4 p-1">
        <div className="space-y-2">
            <label className="text-xs text-text-muted uppercase font-bold tracking-wider">Drawing Info</label>
            <div className="p-3 bg-surface-2 rounded-lg border border-white/5 text-sm space-y-2">
                <div className="flex justify-between">
                    <span className="text-text-muted">Scale</span>
                    <span className="font-mono text-accent">1 : 100</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-text-muted">File</span>
                    <span>Plan_1F.pdf</span>
                </div>
            </div>
        </div>

        <div className="space-y-2">
            <label className="text-xs text-text-muted uppercase font-bold tracking-wider">Height Settings</label>
            <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-surface-2 rounded border border-white/5">
                    <div className="text-[10px] text-text-muted">Floor Height</div>
                    <div className="font-mono">2,800</div>
                </div>
                <div className="p-2 bg-surface-2 rounded border border-white/5">
                    <div className="text-[10px] text-text-muted">Total Height</div>
                    <div className="font-mono">8,400</div>
                </div>
            </div>
        </div>
    </div>
);

const ScaffoldTab = () => (
    <div className="text-sm text-text-muted p-2">Scaffold Settings Placeholder</div>
);
const QuantityTab = () => (
    <div className="text-sm text-text-muted p-2">Quantity Table Placeholder</div>
);
const ChatTab = () => (
    <div className="text-sm text-text-muted p-2">AI Chat Placeholder</div>
);

export function SidePanel() {
    const [activeTab, setActiveTab] = useState<"building" | "scaffold" | "quantity" | "chat">("building");

    const tabs = [
        { id: "building", icon: Building2, label: "Building" },
        { id: "scaffold", icon: Layers, label: "Scaffold" },
        { id: "quantity", icon: Calculator, label: "Quantity" },
        { id: "chat", icon: MessageSquare, label: "Chat" },
    ] as const;

    return (
        <GlassPanel className="flex flex-col h-full overflow-hidden" intensity="high">
            {/* Tab Header */}
            <div className="flex border-b border-white/5">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={clsx(
                            "flex-1 py-3 flex justify-center items-center text-text-muted hover:bg-white/5 transition-colors relative",
                            activeTab === tab.id && "text-primary"
                        )}
                        title={tab.label}
                    >
                        <tab.icon size={18} />
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeSideTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <h2 className="text-lg font-bold mb-4 capitalize">{tabs.find(t => t.id === activeTab)?.label}</h2>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === "building" && <BuildingTab />}
                        {activeTab === "scaffold" && <ScaffoldTab />}
                        {activeTab === "quantity" && <QuantityTab />}
                        {activeTab === "chat" && <ChatTab />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </GlassPanel>
    );
}
