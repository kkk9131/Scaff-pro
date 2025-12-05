"use client";

import { GlassPanel } from "@/components/ui/GlassPanel";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { NeonButton } from "@/components/ui/NeonButton";

interface ScaleInputModalProps {
    isOpen: boolean;
    pixelDistance: number;
    onConfirm: (realDistanceMm: number) => void;
    onCancel: () => void;
}

export function ScaleInputModal({ isOpen, pixelDistance, onConfirm, onCancel }: ScaleInputModalProps) {
    const [inputValue, setInputValue] = useState("");

    const handleConfirm = () => {
        const realDistance = parseFloat(inputValue);
        if (!isNaN(realDistance) && realDistance > 0) {
            onConfirm(realDistance);
            setInputValue("");
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                onClick={onCancel}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <GlassPanel className="p-6 w-80" intensity="high">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">スケール設定</h3>
                            <button onClick={onCancel} className="text-text-muted hover:text-white">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <p className="text-sm text-text-muted">
                                選択した2点間の<span className="text-accent font-mono">実際の距離</span>を入力してください。
                            </p>

                            <div className="p-3 bg-surface-2 rounded-lg text-sm">
                                <div className="flex justify-between mb-1">
                                    <span className="text-text-muted">ピクセル距離</span>
                                    <span className="font-mono text-primary">{pixelDistance.toFixed(1)} px</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-text-muted mb-1">実距離 (mm)</label>
                                <input
                                    type="number"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="例: 1000"
                                    className="w-full px-3 py-2 bg-surface-2 border border-white/10 rounded-lg text-text-main placeholder:text-text-muted focus:outline-none focus:border-accent"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleConfirm();
                                        if (e.key === 'Escape') onCancel();
                                    }}
                                />
                            </div>

                            <div className="flex gap-2">
                                <NeonButton
                                    variant="secondary"
                                    size="md"
                                    className="flex-1 !rounded-lg"
                                    onClick={onCancel}
                                >
                                    キャンセル
                                </NeonButton>
                                <NeonButton
                                    variant="primary"
                                    size="md"
                                    className="flex-1 !rounded-lg"
                                    onClick={handleConfirm}
                                >
                                    確定
                                </NeonButton>
                            </div>
                        </div>
                    </GlassPanel>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
