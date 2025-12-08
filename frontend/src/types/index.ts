// Screen B - Core Types

// View types for canvas area
export type ViewType = 'building-plan' | 'building-elevation' | 'scaffold-plan' | '3d' | 'isometric' | 'perspective';

// Tool modes
export type ToolMode = 'select' | 'edit-outline' | 'opening-line' | 'lasso';

// Point coordinate
export interface Point {
  x: number;
  y: number;
}

// 3D Point coordinate
export interface Point3D {
  x: number;
  y: number;
  z: number;
}

// Polyline vertex
export interface Vertex extends Point {
  id: string;
}

// Building outline polygon
export interface BuildingOutline {
  id: string;
  vertices: Vertex[];
  closed: boolean;
}

// Height condition
export interface HeightCondition {
  floors: number;
  floorHeight: number;  // mm
  eaveHeight: number;   // mm
  roofPeakHeight: number; // mm
}

// Opening (door/window)
export interface Opening {
  id: string;
  start: Point;
  end: Point;
  width: number;  // mm
  type: 'door' | 'window' | 'other';
}

// Scaffold member types
export type ScaffoldMemberType =
  | 'post'         // 支柱
  | 'ledger'       // 布材
  | 'handrail'     // 手すり
  | 'bracket'      // ブラケット
  | 'stairs'       // 階段
  | 'advance-rail' // 先行手すり
  | 'cantilever'   // ハネ
  | 'brace'        // 筋交
  | 'jack';        // ジャッキ

// Scaffold member
export interface ScaffoldMember {
  id: string;
  type: ScaffoldMemberType;
  start: Point3D;
  end: Point3D;
  length: number;  // mm
  face: 'north' | 'south' | 'east' | 'west';
}

// Uploaded drawing file
export interface DrawingFile {
  id: string;
  name: string;
  type: 'plan' | 'elevation';
  url: string;
  scale: number;  // pixels per mm
}

// Project/Case data
export interface Project {
  id: string;
  name: string;
  address?: string;
  status: 'draft' | 'in-progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  drawings: DrawingFile[];
  outline?: BuildingOutline;
  heightCondition?: HeightCondition;
  openings: Opening[];
  scaffoldMembers: ScaffoldMember[];
}

// Panel tab types
export type SidePanelTab = 'building' | 'scaffold' | 'quantity' | 'chat';

// Chat message
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Floating panel state
export interface FloatingPanelState {
  visible: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}
