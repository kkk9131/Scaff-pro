import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion, HTMLMotionProps } from "framer-motion";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface NeonButtonProps extends HTMLMotionProps<"button"> {
    variant?: "primary" | "secondary" | "accent";
    size?: "sm" | "md" | "lg";
}

export function NeonButton({
    children,
    className,
    variant = "primary",
    size = "md",
    ...props
}: NeonButtonProps) {
    const variants = {
        primary: "border-primary text-primary hover:bg-primary/10 shadow-[0_0_10px_rgba(255,107,53,0.2)] hover:shadow-[0_0_20px_rgba(255,107,53,0.5)]",
        accent: "border-accent text-accent hover:bg-accent/10 shadow-[0_0_10px_rgba(0,240,255,0.2)] hover:shadow-[0_0_20px_rgba(0,240,255,0.5)]",
        secondary: "border-surface-3 text-text-muted hover:border-text-main hover:text-text-main hover:bg-surface-3",
    };

    const sizes = {
        sm: "px-3 py-1 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
    };

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
                "relative rounded-full border transition-colors duration-300 font-medium tracking-wide flex items-center justify-center gap-2",
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {children}
        </motion.button>
    );
}
