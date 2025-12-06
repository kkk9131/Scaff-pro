"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Line, OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import { useThemeStore } from "@/store/themeStore";
import { usePlanningStore, type Point, type EdgeAttribute } from "@/store/planningStore";
import { useMemo } from "react";
import * as THREE from "three";

interface BuildingMeshProps {
    points: Point[];
    floorHeight: number;
    totalFloors: number;
    roofHeight: number;
    scale: number | null;
    edgeAttributes: Record<number, EdgeAttribute>;
    colors: {
        full: string;      // Full height walls
        partial: string;   // Partial walls (1F only, etc.)
        upper: string;     // Upper-only walls (2F+)
        floor: string;     // Floor lines
    };
}

function BuildingMesh({ points, floorHeight, totalFloors, roofHeight, scale, edgeAttributes, colors }: BuildingMeshProps) {
    const wallData = useMemo(() => {
        if (points.length < 3) return [];

        const scaleFactor = scale ? 1 / (scale * 1000) : 0.01;

        const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length;
        const cy = points.reduce((sum, p) => sum + p.y, 0) / points.length;

        const pts3d = points.map(p => ({
            x: (p.x - cx) * scaleFactor,
            z: (p.y - cy) * scaleFactor,
        }));

        const fullHeight = (floorHeight * totalFloors + roofHeight) / 1000;
        const floorH = floorHeight / 1000;

        const walls: { line: [number, number, number][]; color: string }[] = [];

        for (let i = 0; i < pts3d.length; i++) {
            const next = (i + 1) % pts3d.length;
            const attr = edgeAttributes[i] || { startFloor: 1, endFloor: totalFloors };

            // Calculate wall start and end Y (each wall gets its own roof portion)
            const wallStartY = (attr.startFloor - 1) * floorH;
            const wallEndY = attr.endFloor * floorH + roofHeight / 1000;

            // Determine color based on floor range
            let wallColor = colors.full;
            if (attr.startFloor === 1 && attr.endFloor === totalFloors) {
                wallColor = colors.full; // Full height
            } else if (attr.startFloor === 1 && attr.endFloor < totalFloors) {
                wallColor = colors.partial; // Lower only (green)
            } else if (attr.startFloor > 1) {
                wallColor = colors.upper; // Upper only (yellow)
            } else {
                wallColor = colors.partial; // Custom partial (orange)
            }

            // Vertical edge at START of wall segment (point i)
            walls.push({
                line: [
                    [pts3d[i].x, wallStartY, pts3d[i].z],
                    [pts3d[i].x, wallEndY, pts3d[i].z],
                ],
                color: wallColor
            });

            // Vertical edge at END of wall segment (point next)
            walls.push({
                line: [
                    [pts3d[next].x, wallStartY, pts3d[next].z],
                    [pts3d[next].x, wallEndY, pts3d[next].z],
                ],
                color: wallColor
            });

            // Top horizontal edge
            walls.push({
                line: [
                    [pts3d[i].x, wallEndY, pts3d[i].z],
                    [pts3d[next].x, wallEndY, pts3d[next].z],
                ],
                color: wallColor
            });

            // Bottom horizontal edge (always draw to create complete box)
            walls.push({
                line: [
                    [pts3d[i].x, wallStartY, pts3d[i].z],
                    [pts3d[next].x, wallStartY, pts3d[next].z],
                ],
                color: wallColor
            });

            // Floor lines within this wall's range
            for (let f = attr.startFloor; f < attr.endFloor; f++) {
                const y = f * floorH;
                walls.push({
                    line: [
                        [pts3d[i].x, y, pts3d[i].z],
                        [pts3d[next].x, y, pts3d[next].z],
                    ],
                    color: colors.floor
                });
            }

            // Ceiling line at top of wall's range (for all walls - shows the "roof" of each section)
            const ceilingY = attr.endFloor * floorH;
            walls.push({
                line: [
                    [pts3d[i].x, ceilingY, pts3d[i].z],
                    [pts3d[next].x, ceilingY, pts3d[next].z],
                ],
                color: colors.floor
            });
        }

        return walls;
    }, [points, floorHeight, totalFloors, roofHeight, scale, edgeAttributes, colors]);

    if (wallData.length === 0) return null;

    return (
        <group>
            {wallData.map((wall, i) => (
                <Line
                    key={i}
                    points={wall.line}
                    color={wall.color}
                    lineWidth={1.5}
                />
            ))}
        </group>
    );
}

interface View3DProps {
    viewMode?: "3D" | "ISO" | "PERSP";
}

export function View3D({ viewMode = "3D" }: View3DProps) {
    const { polylinePoints, building, scale, edgeAttributes } = usePlanningStore();
    const hasBuilding = polylinePoints.length >= 3;

    // Camera positions for different modes
    const cameraConfig = {
        "3D": { position: [20, 15, 20] as [number, number, number], enableRotate: true },
        "PERSP": { position: [25, 12, 5] as [number, number, number], enableRotate: false }, // Fixed 45° presentation angle
        "ISO": { position: [30, 24, 30] as [number, number, number], enableRotate: false },
    };

    const config = cameraConfig[viewMode];

    // View mode labels
    const viewLabels = {
        "3D": "3D自由視点",
        "PERSP": "パース（固定）",
        "ISO": "等角投影",
    };

    const { theme } = useThemeStore();

    // Theme Colors
    const isDark = theme === 'dark';
    const colors = {
        wireframe: isDark ? "#00F0FF" : "#3B82F6",
        gridSection: isDark ? "#333" : "#94A3B8",
        gridCell: isDark ? "#222" : "#CBD5E1",
        lightMain: isDark ? "#00F0FF" : "#3B82F6",
        lightSub: isDark ? "#FF6B35" : "#F97316",
        ambientIntensity: isDark ? 0.4 : 0.7,
    };

    // Colors for building walls based on floor range
    const buildingColors = {
        full: colors.wireframe,     // Full height - theme color
        partial: "#22c55e",         // 1F only - green
        upper: "#eab308",           // 2F+ - yellow
        floor: isDark ? "#666" : "#94A3B8", // Floor lines - muted
    };

    return (
        <div className="absolute inset-0 bg-transparent">
            <Canvas>
                {/* Camera based on view mode */}
                {viewMode === "ISO" ? (
                    <OrthographicCamera
                        makeDefault
                        zoom={40}
                        position={config.position}
                        near={0.1}
                        far={1000}
                    />
                ) : (
                    <PerspectiveCamera
                        makeDefault
                        fov={viewMode === "PERSP" ? 35 : 50} // Narrower FOV for presentation
                        position={config.position}
                        near={0.1}
                        far={1000}
                    />
                )}

                <ambientLight intensity={colors.ambientIntensity} />
                <pointLight position={[10, 20, 10]} intensity={0.8} color={colors.lightMain} />
                <pointLight position={[-10, 10, -10]} intensity={0.4} color={colors.lightSub} />

                <Grid
                    infiniteGrid
                    fadeDistance={50}
                    sectionColor={colors.gridSection}
                    cellColor={colors.gridCell}
                    sectionSize={5}
                    cellSize={1}
                />

                {hasBuilding && (
                    <BuildingMesh
                        points={polylinePoints}
                        floorHeight={building.floorHeight}
                        totalFloors={building.totalFloors}
                        roofHeight={building.roofHeight}
                        scale={scale}
                        edgeAttributes={edgeAttributes}
                        colors={buildingColors}
                    />
                )}

                <OrbitControls
                    makeDefault
                    enableRotate={config.enableRotate}
                    enablePan={true}
                    enableZoom={true}
                />
            </Canvas>

            {!hasBuilding && (
                <div className="absolute top-4 left-4 p-3 bg-surface-1/80 backdrop-blur rounded-lg border border-surface-3 text-sm text-text-muted">
                    2Dビューでポリラインを描いてください
                </div>
            )}
        </div>
    );
}
