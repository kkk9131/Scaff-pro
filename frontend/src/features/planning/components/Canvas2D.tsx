"use client";

import { Stage, Layer, Line, Circle, Text } from "react-konva";
import { useEffect, useState, useRef, useCallback } from "react";
import { usePlanningStore, type Point } from "@/store/planningStore";
import Konva from "konva";
import { ScaleInputModal } from "./ScaleInputModal";

export function Canvas2D() {
    const [size, setSize] = useState({ width: 0, height: 0 });
    const [mousePos, setMousePos] = useState<Point | null>(null);
    const [showScaleModal, setShowScaleModal] = useState(false);
    const [pixelDistance, setPixelDistance] = useState(0);
    const stageRef = useRef<Konva.Stage>(null);

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
        isDrawingPolyline,
    } = usePlanningStore();

    useEffect(() => {
        setSize({ width: window.innerWidth, height: window.innerHeight });
        const handleResize = () => {
            setSize({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Keyboard handler for canceling polyline
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
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isDrawingPolyline, isSettingScale, cancelPolyline, resetScalePoints]);

    // Calculate distance between two points
    const calcDistance = (p1: Point, p2: Point) => {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    };

    // Handle stage click
    const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        const stage = e.target.getStage();
        if (!stage) return;

        const pos = stage.getPointerPosition();
        if (!pos) return;

        // Convert to stage coordinates (accounting for pan/zoom)
        const transform = stage.getAbsoluteTransform().copy();
        transform.invert();
        const point = transform.point(pos);

        // Scale setting mode
        if (currentTool === 'scale' && isSettingScale) {
            addScalePoint(point);

            // If we now have 2 points, show the modal
            if (scalePoints.length === 1) {
                const dist = calcDistance(scalePoints[0], point);
                setPixelDistance(dist);
                setShowScaleModal(true);
            }
            return;
        }

        // Polyline mode
        if (currentTool === 'polyline') {
            // Apply right-angle snap if shift is pressed
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
    }, [currentTool, isSettingScale, scalePoints, addScalePoint, polylinePoints, addPolylinePoint]);

    // Handle double click to finish polyline
    const handleDoubleClick = useCallback(() => {
        if (currentTool === 'polyline' && polylinePoints.length >= 2) {
            finishPolyline();
        }
    }, [currentTool, polylinePoints, finishPolyline]);

    // Handle scale modal confirm
    const handleScaleConfirm = (realDistanceMm: number) => {
        const scaleValue = pixelDistance / realDistanceMm;
        setScale(scaleValue);
        setShowScaleModal(false);
        resetScalePoints();
    };

    // Mouse move for preview
    const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        const stage = e.target.getStage();
        if (!stage) return;
        const pos = stage.getPointerPosition();
        if (!pos) return;
        const transform = stage.getAbsoluteTransform().copy();
        transform.invert();
        setMousePos(transform.point(pos));
    }, []);

    // Convert polyline points to flat array for Konva Line
    const polylineFlatPoints = polylinePoints.flatMap(p => [p.x, p.y]);
    const scalePointsFlatPoints = scalePoints.flatMap(p => [p.x, p.y]);

    // Cursor style based on tool
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
                    onWheel={(e) => {
                        e.evt.preventDefault();
                        const stage = e.target.getStage();
                        if (!stage) return;
                        const scaleBy = 1.08;
                        const oldScale = stage.scaleX();
                        const pointer = stage.getPointerPosition();
                        if (!pointer) return;
                        const mousePointTo = {
                            x: (pointer.x - stage.x()) / oldScale,
                            y: (pointer.y - stage.y()) / oldScale,
                        };
                        const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
                        stage.scale({ x: newScale, y: newScale });
                        const newPos = {
                            x: pointer.x - mousePointTo.x * newScale,
                            y: pointer.y - mousePointTo.y * newScale,
                        };
                        stage.position(newPos);
                    }}
                >
                    <Layer>
                        {/* Existing Polyline (Completed) */}
                        {polylinePoints.length >= 2 && !isDrawingPolyline && (
                            <Line
                                points={polylineFlatPoints}
                                stroke="#00F0FF"
                                strokeWidth={2}
                                closed
                                fill="rgba(0, 240, 255, 0.1)"
                            />
                        )}

                        {/* Drawing Polyline (In Progress) */}
                        {polylinePoints.length > 0 && isDrawingPolyline && (
                            <>
                                <Line
                                    points={polylineFlatPoints}
                                    stroke="#00F0FF"
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
                                        stroke="#00F0FF"
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
                                fill={i === 0 ? "#FF6B35" : "#00F0FF"}
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
                                        fill="#FF6B35"
                                        stroke="#fff"
                                        strokeWidth={2}
                                    />
                                ))}
                                {scalePoints.length === 2 && (
                                    <Line
                                        points={scalePointsFlatPoints}
                                        stroke="#FF6B35"
                                        strokeWidth={2}
                                        dash={[10, 5]}
                                    />
                                )}
                                {scalePoints.length === 1 && mousePos && (
                                    <Line
                                        points={[scalePoints[0].x, scalePoints[0].y, mousePos.x, mousePos.y]}
                                        stroke="#FF6B35"
                                        strokeWidth={1}
                                        dash={[5, 5]}
                                        opacity={0.6}
                                    />
                                )}
                            </>
                        )}

                        {/* Instructions Text (top-left) */}
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
                                fill="#a1a1aa"
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
