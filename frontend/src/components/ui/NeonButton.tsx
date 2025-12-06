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
        primary: "bg-primary text-white border-transparent hover:bg-primary/90 shadow-[0_4px_14px_0_var(--primary-glow)] hover:shadow-[0_6px_20px_var(--primary-glow)] hover:-translate-y-0.5",
        accent: "bg-accent text-white border-transparent hover:bg-accent/90 shadow-[0_4px_14px_0_var(--accent-glow)] hover:shadow-[0_6px_20px_var(--accent-glow)] hover:-translate-y-0.5",
        secondary: "bg-surface-1 border-surface-3 text-text-muted hover:border-primary hover:text-primary hover:bg-surface-2 shadow-sm hover:shadow-md",
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
