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
        low: "bg-glass-bg/40 backdrop-blur-sm",
        medium: "bg-glass-bg backdrop-blur-md",
        high: "bg-glass-bg/80 backdrop-blur-lg",
    };

    return (
        <motion.div
            className={cn(
                "rounded-xl border border-glass-border shadow-lg",
                intensityMap[intensity],
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
}
