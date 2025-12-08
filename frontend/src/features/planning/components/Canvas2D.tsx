'use client';

import React, { useRef, useCallback, useMemo } from 'react';
import { Stage, Layer, Line, Circle, Rect, Group, Image, Text, Arrow } from 'react-konva';
import type Konva from 'konva';
import { usePlanningStore } from '@/store/planningStore';
import useImage from 'use-image';
import type { DrawingFile, ExtractedDimension, ExtractedEntrance, ExtractedOutline } from '@/types';

interface Canvas2DProps {
  width: number;
  height: number;
}

// Floor colors for visual distinction
const FLOOR_COLORS: Record<number, string> = {
  1: '#3b82f6', // blue
  2: '#10b981', // green
  3: '#f59e0b', // amber
  4: '#ef4444', // red
  5: '#8b5cf6', // purple
};

// Background image component
interface BackgroundImageProps {
  url: string;
  opacity: number;
  scale: number;
}

function BackgroundImage({ url, opacity, scale }: BackgroundImageProps) {
  const [image] = useImage(url);

  if (!image) return null;

  return (
    <Image
      image={image}
      opacity={opacity}
      scaleX={scale}
      scaleY={scale}
      x={0}
      y={0}
    />
  );
}

// Extracted outline component
interface OutlineOverlayProps {
  outlines: ExtractedOutline[];
  canvasScale: number;
}

function OutlineOverlay({ outlines, canvasScale }: OutlineOverlayProps) {
  return (
    <Group>
      {outlines.map((outline, index) => {
        const points = outline.vertices.flatMap((v) => [v.x, v.y]);
        // Close the polygon
        if (outline.vertices.length > 0) {
          points.push(outline.vertices[0].x, outline.vertices[0].y);
        }

        return (
          <React.Fragment key={index}>
            {/* Outer glow */}
            <Line
              points={points}
              stroke={outline.color}
              strokeWidth={4 / canvasScale}
              lineCap="round"
              lineJoin="round"
              opacity={0.3}
            />
            {/* Main line */}
            <Line
              points={points}
              stroke={outline.color}
              strokeWidth={2 / canvasScale}
              lineCap="round"
              lineJoin="round"
              shadowColor={outline.color}
              shadowBlur={8}
              shadowOpacity={0.5}
            />
            {/* Floor label */}
            {outline.vertices.length > 0 && (
              <Group x={outline.vertices[0].x + 10} y={outline.vertices[0].y - 20}>
                <Rect
                  width={30 / canvasScale}
                  height={18 / canvasScale}
                  fill={outline.color}
                  cornerRadius={3 / canvasScale}
                />
                <Text
                  text={`${outline.floor}F`}
                  fontSize={12 / canvasScale}
                  fill="white"
                  width={30 / canvasScale}
                  height={18 / canvasScale}
                  align="center"
                  verticalAlign="middle"
                />
              </Group>
            )}
          </React.Fragment>
        );
      })}
    </Group>
  );
}

// Entrance markers component
interface EntranceMarkersProps {
  entrances: ExtractedEntrance[];
  canvasScale: number;
}

function EntranceMarkers({ entrances, canvasScale }: EntranceMarkersProps) {
  return (
    <Group>
      {entrances.map((entrance) => {
        const markerColor = entrance.type === 'main-entrance' ? '#ef4444' : '#f59e0b';

        return (
          <Group key={entrance.id} x={entrance.position.x} y={entrance.position.y}>
            {/* Door symbol */}
            <Rect
              width={entrance.width * 0.01}
              height={8 / canvasScale}
              fill={markerColor}
              offsetX={(entrance.width * 0.01) / 2}
              offsetY={4 / canvasScale}
              cornerRadius={2 / canvasScale}
            />
            {/* Label background */}
            <Rect
              y={-25 / canvasScale}
              width={Math.max(50, entrance.label.length * 8) / canvasScale}
              height={18 / canvasScale}
              fill="rgba(0, 0, 0, 0.7)"
              offsetX={Math.max(50, entrance.label.length * 8) / canvasScale / 2}
              cornerRadius={3 / canvasScale}
            />
            {/* Label text */}
            <Text
              text={entrance.label}
              fontSize={12 / canvasScale}
              fill="white"
              y={-25 / canvasScale}
              width={Math.max(50, entrance.label.length * 8) / canvasScale}
              height={18 / canvasScale}
              align="center"
              verticalAlign="middle"
              offsetX={Math.max(50, entrance.label.length * 8) / canvasScale / 2}
            />
          </Group>
        );
      })}
    </Group>
  );
}

// Dimension lines component
interface DimensionLinesProps {
  dimensions: ExtractedDimension[];
  canvasScale: number;
}

function DimensionLines({ dimensions, canvasScale }: DimensionLinesProps) {
  return (
    <Group>
      {dimensions.map((dim) => {
        const dx = dim.end.x - dim.start.x;
        const dy = dim.end.y - dim.start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        // Midpoint for label
        const midX = (dim.start.x + dim.end.x) / 2;
        const midY = (dim.start.y + dim.end.y) / 2;

        // Offset perpendicular to line for label
        const offsetDist = 15 / canvasScale;
        const labelX = midX - Math.sin(angle) * offsetDist;
        const labelY = midY + Math.cos(angle) * offsetDist;

        return (
          <Group key={dim.id}>
            {/* Extension lines */}
            <Line
              points={[
                dim.start.x - Math.sin(angle) * (10 / canvasScale),
                dim.start.y + Math.cos(angle) * (10 / canvasScale),
                dim.start.x - Math.sin(angle) * (25 / canvasScale),
                dim.start.y + Math.cos(angle) * (25 / canvasScale),
              ]}
              stroke="#888888"
              strokeWidth={1 / canvasScale}
            />
            <Line
              points={[
                dim.end.x - Math.sin(angle) * (10 / canvasScale),
                dim.end.y + Math.cos(angle) * (10 / canvasScale),
                dim.end.x - Math.sin(angle) * (25 / canvasScale),
                dim.end.y + Math.cos(angle) * (25 / canvasScale),
              ]}
              stroke="#888888"
              strokeWidth={1 / canvasScale}
            />
            {/* Dimension line with arrows */}
            <Arrow
              points={[
                dim.start.x - Math.sin(angle) * (20 / canvasScale),
                dim.start.y + Math.cos(angle) * (20 / canvasScale),
                dim.end.x - Math.sin(angle) * (20 / canvasScale),
                dim.end.y + Math.cos(angle) * (20 / canvasScale),
              ]}
              stroke="#888888"
              strokeWidth={1 / canvasScale}
              fill="#888888"
              pointerLength={6 / canvasScale}
              pointerWidth={4 / canvasScale}
              pointerAtBeginning={true}
            />
            {/* Label background */}
            <Rect
              x={labelX}
              y={labelY}
              width={dim.label.length * 7 / canvasScale}
              height={16 / canvasScale}
              fill="rgba(0, 0, 0, 0.8)"
              offsetX={(dim.label.length * 7 / canvasScale) / 2}
              offsetY={8 / canvasScale}
              cornerRadius={2 / canvasScale}
            />
            {/* Dimension text */}
            <Text
              x={labelX}
              y={labelY}
              text={dim.label}
              fontSize={11 / canvasScale}
              fill="#ffffff"
              offsetX={(dim.label.length * 3.5) / canvasScale}
              offsetY={5.5 / canvasScale}
            />
          </Group>
        );
      })}
    </Group>
  );
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
    // Background drawing state
    drawings,
    backgroundDrawingId,
    backgroundOpacity,
    showFloorOutlines,
    showDimensions,
    showEntrances,
  } = usePlanningStore();

  // Get background drawing
  const backgroundDrawing = useMemo(() => {
    if (!backgroundDrawingId) return null;
    return drawings.find((d: DrawingFile) => d.id === backgroundDrawingId) || null;
  }, [drawings, backgroundDrawingId]);

  // Debug: log background drawing state
  React.useEffect(() => {
    console.log('[Canvas2D] backgroundDrawingId:', backgroundDrawingId);
    console.log('[Canvas2D] backgroundDrawing:', backgroundDrawing);
    console.log('[Canvas2D] processedData:', backgroundDrawing?.processedData);
    console.log('[Canvas2D] showFloorOutlines:', showFloorOutlines);
  }, [backgroundDrawingId, backgroundDrawing, showFloorOutlines]);

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

  // Render background drawing overlay
  const renderBackgroundOverlay = () => {
    if (!backgroundDrawing || backgroundDrawing.status !== 'ready') return null;

    const processedData = backgroundDrawing.processedData;

    return (
      <Group>
        {/* Background image (semi-transparent) */}
        {backgroundDrawing.url && (
          <BackgroundImage
            url={backgroundDrawing.url}
            opacity={backgroundOpacity * 0.5}
            scale={processedData?.scale || 1}
          />
        )}

        {/* Extracted outlines with floor colors */}
        {showFloorOutlines && processedData?.outlines && (
          <OutlineOverlay
            outlines={processedData.outlines}
            canvasScale={canvasScale}
          />
        )}

        {/* Entrance markers */}
        {showEntrances && processedData?.entrances && (
          <EntranceMarkers
            entrances={processedData.entrances}
            canvasScale={canvasScale}
          />
        )}

        {/* Dimension lines */}
        {showDimensions && processedData?.dimensions && (
          <DimensionLines
            dimensions={processedData.dimensions}
            canvasScale={canvasScale}
          />
        )}
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
        {/* Background layer for imported drawings */}
        <Layer>
          {renderBackgroundOverlay()}
        </Layer>

        {/* Main working layer */}
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
