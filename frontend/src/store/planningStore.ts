import { create } from 'zustand';
import type {
  ViewType,
  ToolMode,
  SidePanelTab,
  BuildingOutline,
  HeightCondition,
  Opening,
  ScaffoldMember,
  DrawingFile,
  DrawingFileType,
  ChatMessage,
  FloatingPanelState,
  Point,
  ProcessedDrawingData,
} from '@/types';

interface PlanningState {
  // View state
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;

  // Tool state
  currentTool: ToolMode;
  setCurrentTool: (tool: ToolMode) => void;

  // Display options
  gridEnabled: boolean;
  toggleGrid: () => void;
  snapEnabled: boolean;
  toggleSnap: () => void;

  // Side panel
  activePanelTab: SidePanelTab;
  setActivePanelTab: (tab: SidePanelTab) => void;
  sidePanelCollapsed: boolean;
  toggleSidePanel: () => void;

  // Building data
  drawings: DrawingFile[];
  addDrawing: (drawing: DrawingFile) => void;
  removeDrawing: (id: string) => void;
  updateDrawingStatus: (id: string, status: DrawingFile['status'], errorMessage?: string) => void;
  updateDrawingProcessedData: (id: string, processedData: ProcessedDrawingData) => void;

  // Drawing import dialog
  drawingImportOpen: boolean;
  setDrawingImportOpen: (open: boolean) => void;

  // Background drawing overlay
  backgroundDrawingId: string | null;
  setBackgroundDrawingId: (id: string | null) => void;
  backgroundOpacity: number;
  setBackgroundOpacity: (opacity: number) => void;
  showFloorOutlines: boolean;
  toggleShowFloorOutlines: () => void;
  showDimensions: boolean;
  toggleShowDimensions: () => void;
  showEntrances: boolean;
  toggleShowEntrances: () => void;

  outline: BuildingOutline | null;
  setOutline: (outline: BuildingOutline | null) => void;
  updateVertex: (vertexId: string, position: Point) => void;

  heightCondition: HeightCondition;
  setHeightCondition: (condition: HeightCondition) => void;

  openings: Opening[];
  addOpening: (opening: Opening) => void;
  removeOpening: (id: string) => void;

  // Scaffold data
  scaffoldMembers: ScaffoldMember[];
  setScaffoldMembers: (members: ScaffoldMember[]) => void;

  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;

  // Floating reference viewer
  referenceViewer: FloatingPanelState;
  setReferenceViewerVisible: (visible: boolean) => void;
  updateReferenceViewerPosition: (x: number, y: number) => void;
  updateReferenceViewerSize: (width: number, height: number) => void;

  // Canvas state
  canvasScale: number;
  setCanvasScale: (scale: number) => void;
  canvasOffset: Point;
  setCanvasOffset: (offset: Point) => void;

  // Project meta
  projectName: string;
  setProjectName: (name: string) => void;
}

export const usePlanningStore = create<PlanningState>((set) => ({
  // View state
  currentView: 'building-plan',
  setCurrentView: (view) => set({ currentView: view }),

  // Tool state
  currentTool: 'select',
  setCurrentTool: (tool) => set({ currentTool: tool }),

  // Display options
  gridEnabled: true,
  toggleGrid: () => set((state) => ({ gridEnabled: !state.gridEnabled })),
  snapEnabled: true,
  toggleSnap: () => set((state) => ({ snapEnabled: !state.snapEnabled })),

  // Side panel
  activePanelTab: 'building',
  setActivePanelTab: (tab) => set({ activePanelTab: tab }),
  sidePanelCollapsed: false,
  toggleSidePanel: () => set((state) => ({ sidePanelCollapsed: !state.sidePanelCollapsed })),

  // Building data
  drawings: [],
  addDrawing: (drawing) => set((state) => ({ drawings: [...state.drawings, drawing] })),
  removeDrawing: (id) => set((state) => ({ drawings: state.drawings.filter((d) => d.id !== id) })),
  updateDrawingStatus: (id, status, errorMessage) =>
    set((state) => ({
      drawings: state.drawings.map((d) =>
        d.id === id ? { ...d, status, errorMessage } : d
      ),
    })),
  updateDrawingProcessedData: (id, processedData) =>
    set((state) => ({
      drawings: state.drawings.map((d) =>
        d.id === id ? { ...d, processedData, status: 'ready' as const } : d
      ),
    })),

  // Drawing import dialog
  drawingImportOpen: false,
  setDrawingImportOpen: (open) => set({ drawingImportOpen: open }),

  // Background drawing overlay
  backgroundDrawingId: null,
  setBackgroundDrawingId: (id) => set({ backgroundDrawingId: id }),
  backgroundOpacity: 0.3,
  setBackgroundOpacity: (opacity) => set({ backgroundOpacity: opacity }),
  showFloorOutlines: true,
  toggleShowFloorOutlines: () => set((state) => ({ showFloorOutlines: !state.showFloorOutlines })),
  showDimensions: true,
  toggleShowDimensions: () => set((state) => ({ showDimensions: !state.showDimensions })),
  showEntrances: true,
  toggleShowEntrances: () => set((state) => ({ showEntrances: !state.showEntrances })),

  outline: null,
  setOutline: (outline) => set({ outline }),
  updateVertex: (vertexId, position) =>
    set((state) => {
      if (!state.outline) return state;
      return {
        outline: {
          ...state.outline,
          vertices: state.outline.vertices.map((v) =>
            v.id === vertexId ? { ...v, ...position } : v
          ),
        },
      };
    }),

  heightCondition: {
    floors: 2,
    floorHeight: 2800,
    eaveHeight: 5600,
    roofPeakHeight: 7000,
  },
  setHeightCondition: (condition) => set({ heightCondition: condition }),

  openings: [],
  addOpening: (opening) => set((state) => ({ openings: [...state.openings, opening] })),
  removeOpening: (id) => set((state) => ({ openings: state.openings.filter((o) => o.id !== id) })),

  // Scaffold data
  scaffoldMembers: [],
  setScaffoldMembers: (members) => set({ scaffoldMembers: members }),

  // Chat
  chatMessages: [],
  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [
        ...state.chatMessages,
        {
          ...message,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        },
      ],
    })),

  // Floating reference viewer
  referenceViewer: {
    visible: false,
    x: 100,
    y: 100,
    width: 400,
    height: 300,
  },
  setReferenceViewerVisible: (visible) =>
    set((state) => ({ referenceViewer: { ...state.referenceViewer, visible } })),
  updateReferenceViewerPosition: (x, y) =>
    set((state) => ({ referenceViewer: { ...state.referenceViewer, x, y } })),
  updateReferenceViewerSize: (width, height) =>
    set((state) => ({ referenceViewer: { ...state.referenceViewer, width, height } })),

  // Canvas state
  canvasScale: 1,
  setCanvasScale: (scale) => set({ canvasScale: scale }),
  canvasOffset: { x: 0, y: 0 },
  setCanvasOffset: (offset) => set({ canvasOffset: offset }),

  // Project meta
  projectName: '新規案件',
  setProjectName: (name) => set({ projectName: name }),
}));
