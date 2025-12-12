import { GlassPanel } from "@/components/ui/GlassPanel";
import { useState, useRef } from "react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Layers, Calculator, MessageSquare, Upload, FileImage, Ruler, Check, Trash2, Image, Eye, EyeOff, FolderOpen, Plus, Square, AlignCenter, Sparkles, Loader2, Home } from "lucide-react";
import { usePlanningStore, SCALE_PRESETS, DRAWING_TYPE_LABELS, FLOOR_COLORS, type Point, type RoofType } from "@/store/planningStore";
import { NeonButton } from "@/components/ui/NeonButton";

// API response types for outline extraction
interface CoordinatePoint {
    point: string;
    x: number;
    y: number;
}

interface DimensionLine {
    label: string;
    value_mm: number;
    direction: string;
    raw_text: string;
}

interface OutlineExtractionResult {
    dimensions: DimensionLine[];
    coordinates: CoordinatePoint[];
    width_mm: number;
    height_mm: number;
    floor?: number;
    color?: string;
}

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
        addPolylinePoint,
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
        // Wall configuration
        wall,
        setWall,
        // Roof configuration
        roof,
        setRoof,
    } = usePlanningStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isExtracting, setIsExtracting] = useState<string | null>(null); // Drawing ID being extracted
    const [extractionError, setExtractionError] = useState<string | null>(null);

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

    // State for extraction result display
    const [extractionResult, setExtractionResult] = useState<OutlineExtractionResult | null>(null);

    // Handle AI outline extraction
    const handleExtractOutline = async (drawingId: string) => {
        const drawing = drawings.find(d => d.id === drawingId);
        if (!drawing) return;

        setIsExtracting(drawingId);
        setExtractionError(null);
        setExtractionResult(null);

        try {
            // Use the server-side ID (UUID) if available, otherwise fallback to client ID
            // The backend expects the UUID that was generated during upload.
            const fileId = drawing.serverId || drawingId;

            console.log('[SidePanel] Extracting outline for file_id:', fileId);

            // Use extract-outline-by-id endpoint with file_id
            // 直接バックエンドを呼ぶ（Gemini API呼び出しに時間がかかるため、Next.jsプロキシを経由しない）
            const extractResponse = await fetch('http://localhost:8000/api/v1/drawings/extract-outline-by-id', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ file_id: fileId }),
            });

            if (!extractResponse.ok) {
                const errorText = await extractResponse.text();
                let errorMessage = 'AI解析に失敗しました';
                try {
                    const error = JSON.parse(errorText);
                    errorMessage = error.detail || errorMessage;
                } catch {
                    errorMessage = errorText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const result: OutlineExtractionResult = await extractResponse.json();

            // Fallback: If backend didn't return floor but we know it from drawing, inject it
            // This ensures "Apply to Canvas" uses the correct floor even if API response is incomplete
            if (result.floor === undefined && drawing.floor !== undefined) {
                console.log('[SidePanel] Injecting floor from drawing info:', drawing.floor);
                result.floor = drawing.floor;

                // Inject color if missing
                if (!result.color && FLOOR_COLORS[drawing.floor]) {
                    result.color = FLOOR_COLORS[drawing.floor];
                }
            }

            // Display result in console and UI
            console.log('=== AI外周座標抽出結果 ===');
            console.log(JSON.stringify(result, null, 2));
            console.log(`建物サイズ: ${result.width_mm}mm × ${result.height_mm}mm`);

            // Store result for UI display
            setExtractionResult(result);

        } catch (error) {
            console.error('[SidePanel] Extraction error:', error);
            setExtractionError(error instanceof Error ? error.message : 'AI解析に失敗しました');
        } finally {
            setIsExtracting(null);
        }
    };

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
                                    {/* AI Extraction Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleExtractOutline(drawing.id);
                                        }}
                                        disabled={isExtracting === drawing.id}
                                        className={clsx(
                                            "p-1 rounded transition-colors",
                                            isExtracting === drawing.id
                                                ? "text-accent bg-accent/20"
                                                : "text-text-muted hover:text-accent hover:bg-accent/10"
                                        )}
                                        title="AI外周解析 (Gemini)"
                                    >
                                        {isExtracting === drawing.id ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <Sparkles size={14} />
                                        )}
                                    </button>
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

                    {/* Extraction Error Display */}
                    {extractionError && (
                        <div className="mt-2 p-2 bg-danger/10 border border-danger/30 rounded-lg">
                            <p className="text-xs text-danger">{extractionError}</p>
                            <button
                                onClick={() => setExtractionError(null)}
                                className="text-xs text-danger/70 hover:text-danger underline mt-1"
                            >
                                閉じる
                            </button>
                        </div>
                    )}

                    {/* Extraction Result Display */}
                    {extractionResult && (
                        <div className="mt-2 p-3 bg-accent/10 border border-accent/30 rounded-lg space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-accent flex items-center gap-1">
                                    <Sparkles size={12} />
                                    AI解析結果
                                </span>
                                <button
                                    onClick={() => setExtractionResult(null)}
                                    className="text-xs text-text-muted hover:text-text-main"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* 読み取った寸法線 */}
                            <div>
                                <div className="text-xs font-bold text-primary mb-1 flex items-center gap-1">
                                    <Ruler size={12} />
                                    読み取った寸法線 ({extractionResult.dimensions?.length || 0})
                                </div>
                                <div className="max-h-40 overflow-y-auto bg-surface-1 rounded p-2 space-y-1">
                                    {extractionResult.dimensions?.map((dim, i) => (
                                        <div key={i} className="flex justify-between items-center text-[11px] border-b border-surface-3 pb-1">
                                            <span className="text-text-muted">{dim.label}</span>
                                            <span className="font-mono">
                                                <span className="text-accent font-bold">{dim.value_mm.toLocaleString()}</span>
                                                <span className="text-text-muted ml-1">mm</span>
                                            </span>
                                            <span className="text-text-muted text-[10px]">
                                                {dim.direction === 'horizontal' ? '↔' : '↕'}
                                            </span>
                                            <span className="text-text-muted text-[10px] italic">"{dim.raw_text}"</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 算出された座標 */}
                            <div>
                                <div className="text-xs font-bold text-primary mb-1">
                                    算出座標 (サイズ: {extractionResult.width_mm}×{extractionResult.height_mm}mm)
                                </div>
                                <div className="max-h-24 overflow-y-auto bg-surface-1 rounded p-2 font-mono text-[10px]">
                                    {extractionResult.coordinates.map((coord, i) => (
                                        <div key={i} className="text-text-muted">
                                            {coord.point}: ({coord.x}, {coord.y})
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    const json = JSON.stringify(extractionResult, null, 2);
                                    navigator.clipboard.writeText(json);
                                }}
                                className="w-full p-1.5 text-xs bg-surface-2 hover:bg-surface-3 text-text-muted rounded transition-colors"
                            >
                                JSONをコピー
                            </button>

                            <button
                                onClick={() => {
                                    if (!extractionResult?.coordinates) return;

                                    // Current scale (pixels per mm)
                                    // If scale is not set, default to 1:100 (approx 0.0378 px/mm)
                                    const pixelsPerMm = scaleRatio
                                        ? (3.78 / scaleRatio)
                                        : (3.78 / 100);

                                    // Convert mm coordinates to canvas pixels
                                    // Also apply an offset to place it near the center or top-left visible area
                                    // Changed to (500, 500) to avoid overlapping with default drawing position (0,0) or (100,100)
                                    const startX = 500;
                                    const startY = 500;

                                    const points: Point[] = extractionResult.coordinates.map(coord => ({
                                        x: startX + (coord.x * pixelsPerMm),
                                        y: startY + (coord.y * pixelsPerMm)
                                    }));

                                    // Ensure the shape is closed for 3D generation
                                    // Check if the last point matches the first point
                                    if (points.length > 0) {
                                        const first = points[0];
                                        const last = points[points.length - 1];
                                        const distance = Math.sqrt(Math.pow(last.x - first.x, 2) + Math.pow(last.y - first.y, 2));

                                        // If distance is large (not effectively the same point), add the first point to close loop
                                        if (distance > 1) {
                                            points.push({ ...first });
                                        }
                                    }

                                    // Update store
                                    const pPoints = points;
                                    usePlanningStore.getState().setPolylinePoints(pPoints);

                                    // If floor is detected, try to set attributes for these new edges
                                    const floor = extractionResult.floor;
                                    if (floor) {
                                        // We just added N points (N-1 segments for open, N segments for closed if last == first)
                                        // Actually points define vertices. Segments are between i and i+1.
                                        const store = usePlanningStore.getState();
                                        const numSegments = pPoints.length - 1; // Assuming sequential segments

                                        for (let i = 0; i < numSegments; i++) {
                                            // Set attribute for each segment
                                            store.setEdgeAttribute(i, {
                                                startFloor: floor,
                                                endFloor: floor // Default to single floor height
                                            });
                                        }
                                        console.log(`[SidePanel] Applied floor attributes for ${numSegments} segments: Floor ${floor}`);
                                    }

                                    // Notify user
                                    console.log('Applied points to canvas (Closed Polygon):', points);
                                }}
                                className="w-full p-2 text-xs font-bold bg-accent hover:bg-accent-hover text-white rounded transition-colors flex items-center justify-center gap-2"
                            >
                                <Check size={14} />
                                キャンバスに反映
                            </button>
                        </div>
                    )}
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
                    {(() => {
                        // Determine active drawing (prefer background drawing, then first available, or fallback to legacy)
                        const activeDrawing = backgroundDrawingId
                            ? drawings.find(d => d.id === backgroundDrawingId)
                            : (drawings.length > 0 ? drawings[0] : null);

                        // Use active drawing info or legacy info
                        const name = activeDrawing ? activeDrawing.name : (drawingName || '未選択');

                        return (
                            <>
                                <div className="flex justify-between items-center">
                                    <span className="text-text-muted flex items-center gap-2"><FileImage size={14} /> ファイル</span>
                                    <span className="truncate max-w-[120px]">{name}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-text-muted flex items-center gap-2"><Layers size={14} /> 階層</span>
                                    {activeDrawing && activeDrawing.type === 'plan' ? (
                                        <div className="flex items-center gap-1">
                                            <select
                                                value={activeDrawing.floor || 1}
                                                onChange={(e) => {
                                                    const newFloor = parseInt(e.target.value);
                                                    // Update drawing floor in store
                                                    usePlanningStore.getState().updateDrawingFloor(activeDrawing.id, newFloor);
                                                }}
                                                className="bg-surface-1 border border-surface-3 rounded px-2 py-0.5 text-xs text-text-main focus:outline-none focus:border-accent"
                                                style={{ color: FLOOR_COLORS[activeDrawing.floor || 1] }}
                                            >
                                                {[1, 2, 3, 4, 5].map(f => (
                                                    <option key={f} value={f}>{f}F</option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <span className="text-text-muted text-xs">-</span>
                                    )}
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
                            </>
                        );
                    })()}
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

            {/* Roof Settings Section */}
            <div className="space-y-2">
                <label className="text-xs text-text-muted uppercase font-bold tracking-wider flex items-center gap-2">
                    <Home size={14} /> 屋根設定
                </label>
                <div className="space-y-2">
                    {/* Roof Type */}
                    <div className="grid grid-cols-2 gap-2">
                        {(['flat', 'gable', 'hip', 'shed'] as RoofType[]).map((type) => (
                            <button
                                key={type}
                                onClick={() => setRoof({ roofType: type })}
                                className={clsx(
                                    "p-1.5 rounded-lg border text-xs transition-all flex items-center justify-center gap-1",
                                    roof.roofType === type
                                        ? "border-accent bg-accent/10 text-accent shadow-[0_0_8px_var(--accent-glow)]"
                                        : "border-surface-3 bg-surface-2 text-text-muted hover:border-primary/50 hover:text-text-main"
                                )}
                            >
                                {type === 'flat' && "陸屋根 (Flat)"}
                                {type === 'gable' && "切妻 (Gable)"}
                                {type === 'hip' && "寄棟 (Hip)"}
                                {type === 'shed' && "片流れ (Shed)"}
                            </button>
                        ))}
                    </div>

                    {/* Overhangs */}
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-text-muted w-16">軒出</label>
                        <input
                            type="number"
                            value={roof.eaveOverhang}
                            onChange={(e) => setRoof({ eaveOverhang: parseInt(e.target.value) || 0 })}
                            min={0}
                            step={50}
                            className="flex-1 px-2 py-1.5 bg-surface-2 border border-surface-3 rounded text-sm font-mono text-right focus:outline-none focus:border-accent"
                        />
                        <span className="text-xs text-text-muted">mm</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-text-muted w-16">ケラバ</label>
                        <input
                            type="number"
                            value={roof.gableOverhang}
                            onChange={(e) => setRoof({ gableOverhang: parseInt(e.target.value) || 0 })}
                            min={0}
                            step={50}
                            className="flex-1 px-2 py-1.5 bg-surface-2 border border-surface-3 rounded text-sm font-mono text-right focus:outline-none focus:border-accent"
                        />
                        <span className="text-xs text-text-muted">mm</span>
                    </div>

                    {/* Slope */}
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-text-muted w-16">勾配</label>
                        <input
                            type="text"
                            placeholder="例: 4/10"
                            value={roof.slopeRatio || ''}
                            onChange={(e) => setRoof({ slopeRatio: e.target.value })}
                            className="flex-1 px-2 py-1.5 bg-surface-2 border border-surface-3 rounded text-sm font-mono text-right focus:outline-none focus:border-accent"
                        />
                    </div>
                    {/* Slope Angle (Read Only / Calculated) */}
                    {roof.slopeAngle && (
                        <div className="flex justify-end text-xs text-text-muted">
                            {roof.slopeAngle.toFixed(1)}°
                        </div>
                    )}
                </div>
            </div>

            {/* Wall Dimension Settings Section */}
            <div className="space-y-2">
                <label className="text-xs text-text-muted uppercase font-bold tracking-wider">壁寸法設定</label>

                {/* Dimension Mode Toggle */}
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => setWall({ dimensionMode: 'actual' })}
                        className={clsx(
                            "p-2 rounded-lg border text-sm transition-all flex items-center justify-center gap-2",
                            wall.dimensionMode === 'actual'
                                ? "border-accent bg-accent/10 text-accent shadow-[0_0_12px_var(--accent-glow)]"
                                : "border-surface-3 bg-surface-2 text-text-muted hover:border-primary/50 hover:text-text-main"
                        )}
                    >
                        <Square size={14} />
                        実寸
                    </button>
                    <button
                        onClick={() => setWall({ dimensionMode: 'centerline' })}
                        className={clsx(
                            "p-2 rounded-lg border text-sm transition-all flex items-center justify-center gap-2",
                            wall.dimensionMode === 'centerline'
                                ? "border-accent bg-accent/10 text-accent shadow-[0_0_12px_var(--accent-glow)]"
                                : "border-surface-3 bg-surface-2 text-text-muted hover:border-primary/50 hover:text-text-main"
                        )}
                    >
                        <AlignCenter size={14} />
                        芯寸
                    </button>
                </div>

                {/* Wall Thickness Input (only shown in centerline mode) */}
                <AnimatePresence>
                    {wall.dimensionMode === 'centerline' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2 overflow-hidden"
                        >
                            <div className="flex items-center gap-2">
                                <label className="text-xs text-text-muted w-16">壁厚</label>
                                <input
                                    type="number"
                                    value={wall.thickness}
                                    onChange={(e) => setWall({ thickness: parseInt(e.target.value) || 0 })}
                                    min={50}
                                    max={500}
                                    step={10}
                                    className="flex-1 px-2 py-1.5 bg-surface-2 border border-surface-3 rounded text-sm font-mono text-right focus:outline-none focus:border-accent"
                                />
                                <span className="text-xs text-text-muted">mm</span>
                            </div>
                            <div className="p-2 bg-primary/10 rounded-lg border border-primary/30">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-primary">オフセット量</span>
                                    <span className="font-mono text-primary text-sm font-bold">±{wall.thickness / 2}mm</span>
                                </div>
                                <p className="text-[10px] text-text-muted mt-1">
                                    芯線から内外に{wall.thickness / 2}mmずつオフセットして立体化
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Mode Description */}
                <div className="text-xs text-text-muted p-2 bg-surface-2 rounded-lg border border-surface-3">
                    {wall.dimensionMode === 'actual' ? (
                        <p>📐 描いた線がそのまま壁の外形線になります</p>
                    ) : (
                        <p>📏 描いた線が壁の中心線（芯）として扱われます</p>
                    )}
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
