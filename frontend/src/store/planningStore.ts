import { create } from 'zustand';

export type ToolType = 'select' | 'move' | 'polyline' | 'scale' | 'text' | 'measure' | 'erase';

export interface Point {
    x: number;
    y: number;
}

export interface BuildingConfig {
    floorHeight: number; // mm per floor
    totalFloors: number;
    roofHeight: number; // mm
}

// Common scale ratios for architectural drawings
export const SCALE_PRESETS = [
    { ratio: 50, label: '1:50' },
    { ratio: 100, label: '1:100' },
    { ratio: 200, label: '1:200' },
    { ratio: 250, label: '1:250' },
] as const;

interface PlanningState {
    // Drawing
    drawingUrl: string | null;
    drawingName: string | null;

    // Scale
    scaleRatio: number | null;
    scale: number | null;
    scalePoints: Point[];
    isSettingScale: boolean;

    // Polyline (Building Outline)
    polylinePoints: Point[];
    isDrawingPolyline: boolean;

    // Building Configuration
    building: BuildingConfig;

    // Tool
    currentTool: ToolType;

    // Actions
    setDrawing: (url: string | null, name: string | null) => void;
    setScale: (scale: number) => void;
    setScaleFromRatio: (ratio: number) => void;
    addScalePoint: (point: Point) => void;
    resetScalePoints: () => void;
    setIsSettingScale: (value: boolean) => void;

    addPolylinePoint: (point: Point) => void;
    finishPolyline: () => void;
    cancelPolyline: () => void;
    clearPolyline: () => void;

    setBuilding: (config: Partial<BuildingConfig>) => void;

    setCurrentTool: (tool: ToolType) => void;
}

// Default assumption: ~3.78 pixels per mm at 96 DPI
const DEFAULT_PIXELS_PER_MM = 3.78;

export const usePlanningStore = create<PlanningState>((set) => ({
    // Initial state
    drawingUrl: null,
    drawingName: null,
    scaleRatio: null,
    scale: null,
    scalePoints: [],
    isSettingScale: false,
    polylinePoints: [],
    isDrawingPolyline: false,
    building: {
        floorHeight: 2800, // 2.8m default
        totalFloors: 2,
        roofHeight: 1000, // 1m default roof
    },
    currentTool: 'select',

    // Actions
    setDrawing: (url, name) => set({ drawingUrl: url, drawingName: name }),

    setScale: (scale) => set({ scale, isSettingScale: false }),
    setScaleFromRatio: (ratio) => set({
        scaleRatio: ratio,
        scale: DEFAULT_PIXELS_PER_MM / ratio,
        isSettingScale: false
    }),
    addScalePoint: (point) => set((state) => ({
        scalePoints: [...state.scalePoints, point].slice(-2)
    })),
    resetScalePoints: () => set({ scalePoints: [], isSettingScale: false }),
    setIsSettingScale: (value) => set({ isSettingScale: value, scalePoints: [] }),

    addPolylinePoint: (point) => set((state) => ({
        polylinePoints: [...state.polylinePoints, point],
        isDrawingPolyline: true
    })),
    finishPolyline: () => set({ isDrawingPolyline: false }),
    cancelPolyline: () => set({ polylinePoints: [], isDrawingPolyline: false }),
    clearPolyline: () => set({ polylinePoints: [], isDrawingPolyline: false }),

    setBuilding: (config) => set((state) => ({
        building: { ...state.building, ...config }
    })),

    setCurrentTool: (tool) => set({ currentTool: tool }),
}));
