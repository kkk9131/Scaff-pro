'use client';

import React, { useState, useCallback, useRef } from 'react';
import { usePlanningStore } from '@/store/planningStore';
import {
  CloseIcon,
  UploadIcon,
  CheckIcon,
  TrashIcon,
} from '@/components/icons';
import type { DrawingFileType } from '@/types';

// Floor colors for visual distinction
const FLOOR_COLORS: Record<number, string> = {
  1: '#3b82f6', // blue
  2: '#10b981', // green
  3: '#f59e0b', // amber
  4: '#ef4444', // red
  5: '#8b5cf6', // purple
};

const DRAWING_TYPE_LABELS: Record<DrawingFileType, string> = {
  'plan': '平面図',
  'elevation': '立面図',
  'roof-plan': '屋根伏図',
  'site-survey': '現調図',
};

interface FilePreview {
  file: File;
  previewUrl: string;
  type: DrawingFileType;
  floor: number;
}

export function DrawingImportDialog() {
  const {
    drawingImportOpen,
    setDrawingImportOpen,
    addDrawing,
    updateDrawingStatus,
    updateDrawingUrl,
    updateDrawingServerId,
    setBackgroundDrawingId,
    drawings, // Get existing drawings to check if we should overwrite or expand
    setBuilding, // Action to update building config
    building, // Current building config
  } = usePlanningStore();

  const [selectedType, setSelectedType] = useState<DrawingFileType>('plan');
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to detect floor from filename
  // Examples: "1F.png", "2階平面図.pdf", "plan-3f.jpg"
  const detectFloorFromFilename = (filename: string): number | null => {
    // English/Number pattern: 1F, 2F, 1f, 2f
    const fMatch = filename.match(/(\d+)F/i);
    if (fMatch) {
      const floor = parseInt(fMatch[1]);
      if (floor >= 1 && floor <= 5) return floor;
    }

    // Japanese pattern: 1階, 2階
    const kMatch = filename.match(/(\d+)階/);
    if (kMatch) {
      const floor = parseInt(kMatch[1]);
      if (floor >= 1 && floor <= 5) return floor;
    }

    return null;
  };

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const newPreviews: FilePreview[] = [];
    Array.from(files).forEach((file) => {
      // Check if file is image or PDF
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        return;
      }

      const previewUrl = URL.createObjectURL(file);

      // Attempt to detect floor
      const detectedFloor = detectFloorFromFilename(file.name);

      // Use detected floor if valid, otherwise use currently selected global floor
      const finalFloor = detectedFloor !== null ? detectedFloor : selectedFloor;

      newPreviews.push({
        file,
        previewUrl,
        type: selectedType, // Keep type as manual selection for now (safer)
        floor: selectedType === 'plan' ? finalFloor : 0,
      });
    });

    setFilePreviews((prev) => [...prev, ...newPreviews]);
  }, [selectedType, selectedFloor]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const removePreview = useCallback((index: number) => {
    setFilePreviews((prev) => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[index].previewUrl);
      newPreviews.splice(index, 1);
      return newPreviews;
    });
  }, []);

  const updatePreviewType = useCallback((index: number, type: DrawingFileType) => {
    setFilePreviews((prev) => {
      const newPreviews = [...prev];
      newPreviews[index] = { ...newPreviews[index], type };
      return newPreviews;
    });
  }, []);

  const updatePreviewFloor = useCallback((index: number, floor: number) => {
    setFilePreviews((prev) => {
      const newPreviews = [...prev];
      newPreviews[index] = { ...newPreviews[index], floor };
      return newPreviews;
    });
  }, []);

  const handleUpload = async () => {
    if (filePreviews.length === 0) return;

    setIsUploading(true);

    // Auto-adjust global building total floors based on import
    // 1. Calculate max floor in this batch
    const batchMaxFloor = filePreviews.reduce((max, p) => {
      return p.type === 'plan' ? Math.max(max, p.floor) : max;
    }, 0);

    // Get latest state
    const currentDrawings = usePlanningStore.getState().drawings;
    const currentTotalFloors = usePlanningStore.getState().building.totalFloors;

    console.log('[DrawingImportDialog] Auto-Adjust Check:', {
      batchMaxFloor,
      currentDrawingsLength: currentDrawings.length,
      currentTotalFloors
    });

    if (batchMaxFloor > 0) {
      // If this is the *first* import (no existing drawings), set totalFloors strictly to batchMaxFloor
      if (currentDrawings.length === 0) {
        console.log('[DrawingImportDialog] First import, setting totalFloors to:', batchMaxFloor);
        setBuilding({ totalFloors: batchMaxFloor });
      } else {
        // If adding to existing, only expand if new floor exceeds current total
        if (batchMaxFloor > currentTotalFloors) {
          console.log('[DrawingImportDialog] Expanding totalFloors to:', batchMaxFloor);
          setBuilding({ totalFloors: batchMaxFloor });
        }
      }
    }

    for (const preview of filePreviews) {
      // Add drawing with uploading status - addDrawing returns the actual ID used in store
      const drawingId = addDrawing({
        name: preview.file.name,
        type: preview.type,
        url: preview.previewUrl,
        floor: preview.type === 'plan' ? preview.floor : undefined,
        status: 'uploading',
      });

      try {
        // Upload file to backend
        const formData = new FormData();
        formData.append('file', preview.file);
        formData.append('type', preview.type);
        if (preview.type === 'plan') {
          formData.append('floor', preview.floor.toString());
        }

        const response = await fetch('/api/v1/drawings/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        updateDrawingStatus(drawingId, 'processing');

        // Poll for processing status or use WebSocket in production
        const result = await response.json();

        console.log('[DrawingImportDialog] API Response:', result);

        // サーバーから返されたIDとURLで更新（重要：これがないとAI解析でIDが見つからない）
        if (result.id) {
          console.log('[DrawingImportDialog] Updating serverId to:', result.id);
          updateDrawingServerId(drawingId, result.id);
        }
        if (result.url) {
          console.log('[DrawingImportDialog] Updating URL to:', result.url);
          updateDrawingUrl(drawingId, result.url);
        }

        // アップロード完了後、背景に表示
        updateDrawingStatus(drawingId, 'ready');
        setBackgroundDrawingId(drawingId);
        console.log('[DrawingImportDialog] Upload complete, set backgroundDrawingId:', drawingId);

        // Auto-extract roof info if elevation drawing
        if (preview.type === 'elevation' && result.id) {
          console.log('[DrawingImportDialog] Auto-extracting roof info for elevation drawing...');
          try {
            // Next.jsのRewrites経由ではなく直接呼ぶか、Rewrites設定を確認するか。
            // ここではRewrites経由前提で /api/v1/drawings... を呼んでいるので合わせる。
            // しかし SidePanel では http://localhost:8000 を直叩きしていた。
            // uploadは /api/v1/drawings/upload で成功しているので、Rewritesは効いているはず？
            // あるいは upload は相対パスで呼んでいる。

            // ここでは相対パスで呼ぶ
            const roofRes = await fetch('/api/v1/drawings/extract-roof-by-id', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ file_id: result.id })
            });

            if (roofRes.ok) {
              const roofData = await roofRes.json();
              if (roofData.success && roofData.config) {
                usePlanningStore.getState().setRoof(roofData.config);
                console.log('[DrawingImportDialog] Roof info applied automatically:', roofData.config);
              } else {
                console.warn('[DrawingImportDialog] Roof extraction returned no config:', roofData);
              }
            } else {
              console.error('[DrawingImportDialog] Roof extraction request failed:', roofRes.status);
            }
          } catch (e) {
            console.error('[DrawingImportDialog] Auto roof extraction failed:', e);
          }
        }
      } catch (error) {
        console.error('[DrawingImportDialog] Upload error:', error);
        // アップロード失敗時はreadyステータスに設定
        updateDrawingStatus(drawingId, 'ready');
        setBackgroundDrawingId(drawingId);
      }
    }

    setIsUploading(false);
    setFilePreviews([]);
    setDrawingImportOpen(false);
  };

  const handleClose = useCallback(() => {
    filePreviews.forEach((preview) => URL.revokeObjectURL(preview.previewUrl));
    setFilePreviews([]);
    setDrawingImportOpen(false);
  }, [filePreviews, setDrawingImportOpen]);

  if (!drawingImportOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-100">図面インポート</h2>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto p-6">
          {/* Drawing type selection */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              図面タイプを選択
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(DRAWING_TYPE_LABELS) as DrawingFileType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${selectedType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300'
                    }`}
                >
                  {DRAWING_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Floor selection (only for plan type) */}
          {selectedType === 'plan' && (
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                階層を選択
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((floor) => (
                  <button
                    key={floor}
                    onClick={() => setSelectedFloor(floor)}
                    className={`flex h-10 w-14 items-center justify-center rounded-lg text-sm font-medium transition-all ${selectedFloor === floor
                      ? 'text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300'
                      }`}
                    style={{
                      backgroundColor: selectedFloor === floor ? FLOOR_COLORS[floor] : undefined,
                    }}
                  >
                    {floor}F
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`mb-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all ${dragOver
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-zinc-700 bg-zinc-800/30 hover:border-zinc-600 hover:bg-zinc-800/50'
              }`}
          >
            <UploadIcon size={32} className="mb-3 text-zinc-500" />
            <p className="mb-1 text-sm font-medium text-zinc-300">
              クリックまたはドラッグ&ドロップでファイルを選択
            </p>
            <p className="text-xs text-zinc-500">
              対応形式: PDF, PNG, JPG, DXF (最大20MB)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              multiple
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
          </div>

          {/* File previews */}
          {filePreviews.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-zinc-300">
                選択したファイル ({filePreviews.length})
              </h3>
              {filePreviews.map((preview, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-800/50 p-3"
                >
                  {/* Thumbnail */}
                  <div className="h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-900">
                    {preview.file.type.startsWith('image/') ? (
                      <img
                        src={preview.previewUrl}
                        alt={preview.file.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                        PDF
                      </div>
                    )}
                  </div>

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-200">
                      {preview.file.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {(preview.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <div className="mt-2 flex gap-2">
                      <select
                        value={preview.type}
                        onChange={(e) => updatePreviewType(index, e.target.value as DrawingFileType)}
                        className="rounded bg-zinc-900 px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {(Object.keys(DRAWING_TYPE_LABELS) as DrawingFileType[]).map((type) => (
                          <option key={type} value={type}>
                            {DRAWING_TYPE_LABELS[type]}
                          </option>
                        ))}
                      </select>
                      {preview.type === 'plan' && (
                        <select
                          value={preview.floor}
                          onChange={(e) => updatePreviewFloor(index, parseInt(e.target.value))}
                          className="rounded bg-zinc-900 px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {[1, 2, 3, 4, 5].map((floor) => (
                            <option key={floor} value={floor}>
                              {floor}F
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => removePreview(index)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-red-400"
                  >
                    <TrashIcon size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-800 px-6 py-4">
          <p className="text-xs text-zinc-500">
            図面をキャンバスの背景に表示します
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
            >
              キャンセル
            </button>
            <button
              onClick={handleUpload}
              disabled={filePreviews.length === 0 || isUploading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  処理中...
                </>
              ) : (
                <>
                  <CheckIcon size={16} />
                  インポート ({filePreviews.length})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
