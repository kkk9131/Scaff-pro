'use client';

import React, { useState } from 'react';
import { usePlanningStore } from '@/store/planningStore';
import {
  BuildingIcon,
  ScaffoldIcon,
  QuantityIcon,
  ChatIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UploadIcon,
  DownloadIcon,
  SendIcon,
} from '@/components/icons';
import type { SidePanelTab } from '@/types';

interface TabButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function TabButton({ icon, label, active, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-1 flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-all duration-200
        ${active
          ? 'border-b-2 border-blue-500 bg-zinc-800/50 text-blue-400'
          : 'border-b-2 border-transparent text-zinc-500 hover:bg-zinc-800/30 hover:text-zinc-300'
        }
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// Building & Drawing Tab Content
function BuildingTab() {
  const { drawings, heightCondition, setHeightCondition } = usePlanningStore();

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Drawing files section */}
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-200">
          <UploadIcon size={16} className="text-zinc-400" />
          Drawing Files
        </h3>
        <div className="flex flex-col gap-2">
          <button className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-700 bg-zinc-800/30 py-4 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:bg-zinc-800/50 hover:text-zinc-300">
            <UploadIcon size={18} />
            <span>Upload Drawing (PDF, DXF, Image)</span>
          </button>
          {drawings.length === 0 && (
            <p className="text-xs text-zinc-500">No drawings uploaded yet</p>
          )}
        </div>
      </section>

      {/* Scale section */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-zinc-200">Scale</h3>
        <div className="flex items-center gap-2 rounded-lg bg-zinc-800/50 p-3">
          <span className="text-sm text-zinc-400">1:</span>
          <input
            type="number"
            defaultValue={100}
            className="w-20 rounded bg-zinc-900 px-2 py-1 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button className="ml-auto text-xs text-blue-400 hover:text-blue-300">
            Set from drawing
          </button>
        </div>
      </section>

      {/* Height conditions section */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-zinc-200">Height Conditions</h3>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-lg bg-zinc-800/50 p-3">
            <span className="text-sm text-zinc-400">Floors</span>
            <input
              type="number"
              value={heightCondition.floors}
              onChange={(e) => setHeightCondition({ ...heightCondition, floors: parseInt(e.target.value) || 0 })}
              className="w-16 rounded bg-zinc-900 px-2 py-1 text-right text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-zinc-800/50 p-3">
            <span className="text-sm text-zinc-400">Floor Height</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={heightCondition.floorHeight}
                onChange={(e) => setHeightCondition({ ...heightCondition, floorHeight: parseInt(e.target.value) || 0 })}
                className="w-20 rounded bg-zinc-900 px-2 py-1 text-right text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-xs text-zinc-500">mm</span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-zinc-800/50 p-3">
            <span className="text-sm text-zinc-400">Eave Height</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={heightCondition.eaveHeight}
                onChange={(e) => setHeightCondition({ ...heightCondition, eaveHeight: parseInt(e.target.value) || 0 })}
                className="w-20 rounded bg-zinc-900 px-2 py-1 text-right text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-xs text-zinc-500">mm</span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-zinc-800/50 p-3">
            <span className="text-sm text-zinc-400">Roof Peak</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={heightCondition.roofPeakHeight}
                onChange={(e) => setHeightCondition({ ...heightCondition, roofPeakHeight: parseInt(e.target.value) || 0 })}
                className="w-20 rounded bg-zinc-900 px-2 py-1 text-right text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-xs text-zinc-500">mm</span>
            </div>
          </div>
        </div>
      </section>

      {/* Outline info */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-zinc-200">Building Outline</h3>
        <div className="rounded-lg bg-zinc-800/50 p-3">
          <p className="text-xs text-zinc-400">
            Click "Edit Outline" tool to modify the building perimeter
          </p>
        </div>
      </section>
    </div>
  );
}

// Scaffold Conditions Tab Content
function ScaffoldTab() {
  const [selectedTemplate, setSelectedTemplate] = useState('standard-1');

  const templates = [
    { id: 'standard-1', name: 'Standard Residential 1' },
    { id: 'standard-2', name: 'Standard Residential 2' },
    { id: 'custom', name: 'Custom Settings' },
  ];

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Template selection */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-zinc-200">Template</h3>
        <select
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value)}
          className="w-full rounded-lg bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </section>

      {/* Basic conditions */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-zinc-200">Basic Conditions</h3>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-lg bg-zinc-800/50 p-3">
            <span className="text-sm text-zinc-400">Standard Span</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                defaultValue={1800}
                className="w-20 rounded bg-zinc-900 px-2 py-1 text-right text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-xs text-zinc-500">mm</span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-zinc-800/50 p-3">
            <span className="text-sm text-zinc-400">Floor Pitch</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                defaultValue={1900}
                className="w-20 rounded bg-zinc-900 px-2 py-1 text-right text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-xs text-zinc-500">mm</span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-zinc-800/50 p-3">
            <span className="text-sm text-zinc-400">Bracing Interval</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                defaultValue={3}
                className="w-16 rounded bg-zinc-900 px-2 py-1 text-right text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-xs text-zinc-500">spans</span>
            </div>
          </div>
        </div>
      </section>

      {/* Auto-calculate button */}
      <section>
        <button className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:from-blue-500 hover:to-blue-400 hover:shadow-blue-500/40">
          Auto-Calculate Scaffold
        </button>
      </section>
    </div>
  );
}

// Quantity Tab Content
function QuantityTab() {
  const demoData = [
    { type: 'Post', spec: '1900mm', south: 12, east: 8, west: 8, north: 12, total: 40 },
    { type: 'Ledger', spec: '1800mm', south: 24, east: 16, west: 16, north: 24, total: 80 },
    { type: 'Handrail', spec: '1800mm', south: 18, east: 12, west: 12, north: 18, total: 60 },
    { type: 'Bracket', spec: '250mm', south: 24, east: 16, west: 16, north: 24, total: 80 },
    { type: 'Jack', spec: '600mm', south: 12, east: 8, west: 8, north: 12, total: 40 },
  ];

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Summary */}
      <section className="rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-4">
        <h3 className="mb-2 text-sm font-semibold text-blue-300">Quantity Summary</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-zinc-500">Total Parts</p>
            <p className="text-xl font-bold text-zinc-100">300</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Unique Types</p>
            <p className="text-xl font-bold text-zinc-100">5</p>
          </div>
        </div>
      </section>

      {/* Quantity table */}
      <section className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-zinc-400">
              <th className="pb-2 pr-2">Type</th>
              <th className="pb-2 pr-2">Spec</th>
              <th className="pb-2 pr-2 text-right">S</th>
              <th className="pb-2 pr-2 text-right">E</th>
              <th className="pb-2 pr-2 text-right">W</th>
              <th className="pb-2 pr-2 text-right">N</th>
              <th className="pb-2 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {demoData.map((row, i) => (
              <tr key={i} className="border-b border-zinc-800/50 text-zinc-300">
                <td className="py-2 pr-2">{row.type}</td>
                <td className="py-2 pr-2 text-zinc-500">{row.spec}</td>
                <td className="py-2 pr-2 text-right">{row.south}</td>
                <td className="py-2 pr-2 text-right">{row.east}</td>
                <td className="py-2 pr-2 text-right">{row.west}</td>
                <td className="py-2 pr-2 text-right">{row.north}</td>
                <td className="py-2 text-right font-semibold text-zinc-100">{row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Export buttons */}
      <section className="flex gap-2">
        <button className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:bg-zinc-800/50 hover:text-zinc-300">
          <DownloadIcon size={14} />
          Export CSV
        </button>
        <button className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:bg-zinc-800/50 hover:text-zinc-300">
          <DownloadIcon size={14} />
          Export Excel
        </button>
      </section>
    </div>
  );
}

// Chat Tab Content
function ChatTab() {
  const { chatMessages, addChatMessage } = usePlanningStore();
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (!inputValue.trim()) return;
    addChatMessage({ role: 'user', content: inputValue });
    setInputValue('');
    // Simulate AI response
    setTimeout(() => {
      addChatMessage({
        role: 'assistant',
        content: 'I understand your request. Let me analyze and adjust the scaffold layout accordingly.',
      });
    }, 1000);
  };

  const suggestions = [
    'Narrow the south face scaffold',
    'Widen span to 1800mm',
    'Add opening at entrance',
    'Raise scaffold height',
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-auto p-4">
        {chatMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20">
              <ChatIcon size={24} className="text-blue-400" />
            </div>
            <h3 className="mb-2 text-sm font-semibold text-zinc-200">AI Assistant</h3>
            <p className="mb-4 text-xs text-zinc-500">
              Ask me to adjust scaffold layout, dimensions, or analyze your design.
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setInputValue(s)}
                  className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-300"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-800 text-zinc-200'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask AI to adjust scaffold..."
            className="flex-1 rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-500"
          >
            <SendIcon size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function SidePanel() {
  const { activePanelTab, setActivePanelTab, sidePanelCollapsed, toggleSidePanel } = usePlanningStore();

  const tabs: { id: SidePanelTab; icon: React.ReactNode; label: string }[] = [
    { id: 'building', icon: <BuildingIcon size={16} />, label: 'Building' },
    { id: 'scaffold', icon: <ScaffoldIcon size={16} />, label: 'Scaffold' },
    { id: 'quantity', icon: <QuantityIcon size={16} />, label: 'Quantity' },
    { id: 'chat', icon: <ChatIcon size={16} />, label: 'Chat' },
  ];

  const renderTabContent = () => {
    switch (activePanelTab) {
      case 'building':
        return <BuildingTab />;
      case 'scaffold':
        return <ScaffoldTab />;
      case 'quantity':
        return <QuantityTab />;
      case 'chat':
        return <ChatTab />;
    }
  };

  return (
    <div
      className={`relative flex h-full flex-col border-l border-zinc-800 bg-zinc-900/50 backdrop-blur-xl transition-all duration-300 ${
        sidePanelCollapsed ? 'w-0' : 'w-80'
      }`}
    >
      {/* Collapse toggle */}
      <button
        onClick={toggleSidePanel}
        className="absolute -left-3 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-zinc-400 shadow-lg transition-colors hover:border-zinc-600 hover:text-zinc-300"
      >
        {sidePanelCollapsed ? <ChevronLeftIcon size={14} /> : <ChevronRightIcon size={14} />}
      </button>

      {!sidePanelCollapsed && (
        <>
          {/* Tab buttons */}
          <div className="flex border-b border-zinc-800">
            {tabs.map((tab) => (
              <TabButton
                key={tab.id}
                icon={tab.icon}
                label={tab.label}
                active={activePanelTab === tab.id}
                onClick={() => setActivePanelTab(tab.id)}
              />
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">{renderTabContent()}</div>
        </>
      )}
    </div>
  );
}
