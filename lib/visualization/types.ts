// TypeScript interfaces for mind map visualization
// REQ-3: Mind Map Visualization Engine

// Core data structures for D3.js visualization
export interface VisualizationNode {
  id: string // Message UUID
  topic: string // AI-extracted topic (max 30 chars displayed)
  role: 'user' | 'assistant' | 'system'
  content: string // Full message content
  timestamp: string // ISO 8601 format
  message_index: number // Sequential order in conversation
  x?: number // D3 position (set by simulation)
  y?: number // D3 position (set by simulation)
  fx?: number | null // Fixed x position (for pinning)
  fy?: number | null // Fixed y position (for pinning)
}

export interface VisualizationEdge {
  source: string // Source node ID
  target: string // Target node ID
}

export interface VisualizationData {
  conversation: {
    id: string
    title: string
    message_count: number
  }
  nodes: VisualizationNode[]
  edges: VisualizationEdge[]
}

// Filter and layout types
export interface FilterState {
  topics: string[] // Selected topic labels
  roles: ('user' | 'assistant' | 'system')[] // Selected roles
  searchQuery: string // Search text
}

export type LayoutType = 'force-directed' | 'hierarchical' | 'radial'

// Topic data for filtering
export interface TopicCount {
  topic: string
  count: number
}

// Component prop interfaces
export interface MindMapNodeProps {
  node: VisualizationNode
  isSelected: boolean
  isExpanded: boolean
  isHighlighted: boolean
  isDimmed: boolean
  onClick: (nodeId: string) => void
  scale: number // Current zoom scale for responsive sizing
}

export interface MindMapCanvasProps {
  nodes: VisualizationNode[]
  edges: VisualizationEdge[]
  layout: LayoutType
  onNodeClick: (nodeId: string) => void
  selectedNodeId: string | null
  expandedNodeId: string | null
  filters: FilterState
  onZoomChange?: (scale: number) => void
}

export interface MindMapControlsProps {
  layout: LayoutType
  onLayoutChange: (layout: LayoutType) => void
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
  availableTopics: TopicCount[]
  onZoomIn: () => void
  onZoomOut: () => void
  onFitToScreen: () => void
}

export interface TopicGeneratorProps {
  conversationId: string
  current: number // Messages processed
  total: number // Total messages
  onComplete: () => void
  onCancel: () => void
}

// API response types
export interface GenerateTopicsProgress {
  type: 'progress' | 'complete' | 'error'
  current?: number
  total?: number
  topics_generated?: number
  error?: string
}

export interface TopicsListResponse {
  topics: TopicCount[]
}

// D3 simulation types (for internal use in components)
export interface D3Node extends VisualizationNode {
  vx?: number
  vy?: number
  index?: number
}

export interface D3Edge extends VisualizationEdge {
  index?: number
}

// Layout position calculation result
export interface LayoutPositions {
  [nodeId: string]: {
    x: number
    y: number
  }
}
