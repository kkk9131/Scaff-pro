"use client";

import { Stage, Layer, Line, Circle, Text, Image as KonvaImage } from "react-konva";
import { useEffect, useState, useRef, useCallback } from "react";
import { usePlanningStore, type Point } from "@/store/planningStore";
import Konva from "konva";
import { ScaleInputModal } from "./ScaleInputModal";
import { useThemeStore } from "@/store/themeStore";

// Custom hook for loading images
function useImage(url: string | null): [HTMLImageElement | null, 'loading' | 'loaded' | 'error'] {
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

    useEffect(() => {
        if (!url) {
            setImage(null);
            setStatus('loading');
            return;
        }

        const img = new window.Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            setImage(img);
            setStatus('loaded');
        };

        img.onerror = () => {
            setImage(null);
            setStatus('error');
        };

        img.src = url;

        return () => {
            img.onload = null;
            img.onerror = null;
        };
    }, [url]);

    return [image, status];
}

export function Canvas2D() {
    const [size, setSize] = useState({ width: 0, height: 0 });
    const [mousePos, setMousePos] = useState<Point | null>(null);
    const [showScaleModal, setShowScaleModal] = useState(false);
    const [pixelDistance, setPixelDistance] = useState(0);
    const stageRef = useRef<Konva.Stage>(null);

    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
    const [stageScale, setStageScale] = useState(1);

    const { theme } = useThemeStore();
    const isDark = theme === 'dark';

    // Theme Colors for Canvas
    const colors = {
        primary: isDark ? "#00F0FF" : "#3B82F6",
        secondary: isDark ? "#FF6B35" : "#F97316",
        text: isDark ? "#a1a1aa" : "#64748B",
        fill: isDark ? "rgba(0, 240, 255, 0.1)" : "rgba(59, 130, 246, 0.1)",
        grid: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
    };

    const {
        currentTool,
        isSettingScale,
        scalePoints,
        addScalePoint,
        setScale,
        resetScalePoints,
        polylinePoints,
        addPolylinePoint,
        finishPolyline,
        cancelPolyline,
        popPolylinePoint,
        isDrawingPolyline,
        isGridSnapEnabled,
        edgeAttributes,
        building,
        selectedEdgeIndex,
        setSelectedEdgeIndex,
        scale: canvasScale,
        grid,
        // Background drawing
        drawings,
        backgroundDrawingId,
        backgroundOpacity,
    } = usePlanningStore();

    // Get background drawing URL
    const backgroundDrawing = drawings.find(d => d.id === backgroundDrawingId);
    const [backgroundImage, imageStatus] = useImage(backgroundDrawing?.url || null);

    // Calculate grid size in pixels based on real-world spacing and scale
    // grid.spacing is in mm, canvasScale is pixels per mm
    const GRID_SIZE = canvasScale && grid.spacing > 0
        ? grid.spacing * canvasScale
        : 40; // Fallback to 40px if no scale set

    // Grid Component
    const Grid = () => {
        if (!isGridSnapEnabled) return null;

        const width = size.width;
        const height = size.height;

        // Calculate visible bounds in world coordinates
        const startX = Math.floor((-stagePos.x / stageScale) / GRID_SIZE) * GRID_SIZE;
        const endX = Math.ceil(((width - stagePos.x) / stageScale) / GRID_SIZE) * GRID_SIZE;

        const startY = Math.floor((-stagePos.y / stageScale) / GRID_SIZE) * GRID_SIZE;
        const endY = Math.ceil(((height - stagePos.y) / stageScale) / GRID_SIZE) * GRID_SIZE;

        const dots = [];
        for (let x = startX; x <= endX; x += GRID_SIZE) {
            for (let y = startY; y <= endY; y += GRID_SIZE) {
                dots.push(
                    <Circle
                        key={`${x}-${y}`}
                        x={x}
                        y={y}
                        radius={1.5 / stageScale} // Keep dots distinct but small
                        fill={colors.grid}
                        listening={false}
                    />
                );
            }
        }
        return <>{dots}</>;
    };

    // Helper to get color based on edge attributes
    const getEdgeColor = (index: number) => {
        const attr = edgeAttributes[index];
        if (!attr) return colors.primary; // Default

        // 1F Only
        if (attr.startFloor === 1 && attr.endFloor === 1) return "#22c55e"; // Green

        // 2F+ Only (e.g. 2-2 or 2-Total)
        if (attr.startFloor >= 2) return "#eab308"; // Yellow

        // Custom / Partial (e.g. 1-2 in a 4 story building)
        if (attr.startFloor !== 1 || attr.endFloor !== building.totalFloors) return "#f97316"; // Orange

        return colors.primary;
    };

    // Helper to snap point to grid if enabled
    const snapToGrid = useCallback((point: Point): Point => {
        if (!isGridSnapEnabled) return point;
        return {
            x: Math.round(point.x / GRID_SIZE) * GRID_SIZE,
            y: Math.round(point.y / GRID_SIZE) * GRID_SIZE,
        };
    }, [isGridSnapEnabled]);

    useEffect(() => {
        setSize({ width: window.innerWidth, height: window.innerHeight });
        const handleResize = () => {
            setSize({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Keyboard handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (isDrawingPolyline) {
                    cancelPolyline();
                }
                if (isSettingScale) {
                    resetScalePoints();
                }
            }
            if (e.key === 'Enter') {
                if (isDrawingPolyline && polylinePoints.length >= 3) {
                    finishPolyline();
                }
            }
            if (e.key === 'Backspace' || e.key === 'Delete') {
                if (isDrawingPolyline) {
                    popPolylinePoint();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isDrawingPolyline, isSettingScale, polylinePoints, cancelPolyline, resetScalePoints, finishPolyline, popPolylinePoint]);

    // Calculate distance
    const calcDistance = (p1: Point, p2: Point) => {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    };

    // Handle stage click
    const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        const stage = e.target.getStage();
        if (!stage) return;

        // If clicked on empty space (Stage), deselect (unless we are clicking a line, handled by bubble)
        // But bubbling order means stage click fires LAST.
        // Konva's 'onClick' on Stage fires even if shape was clicked unless cancelBubble is used.
        // We added cancelBubble to Line onClick.
        if (e.target === stage) {
            setSelectedEdgeIndex(null);
        }

        const pos = stage.getPointerPosition();
        if (!pos) return;

        // Use current stagePos and stageScale for inverse transformation
        const transform = new Konva.Transform()
            .translate(stagePos.x, stagePos.y)
            .scale(stageScale, stageScale)
            .invert();

        // Apply snap to logic
        const rawPoint = transform.point(pos);
        const point = snapToGrid(rawPoint);

        // Scale setting
        if (currentTool === 'scale' && isSettingScale) {
            addScalePoint(point);

            if (scalePoints.length === 1) {
                const dist = calcDistance(scalePoints[0], point);
                setPixelDistance(dist);
                setShowScaleModal(true);
            }
            return;
        }

        // Polyline mode
        if (currentTool === 'polyline') {
            let newPoint = point;
            if (e.evt.shiftKey && polylinePoints.length > 0) {
                const lastPoint = polylinePoints[polylinePoints.length - 1];
                const dx = Math.abs(point.x - lastPoint.x);
                const dy = Math.abs(point.y - lastPoint.y);
                if (dx > dy) {
                    newPoint = { x: point.x, y: lastPoint.y };
                } else {
                    newPoint = { x: lastPoint.x, y: point.y };
                }
            }
            addPolylinePoint(newPoint);
        }
    }, [currentTool, isSettingScale, scalePoints, addScalePoint, polylinePoints, addPolylinePoint, snapToGrid, stagePos, stageScale]);

    // Handle double click
    const handleDoubleClick = useCallback(() => {
        if (currentTool === 'polyline' && polylinePoints.length >= 2) {
            finishPolyline();
        }
    }, [currentTool, polylinePoints, finishPolyline]);

    // Handle scale confirm
    const handleScaleConfirm = (realDistanceMm: number) => {
        const scaleValue = pixelDistance / realDistanceMm;
        setScale(scaleValue);
        setShowScaleModal(false);
        resetScalePoints();
    };

    // Mouse move
    const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        const stage = e.target.getStage();
        if (!stage) return;
        const pos = stage.getPointerPosition();
        if (!pos) return;

        // Use current stagePos and stageScale for inverse transformation
        const transform = new Konva.Transform()
            .translate(stagePos.x, stagePos.y)
            .scale(stageScale, stageScale)
            .invert();

        const rawPoint = transform.point(pos);
        setMousePos(snapToGrid(rawPoint));
    }, [snapToGrid, stagePos, stageScale]);

    // Handle Wheel (Zoom)
    const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();
        const stage = e.target.getStage();
        if (!stage) return;

        const scaleBy = 1.1;
        const oldScale = stageScale;
        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        const mousePointTo = {
            x: (pointer.x - stagePos.x) / oldScale,
            y: (pointer.y - stagePos.y) / oldScale,
        };

        const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

        // Limit scale
        const constrainedScale = Math.max(0.1, Math.min(newScale, 10));

        const newPos = {
            x: pointer.x - mousePointTo.x * constrainedScale,
            y: pointer.y - mousePointTo.y * constrainedScale,
        };

        setStageScale(constrainedScale);
        setStagePos(newPos);
    };

    // Handle Drag
    const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
        if (e.target === stageRef.current) {
            setStagePos({ x: e.target.x(), y: e.target.y() });
        }
    };

    const polylineFlatPoints = polylinePoints.flatMap(p => [p.x, p.y]);
    const scalePointsFlatPoints = scalePoints.flatMap(p => [p.x, p.y]);

    const getCursor = () => {
        if (currentTool === 'polyline') return 'crosshair';
        if (currentTool === 'scale') return 'crosshair';
        if (currentTool === 'move') return 'grab';
        return 'default';
    };

    if (size.width === 0 || size.height === 0) {
        return <div className="absolute inset-0 bg-transparent" />;
    }

    return (
        <>
            <div className="absolute inset-0 bg-transparent" style={{ cursor: getCursor() }}>
                <Stage
                    ref={stageRef}
                    width={size.width}
                    height={size.height}
                    draggable={currentTool === 'select' || currentTool === 'move'}
                    onClick={handleStageClick}
                    onDblClick={handleDoubleClick}
                    onMouseMove={handleMouseMove}
                    onWheel={handleWheel}
                    position={stagePos}
                    scaleX={stageScale}
                    scaleY={stageScale}
                    onDragMove={handleDragMove}
                >
                    <Layer>
                        {/* Background Drawing Image */}
                        {backgroundImage && imageStatus === 'loaded' && (
                            <KonvaImage
                                image={backgroundImage}
                                x={0}
                                y={0}
                                opacity={backgroundOpacity}
                                listening={false}
                            />
                        )}

                        <Grid />

                        {/* Completed Polyline: Render Segments */}
                        {polylinePoints.length >= 2 && !isDrawingPolyline && (
                            <>
                                {/* Fill (Background) */}
                                <Line
                                    points={polylineFlatPoints}
                                    closed
                                    fill={colors.fill}
                                    strokeEnabled={false}
                                    listening={false}
                                />

                                {/* Segments */}
                                {polylinePoints.map((point, i) => {
                                    // Handle closed loop: last point connects to first
                                    const nextIndex = (i + 1) % polylinePoints.length;
                                    const nextPoint = polylinePoints[nextIndex];

                                    // Don't render last segment if not closed? 
                                    // But we treat it as closed loop.

                                    const color = getEdgeColor(i);
                                    const isSelected = selectedEdgeIndex === i;

                                    return (
                                        <Line
                                            key={`edge-${i}`}
                                            points={[point.x, point.y, nextPoint.x, nextPoint.y]}
                                            stroke={isSelected ? "#ec4899" : color} // Pink if selected
                                            strokeWidth={isSelected ? 4 : 2}
                                            hitStrokeWidth={10}
                                            onMouseEnter={(e) => {
                                                if (currentTool === 'select') {
                                                    const container = e.target.getStage()?.container();
                                                    if (container) container.style.cursor = "pointer";
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (currentTool === 'select') {
                                                    const container = e.target.getStage()?.container();
                                                    if (container) container.style.cursor = "default";
                                                }
                                            }}
                                            onClick={(e) => {
                                                if (currentTool === 'select') {
                                                    e.cancelBubble = true; // Stop propagation to stage
                                                    // Toggle selection
                                                    setSelectedEdgeIndex(selectedEdgeIndex === i ? null : i);
                                                }
                                            }}
                                        />
                                    );
                                })}
                            </>
                        )}

                        {/* Drawing Polyline (In Progress) */}
                        {polylinePoints.length > 0 && isDrawingPolyline && (
                            <>
                                <Line
                                    points={polylineFlatPoints}
                                    stroke={colors.primary}
                                    strokeWidth={2}
                                    lineCap="round"
                                    lineJoin="round"
                                />
                                {/* Preview line to cursor */}
                                {mousePos && (
                                    <Line
                                        points={[
                                            polylinePoints[polylinePoints.length - 1].x,
                                            polylinePoints[polylinePoints.length - 1].y,
                                            mousePos.x,
                                            mousePos.y,
                                        ]}
                                        stroke={colors.primary}
                                        strokeWidth={1}
                                        dash={[5, 5]}
                                        opacity={0.6}
                                    />
                                )}
                            </>
                        )}

                        {/* Polyline Vertices */}
                        {polylinePoints.map((point, i) => (
                            <Circle
                                key={i}
                                x={point.x}
                                y={point.y}
                                radius={6}
                                fill={i === 0 ? colors.secondary : colors.primary}
                                stroke="#fff"
                                strokeWidth={2}
                            />
                        ))}

                        {/* Scale Setting Points */}
                        {isSettingScale && (
                            <>
                                {scalePoints.map((point, i) => (
                                    <Circle
                                        key={i}
                                        x={point.x}
                                        y={point.y}
                                        radius={8}
                                        fill={colors.secondary}
                                        stroke="#fff"
                                        strokeWidth={2}
                                    />
                                ))}
                                {scalePoints.length === 2 && (
                                    <Line
                                        points={scalePointsFlatPoints}
                                        stroke={colors.secondary}
                                        strokeWidth={2}
                                        dash={[10, 5]}
                                    />
                                )}
                                {scalePoints.length === 1 && mousePos && (
                                    <Line
                                        points={[scalePoints[0].x, scalePoints[0].y, mousePos.x, mousePos.y]}
                                        stroke={colors.secondary}
                                        strokeWidth={1}
                                        dash={[5, 5]}
                                        opacity={0.6}
                                    />
                                )}
                            </>
                        )}

                        {/* Instructions Text */}
                        {(currentTool === 'polyline' || (currentTool === 'scale' && isSettingScale)) && (
                            <Text
                                x={20}
                                y={80}
                                text={
                                    currentTool === 'scale' && isSettingScale
                                        ? `スケール設定: ${scalePoints.length}/2 点をクリック (ESCでキャンセル)`
                                        : `ポリライン: クリックで頂点追加、ダブルクリックで確定 (Shift: 直角固定、ESC: キャンセル)`
                                }
                                fontSize={12}
                                fill={colors.text}
                                fontFamily="sans-serif"
                            />
                        )}
                    </Layer>
                </Stage>
            </div>

            {/* Scale Input Modal */}
            <ScaleInputModal
                isOpen={showScaleModal}
                pixelDistance={pixelDistance}
                onConfirm={handleScaleConfirm}
                onCancel={() => {
                    setShowScaleModal(false);
                    resetScalePoints();
                }}
            />
        </>
    );
}
