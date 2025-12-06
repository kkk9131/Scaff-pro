import { GlassPanel } from "@/components/ui/GlassPanel";
import { MousePointer2, Move, PenTool, Eraser, Ruler, Type, Magnet } from "lucide-react";
import { clsx } from "clsx";
import { motion } from "framer-motion";
import { usePlanningStore, type ToolType } from "@/store/planningStore";

export function ToolPalette() {
    const { currentTool, setCurrentTool, setIsSettingScale, isGridSnapEnabled, toggleGridSnap } = usePlanningStore();

    const tools: { id: ToolType; icon: typeof MousePointer2; label: string }[] = [
        { id: "select", icon: MousePointer2, label: "選択" },
        { id: "move", icon: Move, label: "移動" },
        { id: "polyline", icon: PenTool, label: "ポリライン" },
        { id: "scale", icon: Ruler, label: "スケール設定" },
        { id: "text", icon: Type, label: "テキスト" },
        { id: "erase", icon: Eraser, label: "削除" },
    ];

    const handleToolChange = (toolId: ToolType) => {
        setCurrentTool(toolId);
        if (toolId === 'scale') {
            setIsSettingScale(true);
        }
    };

    return (
        <GlassPanel className="flex flex-col gap-2 p-2 w-14 items-center">
            {tools.map((tool) => (
                <button
                    key={tool.id}
                    onClick={() => handleToolChange(tool.id)}
                    className={clsx(
                        "relative p-2.5 rounded-lg transition-all duration-200 group",
                        currentTool === tool.id
                            ? "text-primary bg-primary/10 shadow-[0_0_8px_var(--primary-glow)]"
                            : "text-text-muted hover:text-text-main hover:bg-surface-2"
                    )}
                    title={tool.label}
                >
                    <tool.icon size={20} strokeWidth={currentTool === tool.id ? 2.5 : 2} />

                    {/* Active Indicator Line */}
                    {currentTool === tool.id && (
                        <motion.div
                            layoutId="activeToolIndicator"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-r-full"
                        />
                    )}

                    {/* Tooltip */}
                    <span className="absolute left-full ml-3 px-2 py-1 bg-surface-2 border border-surface-3 rounded text-xs text-text-main opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-md">
                        {tool.label}
                    </span>
                </button>
            ))}

            {/* Separator */}
            <div className="w-8 h-[1px] bg-surface-3 my-1" />

            {/* Grid Snap Toggle */}
            <button
                onClick={toggleGridSnap}
                className={clsx(
                    "relative p-2.5 rounded-lg transition-all duration-200 group",
                    isGridSnapEnabled
                        ? "text-primary bg-primary/10 shadow-[0_0_8px_var(--primary-glow)]"
                        : "text-text-muted hover:text-text-main hover:bg-surface-2"
                )}
                title="グリッド吸着 (ON/OFF)"
            >
                <Magnet size={20} strokeWidth={isGridSnapEnabled ? 2.5 : 2} />

                {/* Active Dot for Toggle */}
                {isGridSnapEnabled && (
                    <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_4px_var(--primary-glow)]" />
                )}

                {/* Tooltip */}
                <span className="absolute left-full ml-3 px-2 py-1 bg-surface-2 border border-surface-3 rounded text-xs text-text-main opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-md">
                    グリッド吸着 {isGridSnapEnabled ? 'ON' : 'OFF'}
                </span>
            </button>
        </GlassPanel>
    );
}
