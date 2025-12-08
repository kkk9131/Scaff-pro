'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePlanningStore } from '@/store/planningStore';
import {
  Header,
  ToolPalette,
  SidePanel,
  Canvas2D,
  Canvas3D,
  FloatingReferenceViewer,
  DrawingImportDialog,
} from './components';

export function PlanningScreen() {
  const { currentView } = usePlanningStore();
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Handle canvas resize
  useEffect(() => {
    const updateSize = () => {
      if (canvasContainerRef.current) {
        setCanvasSize({
          width: canvasContainerRef.current.offsetWidth,
          height: canvasContainerRef.current.offsetHeight,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Render appropriate canvas based on view
  const renderCanvas = () => {
    switch (currentView) {
      case 'building-plan':
      case 'building-elevation':
      case 'scaffold-plan':
        return <Canvas2D width={canvasSize.width} height={canvasSize.height} />;
      case '3d':
        return <Canvas3D />;
      case 'isometric':
        return <Canvas3D isIsometric />;
      case 'perspective':
        return <Canvas3D isPerspective />;
      default:
        return <Canvas2D width={canvasSize.width} height={canvasSize.height} />;
    }
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-zinc-950">
      {/* Header with view tabs */}
      <Header />

      {/* Main content area */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Left tool palette */}
        <ToolPalette />

        {/* Central canvas area */}
        <div ref={canvasContainerRef} className="relative flex-1 overflow-hidden">
          {renderCanvas()}

          {/* Floating reference viewer */}
          <FloatingReferenceViewer />
        </div>

        {/* Right side panel */}
        <SidePanel />
      </div>

      {/* Drawing import dialog */}
      <DrawingImportDialog />
    </div>
  );
}
