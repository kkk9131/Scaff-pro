import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion, HTMLMotionProps } from "framer-motion";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface GlassPanelProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
    intensity?: "low" | "medium" | "high";
}

export function GlassPanel({
    children,
    className,
    intensity = "medium",
    ...props
}: GlassPanelProps) {
    const intensityMap = {
        low: "bg-surface-1/60 backdrop-blur-md",
        medium: "bg-surface-1/80 backdrop-blur-lg",
        high: "bg-surface-1/95 backdrop-blur-xl",
    };

    return (
        <motion.div
            className={cn(
                "rounded-xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.04)]",
                intensityMap[intensity],
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
}
