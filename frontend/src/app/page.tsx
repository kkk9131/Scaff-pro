"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { PlanningLayout } from "@/features/planning/layouts/PlanningLayout";
import { ToolPalette } from "@/features/planning/components/ToolPalette";
import { SidePanel } from "@/features/planning/components/SidePanel";
import { ReferenceViewer } from "@/features/planning/components/ReferenceViewer";

// Dynamically import heavy components to avoid SSR issues with Canvas (Konva/Three)
const Canvas2D = dynamic(() => import("@/features/planning/components/Canvas2D").then(m => m.Canvas2D), { ssr: false });
const View3D = dynamic(() => import("@/features/planning/components/View3D").then(m => m.View3D), { ssr: false });

export default function Page() {
  const [currentView, setCurrentView] = useState<"2D" | "3D" | "ISO" | "PERSP">("2D");

  return (
    <PlanningLayout
      currentView={currentView}
      onViewChange={setCurrentView}
      toolPalette={<ToolPalette />}
      sidePanel={<SidePanel />}
      referenceViewer={<ReferenceViewer />}
    >
      {/* Switch content based on view */}
      {currentView === "2D" ? (
        <Canvas2D />
      ) : (
        <View3D viewMode={currentView} />
      )}
    </PlanningLayout>
  );
}
