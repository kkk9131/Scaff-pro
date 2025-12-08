'use client';

import React from 'react';
import { usePlanningStore } from '@/store/planningStore';
import {
  SelectIcon,
  EditOutlineIcon,
  OpeningIcon,
  GridIcon,
  SnapIcon,
} from '@/components/icons';
import type { ToolMode } from '@/types';

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  shortcut?: string;
}

function ToolButton({ icon, label, active, onClick, shortcut }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
      className={`
        group relative flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200
        ${active
          ? 'bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/20 ring-1 ring-blue-500/50'
          : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
        }
      `}
    >
      {icon}
      {/* Tooltip */}
      <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-200 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        {label}
        {shortcut && (
          <span className="ml-2 text-zinc-400">{shortcut}</span>
        )}
      </span>
    </button>
  );
}

interface ToggleButtonProps {
  icon: React.ReactNode;
  label: string;
  enabled: boolean;
  onClick: () => void;
  shortcut?: string;
}

function ToggleButton({ icon, label, enabled, onClick, shortcut }: ToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
      className={`
        group relative flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200
        ${enabled
          ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50'
          : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-400'
        }
      `}
    >
      {icon}
      {/* Tooltip */}
      <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-200 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        {label}: {enabled ? 'ON' : 'OFF'}
        {shortcut && (
          <span className="ml-2 text-zinc-400">{shortcut}</span>
        )}
      </span>
    </button>
  );
}

export function ToolPalette() {
  const {
    currentTool,
    setCurrentTool,
    gridEnabled,
    toggleGrid,
    snapEnabled,
    toggleSnap,
  } = usePlanningStore();

  const tools: { mode: ToolMode; icon: React.ReactNode; label: string; shortcut?: string }[] = [
    { mode: 'select', icon: <SelectIcon size={18} />, label: 'Select / Move', shortcut: 'V' },
    { mode: 'edit-outline', icon: <EditOutlineIcon size={18} />, label: 'Edit Outline', shortcut: 'E' },
    { mode: 'opening-line', icon: <OpeningIcon size={18} />, label: 'Opening Line', shortcut: 'O' },
  ];

  return (
    <div className="flex h-full w-14 flex-col border-r border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
      {/* Logo / Brand */}
      <div className="flex h-14 items-center justify-center border-b border-zinc-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-500/30">
          S
        </div>
      </div>

      {/* Tool buttons */}
      <div className="flex flex-1 flex-col gap-1 p-2">
        {/* Mode tools */}
        <div className="flex flex-col gap-1">
          {tools.map((tool) => (
            <ToolButton
              key={tool.mode}
              icon={tool.icon}
              label={tool.label}
              shortcut={tool.shortcut}
              active={currentTool === tool.mode}
              onClick={() => setCurrentTool(tool.mode)}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="my-2 h-px bg-zinc-800" />

        {/* Display toggles */}
        <div className="flex flex-col gap-1">
          <ToggleButton
            icon={<GridIcon size={18} />}
            label="Grid"
            shortcut="G"
            enabled={gridEnabled}
            onClick={toggleGrid}
          />
          <ToggleButton
            icon={<SnapIcon size={18} />}
            label="Snap"
            shortcut="S"
            enabled={snapEnabled}
            onClick={toggleSnap}
          />
        </div>
      </div>

      {/* Version indicator */}
      <div className="flex items-center justify-center border-t border-zinc-800 p-2">
        <span className="text-[10px] text-zinc-600">v0.1.0</span>
      </div>
    </div>
  );
}
