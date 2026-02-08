'use client'

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { MindMapCanvasProps, D3Node, D3Edge } from '@/lib/visualization/types'
import { calculateLayoutPositions } from '@/lib/visualization/layouts'

export default function MindMapCanvas({
  nodes,
  edges,
  layout,
  onNodeClick,
  selectedNodeId,
  expandedNodeId,
  filters,
  onZoomChange,
}: MindMapCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const simulationRef = useRef<d3.Simulation<D3Node, D3Edge> | null>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  // Handle window resize
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current?.parentElement) {
        const parent = svgRef.current.parentElement
        setDimensions({
          width: parent.clientWidth,
          height: parent.clientHeight || 600,
        })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Filter nodes based on filters
  const filteredNodes = nodes.filter((node) => {
    // Role filter
    if (filters.roles.length > 0 && !filters.roles.includes(node.role)) {
      return false
    }

    // Topic filter
    if (filters.topics.length > 0 && !filters.topics.includes(node.topic)) {
      return false
    }

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      return (
        node.topic.toLowerCase().includes(query) ||
        node.content.toLowerCase().includes(query)
      )
    }

    return true
  })

  // Filter edges to only include those connecting visible nodes
  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id))
  const filteredEdges = edges.filter(
    (edge) =>
      filteredNodeIds.has(edge.source as string) &&
      filteredNodeIds.has(edge.target as string)
  )

  // Check if node matches search query
  const isHighlighted = (node: D3Node): boolean => {
    if (!filters.searchQuery) return false
    const query = filters.searchQuery.toLowerCase()
    return (
      node.topic.toLowerCase().includes(query) ||
      node.content.toLowerCase().includes(query)
    )
  }

  useEffect(() => {
    if (!svgRef.current || filteredNodes.length === 0) return

    const svg = d3.select(svgRef.current)
    const { width, height } = dimensions

    // Clear previous content
    svg.selectAll('*').remove()

    // Create container group for zoom/pan
    const container = svg.append('g').attr('class', 'container')

    // Create zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        container.attr('transform', event.transform)
        if (onZoomChange) {
          onZoomChange(event.transform.k)
        }
      })

    svg.call(zoom)

    // Clone nodes to avoid mutating props
    const d3Nodes: D3Node[] = filteredNodes.map((node) => ({ ...node }))
    const d3Edges: D3Edge[] = filteredEdges.map((edge) => ({ ...edge }))

    // Calculate layout positions
    const layoutPositions = calculateLayoutPositions(
      filteredNodes,
      filteredEdges,
      layout,
      width,
      height
    )

    // Apply layout positions to nodes
    d3Nodes.forEach((node) => {
      const pos = layoutPositions[node.id]
      if (pos) {
        if (layout === 'force-directed') {
          // For force-directed, set initial positions if not already set
          if (node.x === undefined) node.x = pos.x
          if (node.y === undefined) node.y = pos.y
        } else {
          // For other layouts, fix positions
          node.x = pos.x
          node.y = pos.y
          node.fx = pos.x
          node.fy = pos.y
        }
      }
    })

    // Initialize force simulation only for force-directed layout
    let simulation: d3.Simulation<D3Node, D3Edge>

    if (layout === 'force-directed') {
      simulation = d3
        .forceSimulation<D3Node>(d3Nodes)
        .force(
          'link',
          d3
            .forceLink<D3Node, D3Edge>(d3Edges)
            .id((d) => d.id)
            .distance(100)
        )
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(50))
    } else {
      // For static layouts, create simulation without forces
      simulation = d3.forceSimulation<D3Node>(d3Nodes).stop()
    }

    simulationRef.current = simulation

    // Draw edges
    const link = container
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(d3Edges)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 1)

    // Draw nodes
    const node = container
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(d3Nodes)
      .join('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(
        d3
          .drag<any, D3Node>()
          .on('start', (event, d) => {
            if (layout === 'force-directed') {
              if (!event.active) simulation.alphaTarget(0.3).restart()
            }
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d) => {
            if (layout === 'force-directed') {
              if (!event.active) simulation.alphaTarget(0)
            }
            // Keep node pinned
          })
      )
      .on('click', (event, d) => {
        event.stopPropagation()
        onNodeClick(d.id)
      })
      .on('dblclick', (event, d) => {
        event.stopPropagation()
        // Unpin node on double-click
        d.fx = null
        d.fy = null
        simulation.alpha(0.3).restart()
      })

    // Add circles to nodes
    node
      .append('circle')
      .attr('r', (d) => (d.id === expandedNodeId ? 60 : 40))
      .attr('fill', (d) => {
        if (d.role === 'user') return '#3b82f6' // Blue
        if (d.role === 'assistant') return '#8b5cf6' // Purple
        return '#6b7280' // Gray for system
      })
      .attr('stroke', (d) => {
        if (d.id === selectedNodeId) return '#fbbf24' // Yellow for selected
        if (isHighlighted(d)) return '#10b981' // Green for highlighted
        return '#fff'
      })
      .attr('stroke-width', (d) => {
        if (d.id === selectedNodeId || isHighlighted(d)) return 3
        return 2
      })
      .attr('opacity', (d) => {
        if (!filters.searchQuery) return 1
        return isHighlighted(d) ? 1 : 0.3
      })

    // Add topic labels
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.3em')
      .attr('fill', 'white')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .attr('pointer-events', 'none')
      .each(function (d) {
        const text = d3.select(this)
        const words = d.topic.split(/\s+/)
        const maxWidth = 70

        // Simple text wrapping
        let line: string[] = []
        let lineNumber = 0
        const lineHeight = 1.1
        const y = 0
        const dy = 0

        words.forEach((word) => {
          line.push(word)
          const testLine = line.join(' ')

          // If line is too long, create tspan for previous words
          if (testLine.length > 15) {
            line.pop()
            if (line.length > 0) {
              text
                .append('tspan')
                .attr('x', 0)
                .attr('y', y)
                .attr('dy', `${lineNumber * lineHeight + dy}em`)
                .text(line.join(' '))
              lineNumber++
            }
            line = [word]
          }
        })

        // Add last line
        if (line.length > 0) {
          text
            .append('tspan')
            .attr('x', 0)
            .attr('y', y)
            .attr('dy', `${lineNumber * lineHeight + dy}em`)
            .text(line.join(' '))
        }
      })

    // Update positions based on layout type
    if (layout === 'force-directed') {
      // For force-directed, update on simulation tick
      simulation.on('tick', () => {
        link
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y)

        node.attr('transform', (d) => `translate(${d.x},${d.y})`)
      })
    } else {
      // For static layouts, animate transition to positions
      node
        .transition()
        .duration(1000)
        .attr('transform', (d) => `translate(${d.x},${d.y})`)

      link
        .transition()
        .duration(1000)
        .attr('x1', (d: any) => {
          const sourceNode = d3Nodes.find((n) => n.id === d.source.id || n.id === d.source)
          return sourceNode?.x || 0
        })
        .attr('y1', (d: any) => {
          const sourceNode = d3Nodes.find((n) => n.id === d.source.id || n.id === d.source)
          return sourceNode?.y || 0
        })
        .attr('x2', (d: any) => {
          const targetNode = d3Nodes.find((n) => n.id === d.target.id || n.id === d.target)
          return targetNode?.x || 0
        })
        .attr('y2', (d: any) => {
          const targetNode = d3Nodes.find((n) => n.id === d.target.id || n.id === d.target)
          return targetNode?.y || 0
        })
    }

    // Cleanup
    return () => {
      simulation.stop()
    }
  }, [
    filteredNodes,
    filteredEdges,
    dimensions,
    selectedNodeId,
    expandedNodeId,
    filters,
    layout,
    onNodeClick,
    onZoomChange,
  ])

  return (
    <div className="relative w-full h-full min-h-[600px] bg-gray-50 rounded-lg overflow-hidden">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        className="block"
      />
      {filteredNodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p className="text-lg font-semibold mb-2">No nodes to display</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        </div>
      )}
    </div>
  )
}
