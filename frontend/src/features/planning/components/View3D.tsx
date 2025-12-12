"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Line, OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import { useThemeStore } from "@/store/themeStore";
import { usePlanningStore, type Point, type EdgeAttribute, type WallConfig, type RoofConfig, FLOOR_COLORS } from "@/store/planningStore";
import { useMemo } from "react";
import * as THREE from "three";

interface BuildingMeshProps {
    points: Point[];
    floorHeight: number;
    totalFloors: number;
    roofHeight: number;
    scale: number | null;
    edgeAttributes: Record<number, EdgeAttribute>;
    wall: WallConfig;
    roof: RoofConfig; // Roof configuration for overhang/shape
    colors: {
        full: string;      // Full height walls
        partial: string;   // Partial walls (1F only, etc.)
        upper: string;     // Upper-only walls (2F+)
        floor: string;     // Floor lines
        innerWall: string; // Inner wall line (centerline mode)
        outerWall: string; // Outer wall line (centerline mode)
    };
}

// Helper function to calculate polygon winding (positive = counterclockwise)
function calculatePolygonArea(pts: { x: number; z: number }[]): number {
    let area = 0;
    const n = pts.length;
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        area += pts[i].x * pts[j].z;
        area -= pts[j].x * pts[i].z;
    }
    return area / 2;
}

// Helper function to calculate offset points for centerline mode
// Supports both closed polygons and open polylines
function calculateOffsetPoints(
    pts3d: { x: number; z: number }[],
    offsetDistance: number,
    direction: 'inner' | 'outer'
): { x: number; z: number }[] {
    let points = [...pts3d];
    let isClosed = false;

    // Check if polygon is closed (first and last points are the same)
    if (points.length > 1) {
        const first = points[0];
        const last = points[points.length - 1];
        const dist = Math.sqrt((first.x - last.x) ** 2 + (first.z - last.z) ** 2);
        if (dist < 0.0001) {
            points = points.slice(0, -1); // Remove duplicate closing point
            isClosed = true;
            console.log('Closed polygon detected, removed duplicate point, new length:', points.length);
        }
    }

    const n = points.length;

    if (n < 2) {
        console.log('calculateOffsetPoints: not enough points', n);
        return [...pts3d];
    }

    // For open polylines (2+ points), use simple perpendicular offset
    // For closed polygons (3+ points), use polygon winding to determine inside/outside
    let sign = direction === 'outer' ? 1 : -1;

    if (isClosed && n >= 3) {
        // Determine polygon winding direction for closed polygons
        const area = calculatePolygonArea(points);
        const isCounterClockwise = area > 0;
        console.log('calculateOffsetPoints (closed):', { n, area, isCounterClockwise, offsetDistance, direction });

        if (!isCounterClockwise) {
            sign = -sign; // Flip for clockwise polygons
        }
    } else {
        console.log('calculateOffsetPoints (open):', { n, offsetDistance, direction });
    }

    const result: { x: number; z: number }[] = [];

    for (let i = 0; i < n; i++) {
        let edge1: { x: number; z: number };
        let edge2: { x: number; z: number };

        if (isClosed) {
            // Closed polygon: wrap around
            const prev = points[(i - 1 + n) % n];
            const curr = points[i];
            const next = points[(i + 1) % n];
            edge1 = { x: curr.x - prev.x, z: curr.z - prev.z };
            edge2 = { x: next.x - curr.x, z: next.z - curr.z };
        } else {
            // Open polyline: handle endpoints specially
            const curr = points[i];

            if (i === 0) {
                // First point: only outgoing edge
                const next = points[i + 1];
                edge1 = { x: next.x - curr.x, z: next.z - curr.z };
                edge2 = edge1; // Use same edge for both
            } else if (i === n - 1) {
                // Last point: only incoming edge
                const prev = points[i - 1];
                edge1 = { x: curr.x - prev.x, z: curr.z - prev.z };
                edge2 = edge1; // Use same edge for both
            } else {
                // Middle point: both edges
                const prev = points[i - 1];
                const next = points[i + 1];
                edge1 = { x: curr.x - prev.x, z: curr.z - prev.z };
                edge2 = { x: next.x - curr.x, z: next.z - curr.z };
            }
        }

        const curr = points[i];

        // Calculate edge lengths
        const len1 = Math.sqrt(edge1.x * edge1.x + edge1.z * edge1.z);
        const len2 = Math.sqrt(edge2.x * edge2.x + edge2.z * edge2.z);

        if (len1 < 0.0001 || len2 < 0.0001) {
            console.log(`Point ${i}: edge too short`, { len1, len2 });
            result.push({ x: curr.x, z: curr.z });
            continue;
        }

        // Normalize edge vectors
        const dir1 = { x: edge1.x / len1, z: edge1.z / len1 };
        const dir2 = { x: edge2.x / len2, z: edge2.z / len2 };

        // Calculate perpendicular (normal) vectors pointing to the left of each edge
        const normal1 = { x: -dir1.z, z: dir1.x };
        const normal2 = { x: -dir2.z, z: dir2.x };

        // Average the normals for the corner bisector direction
        const bisector = {
            x: normal1.x + normal2.x,
            z: normal1.z + normal2.z
        };

        const bisectorLen = Math.sqrt(bisector.x * bisector.x + bisector.z * bisector.z);

        if (bisectorLen < 0.0001) {
            // Edges are parallel (or same direction for endpoints), use single normal
            const offsetPt = {
                x: curr.x + normal1.x * offsetDistance * sign,
                z: curr.z + normal1.z * offsetDistance * sign
            };
            result.push(offsetPt);
            continue;
        }

        // Normalize bisector
        const bisectorNorm = {
            x: bisector.x / bisectorLen,
            z: bisector.z / bisectorLen
        };

        // Calculate miter length to maintain consistent wall thickness
        const dotProduct = dir1.x * dir2.x + dir1.z * dir2.z;
        const cosHalfAngle = Math.sqrt((1 + dotProduct) / 2);

        // Clamp miter length to avoid extremely long miters at sharp corners
        const miterLength = cosHalfAngle > 0.1
            ? offsetDistance / cosHalfAngle
            : offsetDistance * 2;

        const offsetPt = {
            x: curr.x + bisectorNorm.x * miterLength * sign,
            z: curr.z + bisectorNorm.z * miterLength * sign
        };

        result.push(offsetPt);
    }

    // If we removed a duplicate closing point, add it back to match original array length
    if (isClosed && result.length > 0 && result.length < pts3d.length) {
        result.push({ ...result[0] });
    }

    return result;
}

function BuildingMesh({ points, floorHeight, totalFloors, roofHeight, scale, edgeAttributes, wall, roof, colors }: BuildingMeshProps) {
    const wallData = useMemo(() => {
        if (points.length < 3) return { walls: [], meshes: [] };

        const scaleFactor = scale ? 1 / (scale * 1000) : 0.01;

        const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length;
        const cy = points.reduce((sum, p) => sum + p.y, 0) / points.length;

        const pts3d = points.map(p => ({
            x: (p.x - cx) * scaleFactor,
            z: (p.y - cy) * scaleFactor,
        }));

        const floorH = floorHeight / 1000;
        const walls: { line: [number, number, number][]; color: string; dashed?: boolean }[] = [];
        const meshes: { positions: Float32Array; color: string }[] = [];

        // Calculate offset distance in 3D units
        // wall.thickness is in mm, need to apply same scaleFactor as pts3d
        // scaleFactor converts canvas pixels to 3D meters
        // For the offset, we need: (thickness_mm / 2) * scaleFactor
        // But scaleFactor = 1 / (scale * 1000), where scale is pixels per mm
        // So offset in 3D = (thickness_mm / 2) / 1000 = thickness in meters / 2
        const offsetDistance = (wall.thickness / 2) / 1000; // mm to meters

        // Get offset points for centerline mode
        const outerPts = wall.dimensionMode === 'centerline'
            ? calculateOffsetPoints(pts3d, offsetDistance, 'outer')
            : pts3d;
        const innerPts = wall.dimensionMode === 'centerline'
            ? calculateOffsetPoints(pts3d, offsetDistance, 'inner')
            : pts3d;

        // Debug: log offset calculation
        if (wall.dimensionMode === 'centerline' && pts3d.length > 0) {
            console.log('Centerline mode debug:', {
                offsetDistance,
                originalPoint0: pts3d[0],
                outerPoint0: outerPts[0],
                innerPoint0: innerPts[0],
                diff_outer: {
                    x: outerPts[0].x - pts3d[0].x,
                    z: outerPts[0].z - pts3d[0].z
                },
                diff_inner: {
                    x: innerPts[0].x - pts3d[0].x,
                    z: innerPts[0].z - pts3d[0].z
                }
            });
        }

        // Helper function to draw wall wireframe for a set of points
        const drawWallWireframe = (
            wallPts: { x: number; z: number }[],
            wallColor: string,
            attr: EdgeAttribute,
            segmentIndex: number,
            isClosed: boolean
        ) => {
            // Retired this helper in favor of inline loop below for flexibility
        };

        // Detect if polyline is closed (first and last points are the same)
        const isClosed = pts3d.length > 1 &&
            Math.abs(pts3d[0].x - pts3d[pts3d.length - 1].x) < 0.0001 &&
            Math.abs(pts3d[0].z - pts3d[pts3d.length - 1].z) < 0.0001;

        // Number of segments should be equal to the number of points minus 1
        // (If closed, the last point is same as first, so we effectively have N-1 segments connecting N-1 unique points plus the closing segment)
        // Wait, if points are [A, B, C, A], length is 4. Segments are A->B, B->C, C->A. Total 3 segments.
        // Loop should run 3 times. i=0, 1, 2.
        // i=0: pts[0]->pts[1] (A->B)
        // i=1: pts[1]->pts[2] (B->C)
        // i=2: pts[2]->pts[3] (C->A)
        // correct.

        // If open: [A, B, C], length 3. Segments A->B, B->C. Total 2 segments.
        // Loop runs 2 times. i=0, 1.
        // i=0: pts[0]->pts[1]
        // i=1: pts[1]->pts[2]

        // So numSegments = pts3d.length - 1 ALWAYS.
        const numSegments = pts3d.length - 1;

        // console.log('Drawing walls:', { numPoints: pts3d.length, isClosed, numSegments });

        for (let i = 0; i < numSegments; i++) {
            const attr = edgeAttributes[i] || { startFloor: 1, endFloor: totalFloors };

            // Define points for this segment
            const p1 = pts3d[i];
            const p2 = pts3d[i + 1];

            // For centerline mode, we need corresponding inner/outer points
            // Since innerPts/outerPts are calculated from pts3d, they should align index-wise.
            // However, calculateOffsetPoints returns polygon points.
            // If closed, calculateOffsetPoints usually returns same number of points.
            // Let's assume indices align.

            // Draw wall segments per floor to show hierarchy by color
            for (let f = attr.startFloor; f <= attr.endFloor; f++) {
                const wallColor = FLOOR_COLORS[f] || colors.full;

                const segmentStartY = (f - 1) * floorH;
                const segmentEndY = f * floorH + (f === attr.endFloor ? roofHeight / 1000 : 0);

                // Add Mesh for transparent fill
                // Two triangles for the quad formed by p1-bottom, p2-bottom, p2-top, p1-top
                // Vertices:
                // v0: p1, startY
                // v1: p2, startY
                // v2: p1, endY
                // v3: p2, endY
                // Triangles: v0-v1-v2, v1-v3-v2

                const v0 = [p1.x, segmentStartY, p1.z];
                const v1 = [p2.x, segmentStartY, p2.z];
                const v2 = [p1.x, segmentEndY, p1.z];
                const v3 = [p2.x, segmentEndY, p2.z];

                const positions = new Float32Array([
                    ...v0, ...v1, ...v2,
                    ...v1, ...v3, ...v2
                ]);

                meshes.push({
                    positions,
                    color: wallColor
                });

                if (wall.dimensionMode === 'centerline') {
                    const op1 = outerPts[i];
                    const op2 = outerPts[i + 1];
                    const ip1 = innerPts[i];
                    const ip2 = innerPts[i + 1];

                    // Outer Vertical
                    walls.push({
                        line: [[op1.x, segmentStartY, op1.z], [op1.x, segmentEndY, op1.z]],
                        color: colors.outerWall
                    });
                    walls.push({
                        line: [[op2.x, segmentStartY, op2.z], [op2.x, segmentEndY, op2.z]],
                        color: colors.outerWall
                    });

                    // Horizontal (Top) for Outer - Roof Top
                    walls.push({
                        line: [[op1.x, segmentEndY, op1.z], [op2.x, segmentEndY, op2.z]],
                        color: wallColor,
                        // dashed: true
                    });
                    // Horizontal (Bottom) for Outer - Solid Floor
                    walls.push({
                        line: [[op1.x, segmentStartY, op1.z], [op2.x, segmentStartY, op2.z]],
                        color: colors.floor
                    });

                    // Inner Vertical
                    walls.push({
                        line: [[ip1.x, segmentStartY, ip1.z], [ip1.x, segmentEndY, ip1.z]],
                        color: colors.innerWall
                    });
                    walls.push({
                        line: [[ip2.x, segmentStartY, ip2.z], [ip2.x, segmentEndY, ip2.z]],
                        color: colors.innerWall
                    });

                    // Horizontal (Top) for Inner - Dashed Roof
                    walls.push({
                        line: [[ip1.x, segmentEndY, ip1.z], [ip2.x, segmentEndY, ip2.z]],
                        color: wallColor,
                        // dashed: true
                    });
                    // Horizontal (Bottom) for Inner
                    walls.push({
                        line: [[ip1.x, segmentStartY, ip1.z], [ip2.x, segmentStartY, ip2.z]],
                        color: colors.floor
                    });

                    // Connectors (Thickness) - only at start of segment?
                    // No, connectors should be at "corners".
                    // But if we draw connectors for EVERY segment start/end, we duplicate connectors at shared vertices.
                    // It's inefficient but safer visually for wireframe.
                    // Actually, duplicates in Three.js Lines are fine.

                    walls.push({ line: [[ip1.x, segmentStartY, ip1.z], [op1.x, segmentStartY, op1.z]], color: colors.floor });
                    walls.push({ line: [[ip2.x, segmentStartY, ip2.z], [op2.x, segmentStartY, op2.z]], color: colors.floor });
                    walls.push({ line: [[ip1.x, segmentEndY, ip1.z], [op1.x, segmentEndY, op1.z]], color: colors.floor });
                    walls.push({ line: [[ip2.x, segmentEndY, ip2.z], [op2.x, segmentEndY, op2.z]], color: colors.floor });

                } else {
                    // Actual Mode - Colored Wireframe

                    // Vertical
                    walls.push({
                        line: [[p1.x, segmentStartY, p1.z], [p1.x, segmentEndY, p1.z]],
                        color: wallColor
                    });
                    walls.push({
                        line: [[p2.x, segmentStartY, p2.z], [p2.x, segmentEndY, p2.z]],
                        color: wallColor
                    });

                    // Horizontal bounds (Top) - Roof Top in Floor Color (Solid)
                    walls.push({
                        line: [[p1.x, segmentEndY, p1.z], [p2.x, segmentEndY, p2.z]],
                        color: wallColor,
                        // dashed: true // Reverting to solid
                    });

                    // If this is the top floor segment and includes roof height, draw the "Ceiling" line at standard height
                    if (f === attr.endFloor && roofHeight > 0) {
                        const standardCeilingY = f * floorH;
                        walls.push({
                            line: [[p1.x, standardCeilingY, p1.z], [p2.x, standardCeilingY, p2.z]],
                            color: colors.floor // Gray ceiling line
                        });
                    }

                    // Horizontal bounds (Bottom) - Solid Floor (Standard Grey)
                    walls.push({
                        line: [[p1.x, segmentStartY, p1.z], [p2.x, segmentStartY, p2.z]],
                        color: colors.floor
                    });
                }
            }
        }

        return { walls, meshes };
    }, [points, floorHeight, totalFloors, roofHeight, scale, edgeAttributes, wall, colors]);

    if (wallData.walls.length === 0) return null;

    return (
        <group>
            {wallData.meshes.map((mesh, i) => (
                <mesh key={`mesh-${i}`}>
                    <bufferGeometry>
                        <bufferAttribute
                            attach="attributes-position"
                            count={mesh.positions.length / 3}
                            args={[mesh.positions, 3]}
                        />
                    </bufferGeometry>
                    <meshBasicMaterial
                        color={mesh.color}
                        transparent
                        opacity={0.1}
                        side={THREE.DoubleSide}
                        depthWrite={false} // Prevent z-fighting with lines
                    />
                </mesh>
            ))}
            {wallData.walls.map((wall, i) => (
                <Line
                    key={`line-${i}`}
                    points={wall.line}
                    color={wall.color}
                    lineWidth={1.5}
                    dashed={wall.dashed}
                    dashScale={wall.dashed ? 0.3 : undefined}
                    dashSize={wall.dashed ? 1 : undefined}
                    gapSize={wall.dashed ? 0.5 : undefined}
                />
            ))}
        </group>
    );
}

interface View3DProps {
    viewMode?: "3D" | "ISO" | "PERSP";
}

export function View3D({ viewMode = "3D" }: View3DProps) {
    const { polylinePoints, building, scale, edgeAttributes, wall, roof } = usePlanningStore();
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
        innerWall: isDark ? "#FF6B35" : "#F97316", // Inner wall (centerline mode) - orange
        outerWall: colors.wireframe, // Outer wall (centerline mode) - theme color
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
                        wall={wall}
                        roof={roof}
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
