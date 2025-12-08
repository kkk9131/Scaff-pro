'use client';

import React from 'react';
import Link from 'next/link';
import { usePlanningStore } from '@/store/planningStore';
import { ArrowLeftIcon, ImageIcon, CubeIcon, PlayIcon, ZoomInIcon, ZoomOutIcon, SettingsIcon } from '@/components/icons';
import type { ViewType } from '@/types';

interface ViewTabProps {
  view: ViewType;
  label: string;
  icon?: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

function ViewTab({ view, label, icon, active, onClick }: ViewTabProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-all duration-200
        ${active
          ? 'border-blue-500 bg-blue-500/10 text-blue-400'
          : 'border-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
        }
      `}
    >
      {icon}
      {label}
    </button>
  );
}

export function Header() {
  const {
    projectName,
    setProjectName,
    currentView,
    setCurrentView,
    canvasScale,
    setCanvasScale,
    referenceViewer,
    setReferenceViewerVisible,
  } = usePlanningStore();

  const views: { view: ViewType; label: string; icon?: React.ReactNode }[] = [
    { view: 'building-plan', label: 'Building Plan', icon: <ImageIcon size={16} /> },
    { view: 'building-elevation', label: 'Elevation' },
    { view: 'scaffold-plan', label: 'Scaffold Plan' },
    { view: '3d', label: '3D', icon: <CubeIcon size={16} /> },
    { view: 'isometric', label: 'Isometric' },
    { view: 'perspective', label: 'Perspective' },
  ];

  const handleZoom = (direction: 'in' | 'out') => {
    const factor = direction === 'in' ? 1.2 : 0.8;
    setCanvasScale(Math.max(0.1, Math.min(5, canvasScale * factor)));
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-4 backdrop-blur-xl">
      {/* Left section - Navigation & Project name */}
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
        >
          <ArrowLeftIcon size={18} />
          <span className="hidden sm:inline">Back to Projects</span>
        </Link>

        <div className="h-5 w-px bg-zinc-700" />

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="bg-transparent text-sm font-semibold text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900 rounded px-2 py-1"
          />
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
            Draft
          </span>
        </div>
      </div>

      {/* Center section - View tabs */}
      <div className="flex items-center">
        <nav className="flex">
          {views.map((v) => (
            <ViewTab
              key={v.view}
              view={v.view}
              label={v.label}
              icon={v.icon}
              active={currentView === v.view}
              onClick={() => setCurrentView(v.view)}
            />
          ))}
        </nav>
      </div>

      {/* Right section - Actions */}
      <div className="flex items-center gap-2">
        {/* Zoom controls */}
        <div className="flex items-center gap-1 rounded-lg bg-zinc-800/50 px-2 py-1">
          <button
            onClick={() => handleZoom('out')}
            className="flex h-7 w-7 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
            title="Zoom Out"
          >
            <ZoomOutIcon size={16} />
          </button>
          <span className="min-w-[50px] text-center text-xs font-mono text-zinc-400">
            {Math.round(canvasScale * 100)}%
          </span>
          <button
            onClick={() => handleZoom('in')}
            className="flex h-7 w-7 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
            title="Zoom In"
          >
            <ZoomInIcon size={16} />
          </button>
        </div>

        {/* Reference viewer toggle */}
        <button
          onClick={() => setReferenceViewerVisible(!referenceViewer.visible)}
          className={`flex h-8 items-center gap-2 rounded-lg px-3 text-sm transition-all ${
            referenceViewer.visible
              ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50'
              : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
          }`}
          title="Toggle Reference Drawing Viewer"
        >
          <ImageIcon size={16} />
          <span className="hidden md:inline">Reference</span>
        </button>

        {/* Run calculation */}
        <button className="flex h-8 items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-4 text-sm font-medium text-white shadow-lg shadow-blue-500/30 transition-all hover:from-blue-500 hover:to-blue-400 hover:shadow-blue-500/40">
          <PlayIcon size={16} />
          <span className="hidden md:inline">Calculate</span>
        </button>

        {/* Settings */}
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800/50 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
          title="Settings"
        >
          <SettingsIcon size={18} />
        </button>
      </div>
    </header>
  );
}
