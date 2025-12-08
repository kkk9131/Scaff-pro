"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, FileImage, Trash2, Check, Loader2 } from "lucide-react";
import { usePlanningStore, DrawingFileType, DRAWING_TYPE_LABELS, FLOOR_COLORS } from "@/store/planningStore";
import { NeonButton } from "@/components/ui/NeonButton";

interface PendingFile {
    file: File;
    preview: string;
    type: DrawingFileType;
    floor?: number;
}

export function DrawingImportDialog() {
    const {
        drawingImportOpen,
        setDrawingImportOpen,
        addDrawing,
        updateDrawingStatus,
        building,
    } = usePlanningStore();

    const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
    const [selectedType, setSelectedType] = useState<DrawingFileType>('plan');
    const [selectedFloor, setSelectedFloor] = useState<number>(1);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const drawingTypes: DrawingFileType[] = ['plan', 'elevation', 'roof-plan', 'site-survey'];

    const handleFileSelect = useCallback((files: FileList | null) => {
        if (!files) return;

        const newPendingFiles: PendingFile[] = [];
        Array.from(files).forEach((file) => {
            if (file.type.startsWith('image/') || file.type === 'application/pdf') {
                const preview = URL.createObjectURL(file);
                newPendingFiles.push({
                    file,
                    preview,
                    type: selectedType,
                    floor: selectedType === 'plan' ? selectedFloor : undefined,
                });
            }
        });

        setPendingFiles((prev) => [...prev, ...newPendingFiles]);
    }, [selectedType, selectedFloor]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileSelect(e.dataTransfer.files);
    }, [handleFileSelect]);

    const handleRemoveFile = useCallback((index: number) => {
        setPendingFiles((prev) => {
            const newFiles = [...prev];
            URL.revokeObjectURL(newFiles[index].preview);
            newFiles.splice(index, 1);
            return newFiles;
        });
    }, []);

    const handleUpdateFileType = useCallback((index: number, type: DrawingFileType) => {
        setPendingFiles((prev) => {
            const newFiles = [...prev];
            newFiles[index] = {
                ...newFiles[index],
                type,
                floor: type === 'plan' ? newFiles[index].floor || 1 : undefined,
            };
            return newFiles;
        });
    }, []);

    const handleUpdateFileFloor = useCallback((index: number, floor: number) => {
        setPendingFiles((prev) => {
            const newFiles = [...prev];
            newFiles[index] = { ...newFiles[index], floor };
            return newFiles;
        });
    }, []);

    const handleUpload = useCallback(async () => {
        if (pendingFiles.length === 0) return;

        setIsUploading(true);

        for (const pending of pendingFiles) {
            // Add drawing to store
            const id = addDrawing({
                name: pending.file.name,
                url: pending.preview,
                type: pending.type,
                floor: pending.floor,
                status: 'processing',
            });

            // Simulate processing delay
            await new Promise((resolve) => setTimeout(resolve, 500));
            updateDrawingStatus(id, 'ready');
        }

        setIsUploading(false);
        setPendingFiles([]);
        setDrawingImportOpen(false);
    }, [pendingFiles, addDrawing, updateDrawingStatus, setDrawingImportOpen]);

    const handleClose = useCallback(() => {
        // Clean up preview URLs
        pendingFiles.forEach((f) => URL.revokeObjectURL(f.preview));
        setPendingFiles([]);
        setDrawingImportOpen(false);
    }, [pendingFiles, setDrawingImportOpen]);

    if (!drawingImportOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                onClick={(e) => e.target === e.currentTarget && handleClose()}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="relative w-full max-w-3xl rounded-2xl border border-surface-3 bg-surface-1 shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-surface-3 px-6 py-4">
                        <h2 className="text-lg font-bold">図面インポート</h2>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-surface-2 rounded-lg transition-colors text-text-muted hover:text-text-main"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        {/* Drawing Type Selector */}
                        <div className="space-y-2">
                            <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
                                図面タイプ
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {drawingTypes.map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setSelectedType(type)}
                                        className={`p-3 rounded-lg border text-sm transition-all ${
                                            selectedType === type
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-surface-3 bg-surface-2 text-text-muted hover:border-primary/50'
                                        }`}
                                    >
                                        {DRAWING_TYPE_LABELS[type]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Floor Selector (only for plan type) */}
                        <AnimatePresence>
                            {selectedType === 'plan' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-2 overflow-hidden"
                                >
                                    <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
                                        階数選択
                                    </label>
                                    <div className="flex gap-2 flex-wrap">
                                        {Array.from({ length: Math.max(building.totalFloors, 5) }, (_, i) => i + 1).map((floor) => (
                                            <button
                                                key={floor}
                                                onClick={() => setSelectedFloor(floor)}
                                                className={`w-12 h-12 rounded-lg border text-sm font-bold transition-all ${
                                                    selectedFloor === floor
                                                        ? 'border-primary text-white'
                                                        : 'border-surface-3 bg-surface-2 text-text-muted hover:border-primary/50'
                                                }`}
                                                style={{
                                                    backgroundColor: selectedFloor === floor
                                                        ? FLOOR_COLORS[floor] || '#6366f1'
                                                        : undefined,
                                                }}
                                            >
                                                {floor}F
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Drop Zone */}
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                                isDragging
                                    ? 'border-primary bg-primary/10'
                                    : 'border-surface-3 hover:border-primary/50 hover:bg-surface-2'
                            }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*,.pdf"
                                onChange={(e) => handleFileSelect(e.target.files)}
                                className="hidden"
                            />
                            <Upload className="mx-auto mb-3 text-text-muted" size={32} />
                            <p className="text-sm text-text-muted">
                                ドラッグ＆ドロップ または クリックしてファイルを選択
                            </p>
                            <p className="text-xs text-text-muted mt-1">
                                対応形式: PNG, JPG, PDF
                            </p>
                        </div>

                        {/* Pending Files List */}
                        {pendingFiles.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
                                    アップロード予定 ({pendingFiles.length}件)
                                </label>
                                <div className="space-y-2">
                                    {pendingFiles.map((pending, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-3 p-3 bg-surface-2 rounded-lg border border-surface-3"
                                        >
                                            {/* Thumbnail */}
                                            <div className="w-16 h-12 bg-surface-3 rounded overflow-hidden flex-shrink-0">
                                                <img
                                                    src={pending.preview}
                                                    alt={pending.file.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm truncate">{pending.file.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {/* Type selector */}
                                                    <select
                                                        value={pending.type}
                                                        onChange={(e) => handleUpdateFileType(index, e.target.value as DrawingFileType)}
                                                        className="text-xs px-2 py-1 bg-surface-1 border border-surface-3 rounded"
                                                    >
                                                        {drawingTypes.map((type) => (
                                                            <option key={type} value={type}>
                                                                {DRAWING_TYPE_LABELS[type]}
                                                            </option>
                                                        ))}
                                                    </select>

                                                    {/* Floor selector */}
                                                    {pending.type === 'plan' && (
                                                        <select
                                                            value={pending.floor || 1}
                                                            onChange={(e) => handleUpdateFileFloor(index, parseInt(e.target.value))}
                                                            className="text-xs px-2 py-1 bg-surface-1 border border-surface-3 rounded"
                                                        >
                                                            {Array.from({ length: Math.max(building.totalFloors, 5) }, (_, i) => i + 1).map((floor) => (
                                                                <option key={floor} value={floor}>
                                                                    {floor}F
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Remove button */}
                                            <button
                                                onClick={() => handleRemoveFile(index)}
                                                className="p-2 hover:bg-danger/10 rounded-lg transition-colors text-text-muted hover:text-danger"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 border-t border-surface-3 px-6 py-4">
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 text-sm text-text-muted hover:text-text-main transition-colors"
                        >
                            キャンセル
                        </button>
                        <NeonButton
                            variant="primary"
                            onClick={handleUpload}
                            disabled={pendingFiles.length === 0 || isUploading}
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    アップロード中...
                                </>
                            ) : (
                                <>
                                    <Upload size={16} />
                                    アップロード ({pendingFiles.length}件)
                                </>
                            )}
                        </NeonButton>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
