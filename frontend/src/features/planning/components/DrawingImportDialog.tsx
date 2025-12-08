'use client';

import React, { useState, useCallback, useRef } from 'react';
import { usePlanningStore } from '@/store/planningStore';
import {
  CloseIcon,
  UploadIcon,
  CheckIcon,
  TrashIcon,
} from '@/components/icons';
import type { DrawingFileType, DrawingFile } from '@/types';

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
    updateDrawingProcessedData,
    setBackgroundDrawingId,
  } = usePlanningStore();

  const [selectedType, setSelectedType] = useState<DrawingFileType>('plan');
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const newPreviews: FilePreview[] = [];
    Array.from(files).forEach((file) => {
      // Check if file is image or PDF
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      newPreviews.push({
        file,
        previewUrl,
        type: selectedType,
        floor: selectedType === 'plan' ? selectedFloor : 0,
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

    for (const preview of filePreviews) {
      const drawingId = crypto.randomUUID();

      // Add drawing with uploading status
      const newDrawing: DrawingFile = {
        id: drawingId,
        name: preview.file.name,
        type: preview.type,
        url: preview.previewUrl,
        scale: 1,
        floor: preview.type === 'plan' ? preview.floor : undefined,
        status: 'uploading',
      };
      addDrawing(newDrawing);

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
        if (result.processedData) {
          console.log('[DrawingImportDialog] Setting processedData:', result.processedData);
          updateDrawingProcessedData(drawingId, result.processedData);
          // 自動的に背景に表示
          setBackgroundDrawingId(drawingId);
          console.log('[DrawingImportDialog] Set backgroundDrawingId:', drawingId);
        } else {
          console.log('[DrawingImportDialog] No processedData in response');
          updateDrawingStatus(drawingId, 'ready');
          setBackgroundDrawingId(drawingId);
        }
      } catch {
        // For demo, simulate processing with mock data
        updateDrawingStatus(drawingId, 'processing');

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Mock processed data
        const mockProcessedData = {
          originalUrl: preview.previewUrl,
          processedUrl: preview.previewUrl,
          outlines: [
            {
              vertices: [
                { x: 100, y: 100 },
                { x: 400, y: 100 },
                { x: 400, y: 300 },
                { x: 100, y: 300 },
              ],
              floor: preview.floor,
              color: FLOOR_COLORS[preview.floor] || '#3b82f6',
            },
          ],
          entrances: [
            {
              id: crypto.randomUUID(),
              position: { x: 250, y: 300 },
              type: 'main-entrance' as const,
              width: 900,
              label: '玄関',
            },
          ],
          dimensions: [
            {
              id: crypto.randomUUID(),
              start: { x: 100, y: 100 },
              end: { x: 400, y: 100 },
              value: 7280,
              label: '7,280mm',
            },
            {
              id: crypto.randomUUID(),
              start: { x: 400, y: 100 },
              end: { x: 400, y: 300 },
              value: 5460,
              label: '5,460mm',
            },
          ],
          scale: 0.1,
          bounds: { minX: 100, minY: 100, maxX: 400, maxY: 300 },
        };

        updateDrawingProcessedData(drawingId, mockProcessedData);
        // 自動的に背景に表示
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
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    selectedType === type
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
                    className={`flex h-10 w-14 items-center justify-center rounded-lg text-sm font-medium transition-all ${
                      selectedFloor === floor
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
            className={`mb-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all ${
              dragOver
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
            アップロード後、自動で外周線・玄関位置を解析します
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
