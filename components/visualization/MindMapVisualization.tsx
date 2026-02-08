'use client'

import { useEffect, useState, useRef } from 'react'
import * as d3 from 'd3'
import {
  VisualizationData,
  FilterState,
  LayoutType,
  TopicCount,
  VisualizationNode,
} from '@/lib/visualization/types'
import MindMapCanvas from './MindMapCanvas'
import MindMapControls from './MindMapControls'
import NodeExpansionPanel from './NodeExpansionPanel'
import TopicGenerator from './TopicGenerator'

interface MindMapVisualizationProps {
  conversationId: string
}

export default function MindMapVisualization({ conversationId }: MindMapVisualizationProps) {
  const [data, setData] = useState<VisualizationData | null>(null)
  const [topics, setTopics] = useState<TopicCount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [layout, setLayout] = useState<LayoutType>('force-directed')
  const [filters, setFilters] = useState<FilterState>({
    topics: [],
    roles: [],
    searchQuery: '',
  })
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [expandedNode, setExpandedNode] = useState<VisualizationNode | null>(null)
  const [isGeneratingTopics, setIsGeneratingTopics] = useState(false)
  const [topicsGenerated, setTopicsGenerated] = useState(0)
  const [totalMessages, setTotalMessages] = useState(0)

  const svgRef = useRef<SVGSVGElement | null>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)

  // Fetch visualization data
  const fetchVisualizationData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/conversations/${conversationId}/visualization`)
      if (!response.ok) {
        throw new Error('Failed to fetch visualization data')
      }

      const vizData: VisualizationData = await response.json()
      setData(vizData)
      setTotalMessages(vizData.nodes.length)

      // Check if topics need to be generated
      const messagesWithoutTopics = vizData.nodes.filter((node) =>
        node.topic.includes('...') || node.topic === '[Topic unavailable]'
      ).length

      if (messagesWithoutTopics > 0) {
        setIsGeneratingTopics(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load visualization')
    } finally {
      setLoading(false)
    }
  }

  // Fetch topics for filtering
  const fetchTopics = async () => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/topics`)
      if (response.ok) {
        const data = await response.json()
        setTopics(data.topics || [])
      }
    } catch (err) {
      console.error('Failed to fetch topics:', err)
    }
  }

  useEffect(() => {
    fetchVisualizationData()
    fetchTopics()
  }, [conversationId])

  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId)
    const node = data?.nodes.find((n) => n.id === nodeId)
    if (node) {
      setExpandedNode(node)
    }
  }

  const handleCloseExpansion = () => {
    setExpandedNode(null)
    setSelectedNodeId(null)
  }

  const handleTopicGenerationComplete = () => {
    setIsGeneratingTopics(false)
    // Refresh visualization data and topics
    fetchVisualizationData()
    fetchTopics()
  }

  const handleTopicGenerationCancel = () => {
    setIsGeneratingTopics(false)
  }

  const handleZoomIn = () => {
    if (svgRef.current && zoomRef.current) {
      const svg = d3.select(svgRef.current)
      svg.transition().duration(300).call(zoomRef.current.scaleBy, 1.3)
    }
  }

  const handleZoomOut = () => {
    if (svgRef.current && zoomRef.current) {
      const svg = d3.select(svgRef.current)
      svg.transition().duration(300).call(zoomRef.current.scaleBy, 0.7)
    }
  }

  const handleFitToScreen = () => {
    if (svgRef.current && zoomRef.current) {
      const svg = d3.select(svgRef.current)
      svg.transition().duration(300).call(zoomRef.current.transform, d3.zoomIdentity)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">Loading visualization...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold text-red-900 mb-2">
            Failed to Load Visualization
          </h2>
          <p className="text-red-700 mb-6">{error}</p>
          <button
            onClick={fetchVisualizationData}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // No data state
  if (!data || data.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📭</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            No Messages to Visualize
          </h2>
          <p className="text-gray-600 mb-6">
            This conversation doesn't have any messages to display in the mind map.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-screen bg-gray-50">
      {/* Controls */}
      <MindMapControls
        layout={layout}
        onLayoutChange={setLayout}
        filters={filters}
        onFilterChange={setFilters}
        availableTopics={topics}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitToScreen={handleFitToScreen}
      />

      {/* Canvas */}
      <div className="absolute top-[73px] left-0 right-0 bottom-0">
        <MindMapCanvas
          nodes={data.nodes}
          edges={data.edges}
          layout={layout}
          onNodeClick={handleNodeClick}
          selectedNodeId={selectedNodeId}
          expandedNodeId={expandedNode?.id || null}
          filters={filters}
        />
      </div>

      {/* Node Expansion Panel */}
      {expandedNode && (
        <NodeExpansionPanel
          node={expandedNode}
          onClose={handleCloseExpansion}
        />
      )}

      {/* Topic Generator */}
      {isGeneratingTopics && (
        <TopicGenerator
          conversationId={conversationId}
          current={topicsGenerated}
          total={totalMessages}
          onComplete={handleTopicGenerationComplete}
          onCancel={handleTopicGenerationCancel}
        />
      )}
    </div>
  )
}
