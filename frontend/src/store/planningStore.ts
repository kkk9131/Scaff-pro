import { create } from 'zustand';
import type { ViewType } from '@/types';

export type ToolType = 'select' | 'move' | 'polyline' | 'scale' | 'text' | 'measure' | 'erase';

// Reference Viewer state
export interface ReferenceViewerState {
    visible: boolean;
    x: number;
    y: number;
    width: number;
    height: number;
}

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

// Wall dimension mode
export type WallDimensionMode = 'actual' | 'centerline';

export interface WallConfig {
    dimensionMode: WallDimensionMode; // 実寸 or 芯寸
    thickness: number; // Wall thickness in mm (used in centerline mode)
}

// Roof configuration (extracted from elevation drawings)
export type RoofType = 'flat' | 'gable' | 'hip' | 'shed';

export interface RoofConfig {
    eaveOverhang: number; // 軒出 (mm)
    gableOverhang: number; // ケラバ出幅 (mm)
    slopeRatio: string | null; // 勾配（例: "4/10"）
    slopeAngle: number | null; // 傾斜角度（度）
    roofType: RoofType; // 屋根形状
    ridgeHeight: number | null; // 棟高さ (mm)
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

// Drawing file types
export type DrawingFileType = 'plan' | 'elevation' | 'roof-plan' | 'site-survey';

// Processed drawing data from analysis
export interface ProcessedDrawingData {
    originalUrl: string;
    processedUrl: string;
    outlines: Array<{
        vertices: Array<{ x: number; y: number }>;
        floor: number;
        color: string;
    }>;
    entrances: Array<{
        id: string;
        position: { x: number; y: number };
        type: 'main-entrance' | 'back-door' | 'other';
        width: number;
        label: string;
    }>;
    dimensions: Array<{
        id: string;
        start: { x: number; y: number };
        end: { x: number; y: number };
        value: number;
        label: string;
    }>;
    scale: number;
    bounds: {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    };
}

// Drawing file interface
export interface DrawingFile {
    id: string;
    name: string;
    url: string;
    type: DrawingFileType;
    floor?: number; // Only for 'plan' type
    status: 'uploading' | 'processing' | 'ready' | 'error';
    processedData?: ProcessedDrawingData; // Analysis result
    serverId?: string; // Server-side drawing ID (UUID from backend)
    createdAt: Date;
}

// Floor colors for visual identification
export const FLOOR_COLORS: Record<number, string> = {
    1: '#22c55e', // Green - 1F
    2: '#3b82f6', // Blue - 2F
    3: '#f59e0b', // Amber - 3F
    4: '#ef4444', // Red - 4F
    5: '#8b5cf6', // Purple - 5F
};

// Drawing type labels (Japanese)
export const DRAWING_TYPE_LABELS: Record<DrawingFileType, string> = {
    'plan': '平面図',
    'elevation': '立面図',
    'roof-plan': '屋根伏図',
    'site-survey': '現調図',
};

interface PlanningState {
    // Project
    projectName: string;
    setProjectName: (name: string) => void;

    // View
    currentView: ViewType;
    setCurrentView: (view: ViewType) => void;

    // Canvas
    canvasScale: number;
    setCanvasScale: (scale: number) => void;

    // Reference Viewer
    referenceViewer: ReferenceViewerState;
    setReferenceViewerVisible: (visible: boolean) => void;
    updateReferenceViewerPosition: (x: number, y: number) => void;
    updateReferenceViewerSize: (width: number, height: number) => void;

    // Drawing (Legacy - single drawing)
    drawingUrl: string | null;
    drawingName: string | null;

    // Multiple Drawings Management
    drawings: DrawingFile[];
    drawingImportOpen: boolean;

    // Background Drawing (for canvas overlay)
    backgroundDrawingId: string | null;
    backgroundOpacity: number; // 0-1

    // Dock & Tab Management
    openDrawingTabs: string[]; // Array of drawing IDs open in dock
    dockMinimized: boolean;
    dockHeight: number; // Height in pixels when expanded

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

    // Wall Configuration
    wall: WallConfig;

    // Roof Configuration (from elevation drawing analysis)
    roof: RoofConfig;

    // Tool
    currentTool: ToolType;
    isGridSnapEnabled: boolean;

    // Actions - Legacy Drawing
    setDrawing: (url: string | null, name: string | null) => void;

    // Actions - Multiple Drawings
    setDrawingImportOpen: (open: boolean) => void;
    addDrawing: (drawing: Omit<DrawingFile, 'id' | 'createdAt'>) => string;
    removeDrawing: (id: string) => void;
    updateDrawingStatus: (id: string, status: DrawingFile['status']) => void;
    updateDrawingProcessedData: (id: string, processedData: ProcessedDrawingData) => void;
    updateDrawingUrl: (id: string, url: string) => void;
    updateDrawingServerId: (id: string, serverId: string) => void;
    updateDrawingFloor: (id: string, floor: number) => void;

    // Actions - Background Drawing
    setBackgroundDrawingId: (id: string | null) => void;
    setBackgroundOpacity: (opacity: number) => void;

    // Actions - Dock & Tabs
    openDrawingTab: (id: string) => void;
    closeDrawingTab: (id: string) => void;
    setDockMinimized: (minimized: boolean) => void;
    setDockHeight: (height: number) => void;

    // Actions - Scale
    setScale: (scale: number) => void;
    setScaleFromRatio: (ratio: number) => void;
    addScalePoint: (point: Point) => void;
    resetScalePoints: () => void;
    setIsSettingScale: (value: boolean) => void;

    toggleGridSnap: () => void;

    addPolylinePoint: (point: Point) => void;
    setPolylinePoints: (points: Point[]) => void;
    popPolylinePoint: () => void;
    finishPolyline: () => void;
    cancelPolyline: () => void;
    clearPolyline: () => void;

    selectedEdgeIndex: number | null;
    setSelectedEdgeIndex: (index: number | null) => void;

    setEdgeAttribute: (index: number, attr: EdgeAttribute) => void;

    setBuilding: (config: Partial<BuildingConfig>) => void;
    setGrid: (config: Partial<GridConfig>) => void;
    setWall: (config: Partial<WallConfig>) => void;
    setRoof: (config: Partial<RoofConfig>) => void;

    setCurrentTool: (tool: ToolType) => void;
}

// Default assumption: ~3.78 pixels per mm at 96 DPI
const DEFAULT_PIXELS_PER_MM = 3.78;

// Generate unique ID for drawings
const generateId = () => `drawing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const usePlanningStore = create<PlanningState>((set, get) => ({
    // Initial state - Project
    projectName: 'New Project',
    setProjectName: (name) => set({ projectName: name }),

    // Initial state - View
    currentView: 'building-plan' as ViewType,
    setCurrentView: (view) => set({ currentView: view }),

    // Initial state - Canvas
    canvasScale: 1,
    setCanvasScale: (scale) => set({ canvasScale: scale }),

    // Initial state - Reference Viewer
    referenceViewer: {
        visible: false,
        x: 100,
        y: 100,
        width: 400,
        height: 300,
    },
    setReferenceViewerVisible: (visible) => set((state) => ({
        referenceViewer: { ...state.referenceViewer, visible }
    })),
    updateReferenceViewerPosition: (x, y) => set((state) => ({
        referenceViewer: { ...state.referenceViewer, x, y }
    })),
    updateReferenceViewerSize: (width, height) => set((state) => ({
        referenceViewer: { ...state.referenceViewer, width, height }
    })),

    // Initial state - Legacy Drawing
    drawingUrl: null,
    drawingName: null,

    // Initial state - Multiple Drawings
    drawings: [],
    drawingImportOpen: false,

    // Initial state - Background Drawing
    backgroundDrawingId: null,
    backgroundOpacity: 0.5, // Default 50% opacity

    // Initial state - Dock & Tabs
    openDrawingTabs: [],
    dockMinimized: true,
    dockHeight: 200, // Default height in pixels

    // Initial state - Scale & Grid
    scaleRatio: null,
    scale: null,
    scalePoints: [],
    isSettingScale: false,
    polylinePoints: [],
    edgeAttributes: {},
    isDrawingPolyline: false,
    building: {
        floorHeight: 2800, // 2.8m default
        totalFloors: 1, // Default to 1 floor (auto-expands on import)
        roofHeight: 1000, // 1m default roof
    },
    grid: {
        spacing: 1000, // 1m (1000mm) default grid spacing
    },
    wall: {
        dimensionMode: 'actual', // Default to actual dimension mode
        thickness: 160, // Default wall thickness 160mm
    },
    roof: {
        eaveOverhang: 0, // 軒出 (mm)
        gableOverhang: 0, // ケラバ (mm)
        slopeRatio: null,
        slopeAngle: null,
        roofType: 'flat',
        ridgeHeight: null,
    },
    currentTool: 'select',
    isGridSnapEnabled: false,

    // Actions - Legacy Drawing
    setDrawing: (url, name) => set({ drawingUrl: url, drawingName: name }),

    // Actions - Multiple Drawings
    setDrawingImportOpen: (open) => set({ drawingImportOpen: open }),

    addDrawing: (drawing) => {
        const id = generateId();
        const newDrawing: DrawingFile = {
            ...drawing,
            id,
            createdAt: new Date(),
        };
        set((state) => ({
            drawings: [...state.drawings, newDrawing],
        }));
        return id;
    },

    removeDrawing: (id) => set((state) => ({
        drawings: state.drawings.filter((d) => d.id !== id),
        // Clean up references
        backgroundDrawingId: state.backgroundDrawingId === id ? null : state.backgroundDrawingId,
        openDrawingTabs: state.openDrawingTabs.filter((tabId) => tabId !== id),
    })),

    updateDrawingStatus: (id, status) => set((state) => ({
        drawings: state.drawings.map((d) =>
            d.id === id ? { ...d, status } : d
        ),
    })),

    updateDrawingProcessedData: (id, processedData) => set((state) => ({
        drawings: state.drawings.map((d) =>
            d.id === id ? { ...d, processedData, status: 'ready' as const } : d
        ),
    })),

    updateDrawingUrl: (id, url) => set((state) => ({
        drawings: state.drawings.map((d) =>
            d.id === id ? { ...d, url } : d
        ),
    })),

    updateDrawingServerId: (id, serverId) => set((state) => ({
        drawings: state.drawings.map((d) =>
            d.id === id ? { ...d, serverId } : d
        ),
    })),

    updateDrawingFloor: (id, floor) => set((state) => ({
        drawings: state.drawings.map((d) =>
            d.id === id ? { ...d, floor } : d
        ),
    })),

    // Actions - Background Drawing
    setBackgroundDrawingId: (id) => set({ backgroundDrawingId: id }),
    setBackgroundOpacity: (opacity) => set({ backgroundOpacity: Math.max(0, Math.min(1, opacity)) }),

    // Actions - Dock & Tabs
    openDrawingTab: (id) => set((state) => {
        if (state.openDrawingTabs.includes(id)) return state;
        return {
            openDrawingTabs: [...state.openDrawingTabs, id],
            dockMinimized: false, // Auto-expand dock when opening a tab
        };
    }),

    closeDrawingTab: (id) => set((state) => ({
        openDrawingTabs: state.openDrawingTabs.filter((tabId) => tabId !== id),
    })),

    setDockMinimized: (minimized) => set({ dockMinimized: minimized }),
    setDockHeight: (height) => set({ dockHeight: Math.max(150, Math.min(400, height)) }),

    // Actions - Scale
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
    setPolylinePoints: (points) => set({
        polylinePoints: points,
        // If points exist, we are effectively "finished" with the shape or in a valid state
        isDrawingPolyline: false,
        edgeAttributes: {} // Reset edge attributes when setting new shape
    }),
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

    setWall: (config) => set((state) => ({
        wall: { ...state.wall, ...config }
    })),

    setRoof: (config) => set((state) => ({
        roof: { ...state.roof, ...config }
    })),

    setCurrentTool: (tool) => set({ currentTool: tool }),
}));
