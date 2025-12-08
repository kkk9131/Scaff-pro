'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Line, Circle, Rect, Group } from 'react-konva';
import type Konva from 'konva';
import { usePlanningStore } from '@/store/planningStore';

interface Canvas2DProps {
  width: number;
  height: number;
}

export function Canvas2D({ width, height }: Canvas2DProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const {
    currentTool,
    gridEnabled,
    snapEnabled,
    outline,
    canvasScale,
    setCanvasScale,
    canvasOffset,
    setCanvasOffset,
    updateVertex,
  } = usePlanningStore();

  // Grid settings
  const gridSize = 50;
  const gridColor = 'rgba(255, 255, 255, 0.05)';

  // Handle wheel zoom
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = canvasScale;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - canvasOffset.x) / oldScale,
        y: (pointer.y - canvasOffset.y) / oldScale,
      };

      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const scaleBy = 1.1;
      const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
      const clampedScale = Math.max(0.1, Math.min(5, newScale));

      setCanvasScale(clampedScale);
      setCanvasOffset({
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      });
    },
    [canvasScale, canvasOffset, setCanvasScale, setCanvasOffset]
  );

  // Handle drag to pan
  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      setCanvasOffset({
        x: e.target.x(),
        y: e.target.y(),
      });
    },
    [setCanvasOffset]
  );

  // Handle vertex drag
  const handleVertexDragEnd = useCallback(
    (vertexId: string, e: Konva.KonvaEventObject<DragEvent>) => {
      let x = e.target.x();
      let y = e.target.y();

      // Snap to grid if enabled
      if (snapEnabled) {
        x = Math.round(x / gridSize) * gridSize;
        y = Math.round(y / gridSize) * gridSize;
        e.target.x(x);
        e.target.y(y);
      }

      updateVertex(vertexId, { x, y });
    },
    [snapEnabled, gridSize, updateVertex]
  );

  // Generate grid lines
  const renderGrid = () => {
    if (!gridEnabled) return null;

    const lines = [];
    const startX = Math.floor(-canvasOffset.x / canvasScale / gridSize) * gridSize - gridSize;
    const startY = Math.floor(-canvasOffset.y / canvasScale / gridSize) * gridSize - gridSize;
    const endX = startX + width / canvasScale + gridSize * 2;
    const endY = startY + height / canvasScale + gridSize * 2;

    // Vertical lines
    for (let x = startX; x < endX; x += gridSize) {
      lines.push(
        <Line
          key={`v-${x}`}
          points={[x, startY, x, endY]}
          stroke={gridColor}
          strokeWidth={1 / canvasScale}
        />
      );
    }

    // Horizontal lines
    for (let y = startY; y < endY; y += gridSize) {
      lines.push(
        <Line
          key={`h-${y}`}
          points={[startX, y, endX, y]}
          stroke={gridColor}
          strokeWidth={1 / canvasScale}
        />
      );
    }

    return lines;
  };

  // Render building outline
  const renderOutline = () => {
    if (!outline || outline.vertices.length < 2) return null;

    const points = outline.vertices.flatMap((v) => [v.x, v.y]);
    if (outline.closed) {
      points.push(outline.vertices[0].x, outline.vertices[0].y);
    }

    return (
      <Group>
        {/* Outline path */}
        <Line
          points={points}
          stroke="#60a5fa"
          strokeWidth={2 / canvasScale}
          lineCap="round"
          lineJoin="round"
          shadowColor="#3b82f6"
          shadowBlur={8}
          shadowOpacity={0.5}
        />
        {/* Vertex handles */}
        {currentTool === 'edit-outline' &&
          outline.vertices.map((vertex) => (
            <Circle
              key={vertex.id}
              x={vertex.x}
              y={vertex.y}
              radius={8 / canvasScale}
              fill="#3b82f6"
              stroke="#ffffff"
              strokeWidth={2 / canvasScale}
              draggable
              onDragEnd={(e) => handleVertexDragEnd(vertex.id, e)}
              onMouseEnter={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'pointer';
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'default';
              }}
            />
          ))}
      </Group>
    );
  };

  // Demo scaffold posts
  const renderScaffoldPreview = () => {
    // This is a placeholder for scaffold visualization
    const posts = [
      { x: 200, y: 200 },
      { x: 400, y: 200 },
      { x: 600, y: 200 },
      { x: 200, y: 400 },
      { x: 400, y: 400 },
      { x: 600, y: 400 },
    ];

    return (
      <Group>
        {posts.map((post, i) => (
          <React.Fragment key={i}>
            <Circle
              x={post.x}
              y={post.y}
              radius={6 / canvasScale}
              fill="#f59e0b"
              stroke="#ffffff"
              strokeWidth={1 / canvasScale}
            />
          </React.Fragment>
        ))}
        {/* Horizontal ledgers */}
        <Line
          points={[200, 200, 600, 200]}
          stroke="#f59e0b"
          strokeWidth={2 / canvasScale}
          dash={[5, 5]}
        />
        <Line
          points={[200, 400, 600, 400]}
          stroke="#f59e0b"
          strokeWidth={2 / canvasScale}
          dash={[5, 5]}
        />
        {/* Vertical posts */}
        <Line points={[200, 200, 200, 400]} stroke="#f59e0b" strokeWidth={2 / canvasScale} />
        <Line points={[400, 200, 400, 400]} stroke="#f59e0b" strokeWidth={2 / canvasScale} />
        <Line points={[600, 200, 600, 400]} stroke="#f59e0b" strokeWidth={2 / canvasScale} />
      </Group>
    );
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-zinc-950">
      {/* Gradient overlay for depth */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-zinc-900/20 via-transparent to-zinc-900/40" />

      <Stage
        ref={stageRef}
        width={width}
        height={height}
        scaleX={canvasScale}
        scaleY={canvasScale}
        x={canvasOffset.x}
        y={canvasOffset.y}
        draggable={currentTool === 'select'}
        onWheel={handleWheel}
        onDragEnd={handleDragEnd}
      >
        <Layer>
          {renderGrid()}
          {renderOutline()}
          {renderScaffoldPreview()}
        </Layer>
      </Stage>

      {/* Scale indicator */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-lg bg-zinc-900/80 px-3 py-2 text-xs text-zinc-400 backdrop-blur-sm">
        <span className="font-mono">{Math.round(canvasScale * 100)}%</span>
      </div>

      {/* Coordinates indicator */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg bg-zinc-900/80 px-3 py-2 text-xs text-zinc-400 backdrop-blur-sm">
        <span className="font-mono">
          X: {Math.round(-canvasOffset.x / canvasScale)} Y: {Math.round(-canvasOffset.y / canvasScale)}
        </span>
      </div>
    </div>
  );
}
