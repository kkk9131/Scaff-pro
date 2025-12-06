import { motion } from "framer-motion";
import { clsx } from "clsx";

interface ViewSwitcherProps {
    currentView: "2D" | "3D" | "ISO" | "PERSP";
    onChange: (view: "2D" | "3D" | "ISO" | "PERSP") => void;
}

export function ViewSwitcher({ currentView, onChange }: ViewSwitcherProps) {
    const views = [
        { id: "2D", label: "PLAN" },
        { id: "3D", label: "3D" },
        { id: "ISO", label: "ISO" },
        { id: "PERSP", label: "PERSP" },
    ] as const;

    return (
        <div className="flex bg-surface-1/80 backdrop-blur-md rounded-lg p-1 border border-surface-3/50 shadow-sm">
            {views.map((view) => (
                <button
                    key={view.id}
                    onClick={() => onChange(view.id)}
                    className={clsx(
                        "relative px-4 py-1.5 text-xs font-bold transition-colors z-10",
                        currentView === view.id ? "text-white" : "text-text-muted hover:text-text-main"
                    )}
                >
                    {currentView === view.id && (
                        <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 bg-primary rounded-md -z-10 shadow-[0_0_15px_var(--primary-glow)]"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                    )}
                    {view.label}
                </button>
            ))}
        </div>
    );
}
