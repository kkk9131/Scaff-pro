import { GlassPanel } from "@/components/ui/GlassPanel";
import { MousePointer2, Move, PenTool, Eraser, Ruler, Type } from "lucide-react";
import { clsx } from "clsx";
import { motion } from "framer-motion";
import { usePlanningStore, type ToolType } from "@/store/planningStore";

export function ToolPalette() {
    const { currentTool, setCurrentTool, setIsSettingScale } = usePlanningStore();

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
                            ? "text-primary bg-primary/10 shadow-[0_0_8px_rgba(255,107,53,0.3)]"
                            : "text-text-muted hover:text-text-main hover:bg-white/5"
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
                    <span className="absolute left-full ml-3 px-2 py-1 bg-surface-2 border border-white/10 rounded text-xs text-text-main opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                        {tool.label}
                    </span>
                </button>
            ))}
        </GlassPanel>
    );
}
