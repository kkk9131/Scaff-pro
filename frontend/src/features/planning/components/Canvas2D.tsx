"use client";

import { Stage, Layer, Line, Circle, Rect } from "react-konva";
import { useEffect, useState } from "react";

export function Canvas2D() {
    const [size, setSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        // Initial size
        setSize({ width: window.innerWidth, height: window.innerHeight });

        const handleResize = () => {
            setSize({ width: window.innerWidth, height: window.innerHeight });
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Mock Data: Building Outline
    const buildingOutline = [300, 300, 800, 300, 800, 700, 300, 700, 300, 300];

    // Mock Data: Scaffold Posts (just a few)
    const posts = [
        { x: 280, y: 280 }, { x: 480, y: 280 }, { x: 680, y: 280 }, { x: 820, y: 280 },
        { x: 820, y: 480 }, { x: 820, y: 680 }, { x: 820, y: 720 },
        { x: 620, y: 720 }, { x: 420, y: 720 }, { x: 280, y: 720 },
        { x: 280, y: 520 },
    ];

    if (size.width === 0 || size.height === 0) {
        return <div className="absolute inset-0 bg-transparent" />;
    }

    return (
        <div className="absolute inset-0 bg-transparent">
            <Stage
                width={size.width}
                height={size.height}
                draggable
                onWheel={(e) => {
                    e.evt.preventDefault();
                    const stage = e.target.getStage();
                    if (!stage) return;

                    const scaleBy = 1.05;
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
                    {/* Background Grid Accent (Konva implementation of grid is optional as we have CSS bg, but maybe practical for snapping) */}

                    {/* Building Fill */}
                    <Line
                        points={buildingOutline}
                        closed
                        fill="#1e1e1e"
                        stroke="#fff"
                        strokeWidth={2}
                        opacity={0.8}
                    />

                    {/* Scaffold Layer */}
                    {posts.map((pos, i) => (
                        <Circle key={i} x={pos.x} y={pos.y} radius={5} fill="#FF6B35" shadowBlur={5} shadowColor="#FF6B35" />
                    ))}

                    {/* Connection Lines (Mock) */}
                    <Line points={[280, 280, 820, 280]} stroke="#FF6B35" strokeWidth={2} opacity={0.5} />
                    <Line points={[820, 280, 820, 720]} stroke="#FF6B35" strokeWidth={2} opacity={0.5} />
                    <Line points={[820, 720, 280, 720]} stroke="#FF6B35" strokeWidth={2} opacity={0.5} />
                    <Line points={[280, 720, 280, 280]} stroke="#FF6B35" strokeWidth={2} opacity={0.5} />

                </Layer>
            </Stage>
        </div>
    );
}
