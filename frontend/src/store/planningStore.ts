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

export interface GridConfig {
    spacing: number; // Grid spacing in mm (real-world dimension)
}

// Common scale ratios for architectural drawings
export const SCALE_PRESETS = [
    { ratio: 50, label: '1:50' },
    { ratio: 100, label: '1:100' },
    { ratio: 200, label: '1:200' },
    { ratio: 250, label: '1:250' },
] as const;

// Edge Attribute
export interface EdgeAttribute {
    startFloor: number;
    endFloor: number;
}

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
    // Map of segment index -> attributes. Segment i connects point i and i+1.
    edgeAttributes: Record<number, EdgeAttribute>;
    isDrawingPolyline: boolean;

    // Building Configuration
    building: BuildingConfig;

    // Grid Configuration
    grid: GridConfig;

    // Tool
    currentTool: ToolType;
    isGridSnapEnabled: boolean;

    // Actions
    setDrawing: (url: string | null, name: string | null) => void;
    setScale: (scale: number) => void;
    setScaleFromRatio: (ratio: number) => void;
    addScalePoint: (point: Point) => void;
    resetScalePoints: () => void;
    setIsSettingScale: (value: boolean) => void;

    toggleGridSnap: () => void;

    addPolylinePoint: (point: Point) => void;
    popPolylinePoint: () => void;
    finishPolyline: () => void;
    cancelPolyline: () => void;
    clearPolyline: () => void;

    selectedEdgeIndex: number | null;
    setSelectedEdgeIndex: (index: number | null) => void;

    setEdgeAttribute: (index: number, attr: EdgeAttribute) => void;

    setBuilding: (config: Partial<BuildingConfig>) => void;
    setGrid: (config: Partial<GridConfig>) => void;

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
    edgeAttributes: {},
    isDrawingPolyline: false,
    building: {
        floorHeight: 2800, // 2.8m default
        totalFloors: 2,
        roofHeight: 1000, // 1m default roof
    },
    grid: {
        spacing: 1000, // 1m (1000mm) default grid spacing
    },
    currentTool: 'select',
    isGridSnapEnabled: false,

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

    toggleGridSnap: () => set((state) => ({ isGridSnapEnabled: !state.isGridSnapEnabled })),

    addPolylinePoint: (point) => set((state) => ({
        polylinePoints: [...state.polylinePoints, point],
        isDrawingPolyline: true,
    })),
    popPolylinePoint: () => set((state) => {
        const newPoints = state.polylinePoints.slice(0, -1);
        const newAttributes = { ...state.edgeAttributes };
        // Remove attribute for the deleted segment (if it existed)
        delete newAttributes[newPoints.length];

        return {
            polylinePoints: newPoints,
            edgeAttributes: newAttributes,
            isDrawingPolyline: newPoints.length > 0
        };
    }),
    finishPolyline: () => set({ isDrawingPolyline: false }),
    cancelPolyline: () => set({ polylinePoints: [], edgeAttributes: {}, isDrawingPolyline: false }),
    clearPolyline: () => set({ polylinePoints: [], edgeAttributes: {}, isDrawingPolyline: false }),

    selectedEdgeIndex: null,
    setSelectedEdgeIndex: (index) => set({ selectedEdgeIndex: index }),

    setEdgeAttribute: (index, attr) => set((state) => ({
        edgeAttributes: { ...state.edgeAttributes, [index]: attr }
    })),

    setBuilding: (config) => set((state) => ({
        building: { ...state.building, ...config }
    })),

    setGrid: (config) => set((state) => ({
        grid: { ...state.grid, ...config }
    })),

    setCurrentTool: (tool) => set({ currentTool: tool }),
}));
