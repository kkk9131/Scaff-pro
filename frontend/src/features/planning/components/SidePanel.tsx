import { GlassPanel } from "@/components/ui/GlassPanel";
import { useState, useRef } from "react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Layers, Calculator, MessageSquare, Upload, FileImage, Ruler, Check, Trash2, Image, Eye, EyeOff, FolderOpen, Plus } from "lucide-react";
import { usePlanningStore, SCALE_PRESETS, DRAWING_TYPE_LABELS, FLOOR_COLORS } from "@/store/planningStore";
import { NeonButton } from "@/components/ui/NeonButton";

// Building Tab Component with File Upload
const BuildingTab = () => {
    const {
        drawingUrl,
        drawingName,
        scale,
        scaleRatio,
        setDrawing,
        setCurrentTool,
        setIsSettingScale,
        setScaleFromRatio,
        building,
        setBuilding,
        grid,
        setGrid,
        polylinePoints,
        clearPolyline,
        selectedEdgeIndex,
        edgeAttributes,
        setEdgeAttribute,
        // Drawing management
        drawings,
        setDrawingImportOpen,
        removeDrawing,
        backgroundDrawingId,
        setBackgroundDrawingId,
        backgroundOpacity,
        setBackgroundOpacity,
        openDrawingTab,
    } = usePlanningStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setDrawing(url, file.name);
        }
    };

    const handleStartScaleSetting = () => {
        setCurrentTool('scale');
        setIsSettingScale(true);
    };

    const totalHeight = building.floorHeight * building.totalFloors + building.roofHeight;

    // Helper for edge update
    const handleEdgeUpdate = (key: 'startFloor' | 'endFloor', value: number) => {
        if (selectedEdgeIndex === null) return;

        const currentAttr = edgeAttributes[selectedEdgeIndex] || { startFloor: 1, endFloor: building.totalFloors };
        const newAttr = { ...currentAttr, [key]: value };

        // Validation
        if (newAttr.startFloor > newAttr.endFloor) {
            if (key === 'startFloor') newAttr.endFloor = value;
            else newAttr.startFloor = value;
        }

        setEdgeAttribute(selectedEdgeIndex, newAttr);
    };

    const currentEdgeAttr = selectedEdgeIndex !== null
        ? (edgeAttributes[selectedEdgeIndex] || { startFloor: 1, endFloor: building.totalFloors })
        : null;

    return (
        <div className="space-y-4 p-1">
            {/* ... File Upload ... */}
            {/* ... Drawing Info ... */}
            {/* ... Scale Presets ... */}

            {/* Height Settings ... */}

            {/* Edge Property Editor */}
            <AnimatePresence>
                {selectedEdgeIndex !== null && currentEdgeAttr && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2 overflow-hidden"
                    >
                        {/* Divider */}
                        <div className="w-full h-[1px] bg-surface-3 my-2" />

                        <label className="text-xs text-primary uppercase font-bold tracking-wider flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary" />
                            選択中の壁設定
                        </label>

                        <div className="p-3 bg-surface-2 border border-primary/30 rounded-lg space-y-3 shadow-[0_0_10px_rgba(var(--primary-rgb),0.1)]">
                            <div className="flex items-center justify-between text-xs text-text-muted">
                                <span>Edge ID: {selectedEdgeIndex}</span>
                                <button
                                    onClick={() => setEdgeAttribute(selectedEdgeIndex, { startFloor: 1, endFloor: building.totalFloors })}
                                    className="text-xs text-accent hover:underline"
                                >
                                    リセット
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-xs text-text-muted">開始階</label>
                                    <div className="flex items-center">
                                        <input
                                            type="number"
                                            min={1}
                                            max={building.totalFloors}
                                            value={currentEdgeAttr.startFloor}
                                            onChange={(e) => handleEdgeUpdate('startFloor', parseInt(e.target.value))}
                                            className="w-full px-2 py-1 bg-surface-1 border border-surface-3 rounded text-sm text-center focus:border-primary focus:outline-none"
                                        />
                                        <span className="ml-1 text-xs">F</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-text-muted">終了階</label>
                                    <div className="flex items-center">
                                        <input
                                            type="number"
                                            min={1}
                                            max={building.totalFloors}
                                            value={currentEdgeAttr.endFloor}
                                            onChange={(e) => handleEdgeUpdate('endFloor', parseInt(e.target.value))}
                                            className="w-full px-2 py-1 bg-surface-1 border border-surface-3 rounded text-sm text-center focus:border-primary focus:outline-none"
                                        />
                                        <span className="ml-1 text-xs">F</span>
                                    </div>
                                </div>
                            </div>

                            <div className="text-xs text-text-muted text-center pt-1 border-t border-surface-3">
                                {currentEdgeAttr.startFloor === 1 && currentEdgeAttr.endFloor === building.totalFloors
                                    ? "全階層 (標準)"
                                    : `${currentEdgeAttr.startFloor}F 〜 ${currentEdgeAttr.endFloor}F のみ設置`}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Drawing Import Section */}
            <div className="space-y-2">
                <label className="text-xs text-text-muted uppercase font-bold tracking-wider">図面管理</label>
                <button
                    onClick={() => setDrawingImportOpen(true)}
                    className="w-full p-3 border-2 border-dashed border-surface-3 rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 text-text-muted hover:text-text-main"
                >
                    <Plus size={20} />
                    <span className="text-sm">図面をインポート</span>
                </button>
            </div>

            {/* Imported Drawings List */}
            {drawings.length > 0 && (
                <div className="space-y-2">
                    <label className="text-xs text-text-muted uppercase font-bold tracking-wider">
                        インポート済み ({drawings.length}件)
                    </label>
                    <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                        {drawings.map((drawing) => (
                            <div
                                key={drawing.id}
                                className={clsx(
                                    "flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer",
                                    backgroundDrawingId === drawing.id
                                        ? "border-primary bg-primary/10"
                                        : "border-surface-3 bg-surface-2 hover:border-primary/30"
                                )}
                            >
                                {/* Thumbnail */}
                                <div className="w-10 h-8 bg-surface-3 rounded overflow-hidden flex-shrink-0">
                                    <img
                                        src={drawing.url}
                                        alt={drawing.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0" onClick={() => openDrawingTab(drawing.id)}>
                                    <p className="text-xs truncate">{drawing.name}</p>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px] text-text-muted">
                                            {DRAWING_TYPE_LABELS[drawing.type]}
                                        </span>
                                        {drawing.type === 'plan' && drawing.floor && (
                                            <span
                                                className="text-[10px] px-1 rounded text-white"
                                                style={{ backgroundColor: FLOOR_COLORS[drawing.floor] || '#6366f1' }}
                                            >
                                                {drawing.floor}F
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setBackgroundDrawingId(
                                                backgroundDrawingId === drawing.id ? null : drawing.id
                                            );
                                        }}
                                        className={clsx(
                                            "p-1 rounded transition-colors",
                                            backgroundDrawingId === drawing.id
                                                ? "text-primary bg-primary/20"
                                                : "text-text-muted hover:text-primary hover:bg-surface-3"
                                        )}
                                        title="背景に表示"
                                    >
                                        {backgroundDrawingId === drawing.id ? <Eye size={14} /> : <EyeOff size={14} />}
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeDrawing(drawing.id);
                                        }}
                                        className="p-1 rounded text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                                        title="削除"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Background Opacity Slider */}
            {backgroundDrawingId && (
                <div className="space-y-2">
                    <label className="text-xs text-text-muted uppercase font-bold tracking-wider flex items-center gap-2">
                        <Image size={14} />
                        背景透過率
                    </label>
                    <div className="flex items-center gap-3">
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={backgroundOpacity}
                            onChange={(e) => setBackgroundOpacity(parseFloat(e.target.value))}
                            className="flex-1 h-2 bg-surface-3 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <span className="text-xs text-text-muted w-12 text-right font-mono">
                            {Math.round(backgroundOpacity * 100)}%
                        </span>
                    </div>
                </div>
            )}

            {/* Legacy File Upload (hidden, for backward compatibility) */}
            <div className="hidden">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                    className="hidden"
                />
            </div>

            {/* Drawing Info Section */}
            <div className="space-y-2">
                <label className="text-xs text-text-muted uppercase font-bold tracking-wider">図面情報</label>
                <div className="p-3 bg-surface-2 rounded-lg border border-surface-3 text-sm space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-text-muted flex items-center gap-2"><FileImage size={14} /> ファイル</span>
                        <span className="truncate max-w-[120px]">{drawingName || '未選択'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-text-muted flex items-center gap-2"><Ruler size={14} /> スケール</span>
                        {scaleRatio ? (
                            <span className="font-mono text-accent">1 : {scaleRatio}</span>
                        ) : (
                            <span className="text-text-muted">未設定</span>
                        )}
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-text-muted">外周ポリライン</span>
                        <span className="font-mono">{polylinePoints.length} 頂点</span>
                    </div>
                </div>
                {polylinePoints.length > 0 && (
                    <button
                        onClick={clearPolyline}
                        className="w-full p-2 rounded-lg border border-danger/20 bg-surface-2 text-sm text-danger hover:bg-danger/10 transition-colors flex items-center justify-center gap-2"
                    >
                        <Trash2 size={14} /> ポリラインをクリア
                    </button>
                )}
            </div>

            {/* Scale Presets Section */}
            <div className="space-y-2">
                <label className="text-xs text-text-muted uppercase font-bold tracking-wider">スケール設定</label>
                <div className="grid grid-cols-2 gap-2">
                    {SCALE_PRESETS.map((preset) => (
                        <button
                            key={preset.ratio}
                            onClick={() => setScaleFromRatio(preset.ratio)}
                            className={clsx(
                                "p-2 rounded-lg border text-sm font-mono transition-all flex items-center justify-center gap-2",
                                scaleRatio === preset.ratio
                                    ? "border-accent bg-accent/10 text-accent shadow-[0_0_12px_var(--accent-glow)]"
                                    : "border-surface-3 bg-surface-2 text-text-muted hover:border-primary/50 hover:text-text-main"
                            )}
                        >
                            {scaleRatio === preset.ratio && <Check size={14} />}
                            {preset.label}
                        </button>
                    ))}
                </div>
                <button
                    onClick={handleStartScaleSetting}
                    className="w-full p-2 rounded-lg border border-surface-3 bg-surface-2 text-sm text-text-muted hover:border-primary/50 hover:text-text-main transition-colors flex items-center justify-center gap-2"
                >
                    <Ruler size={14} /> 2点クリックで設定
                </button>
            </div>

            {/* Grid Spacing Section */}
            <div className="space-y-2">
                <label className="text-xs text-text-muted uppercase font-bold tracking-wider">グリッド間隔</label>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        value={grid.spacing}
                        onChange={(e) => setGrid({ spacing: parseInt(e.target.value) || 0 })}
                        min={100}
                        step={100}
                        className="flex-1 px-3 py-2 bg-surface-2 border border-surface-3 rounded-lg text-sm font-mono text-right focus:outline-none focus:border-accent transition-colors"
                    />
                    <span className="text-xs text-text-muted">mm</span>
                </div>
                <div className="p-2 bg-primary/10 rounded-lg border border-primary/30">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-primary">グリッド寸法</span>
                        <span className="font-mono text-primary text-sm font-bold">{(grid.spacing / 1000).toFixed(2)}m</span>
                    </div>
                </div>
            </div>

            {/* Height Settings Section - Editable */}
            <div className="space-y-2">
                <label className="text-xs text-text-muted uppercase font-bold tracking-wider">建物高さ設定</label>
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-text-muted w-16">階高</label>
                        <input
                            type="number"
                            value={building.floorHeight}
                            onChange={(e) => setBuilding({ floorHeight: parseInt(e.target.value) || 0 })}
                            className="flex-1 px-2 py-1.5 bg-surface-2 border border-surface-3 rounded text-sm font-mono text-right focus:outline-none focus:border-accent"
                        />
                        <span className="text-xs text-text-muted">mm</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-text-muted w-16">階数</label>
                        <input
                            type="number"
                            value={building.totalFloors}
                            onChange={(e) => setBuilding({ totalFloors: parseInt(e.target.value) || 1 })}
                            min={1}
                            max={10}
                            className="flex-1 px-2 py-1.5 bg-surface-2 border border-surface-3 rounded text-sm font-mono text-right focus:outline-none focus:border-accent"
                        />
                        <span className="text-xs text-text-muted">階</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-text-muted w-16">屋根高</label>
                        <input
                            type="number"
                            value={building.roofHeight}
                            onChange={(e) => setBuilding({ roofHeight: parseInt(e.target.value) || 0 })}
                            className="flex-1 px-2 py-1.5 bg-surface-2 border border-surface-3 rounded text-sm font-mono text-right focus:outline-none focus:border-accent"
                        />
                        <span className="text-xs text-text-muted">mm</span>
                    </div>
                </div>
                <div className="p-2 bg-accent/10 rounded-lg border border-accent/30">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-accent">総高さ</span>
                        <span className="font-mono text-accent font-bold">{(totalHeight / 1000).toFixed(1)}m</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ScaffoldTab = () => (
    <div className="text-sm text-text-muted p-2">足場条件設定（準備中）</div>
);
const QuantityTab = () => (
    <div className="text-sm text-text-muted p-2">数量表（準備中）</div>
);
const ChatTab = () => (
    <div className="text-sm text-text-muted p-2">AIチャット（準備中）</div>
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
            <div className="flex border-b border-surface-3">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={clsx(
                            "flex-1 py-3 flex justify-center items-center text-text-muted hover:bg-surface-2 transition-colors relative",
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
