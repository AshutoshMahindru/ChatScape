// Layout calculation functions for mind map visualization
import * as d3 from 'd3'
import { VisualizationNode, VisualizationEdge, LayoutPositions, LayoutType } from './types'

export function calculateLayoutPositions(
  nodes: VisualizationNode[],
  edges: VisualizationEdge[],
  layout: LayoutType,
  width: number,
  height: number
): LayoutPositions {
  const positions: LayoutPositions = {}

  switch (layout) {
    case 'hierarchical':
      return calculateHierarchicalLayout(nodes, width, height)

    case 'radial':
      return calculateRadialLayout(nodes, width, height)

    case 'force-directed':
    default:
      // For force-directed, return current positions (simulation handles it)
      nodes.forEach((node) => {
        positions[node.id] = {
          x: node.x || width / 2,
          y: node.y || height / 2,
        }
      })
      return positions
  }
}

function calculateHierarchicalLayout(
  nodes: VisualizationNode[],
  width: number,
  height: number
): LayoutPositions {
  const positions: LayoutPositions = {}

  // Sort nodes by message_index
  const sortedNodes = [...nodes].sort((a, b) => a.message_index - b.message_index)

  // Simple tree layout based on message order
  // Create a hierarchy where each message is a child of the previous
  interface HierarchyNode {
    id: string
    children?: HierarchyNode[]
    data: VisualizationNode
  }

  const root: HierarchyNode = {
    id: sortedNodes[0].id,
    data: sortedNodes[0],
    children: [],
  }

  // Build tree structure
  let currentNode = root
  for (let i = 1; i < sortedNodes.length; i++) {
    const newNode: HierarchyNode = {
      id: sortedNodes[i].id,
      data: sortedNodes[i],
      children: [],
    }
    if (!currentNode.children) {
      currentNode.children = []
    }
    currentNode.children.push(newNode)
    currentNode = newNode
  }

  // Use D3 tree layout
  const treeLayout = d3
    .tree<HierarchyNode>()
    .size([width - 100, height - 100])
    .separation(() => 1)

  const hierarchy = d3.hierarchy(root)
  const treeData = treeLayout(hierarchy)

  // Extract positions
  treeData.descendants().forEach((d) => {
    positions[d.data.id] = {
      x: d.x + 50, // Offset from left
      y: d.y + 50, // Offset from top
    }
  })

  return positions
}

function calculateRadialLayout(
  nodes: VisualizationNode[],
  width: number,
  height: number
): LayoutPositions {
  const positions: LayoutPositions = {}
  const center = { x: width / 2, y: height / 2 }
  const maxRadius = Math.min(width, height) / 2 - 100

  // Group nodes by day
  const nodesByDay = d3.group(nodes, (d) => {
    const date = new Date(d.timestamp)
    return date.toISOString().split('T')[0] // YYYY-MM-DD
  })

  const days = Array.from(nodesByDay.keys()).sort()

  // If only one day or no timestamps, use single ring
  if (days.length <= 1) {
    const radius = maxRadius * 0.7
    const angleStep = (2 * Math.PI) / nodes.length

    nodes.forEach((node, i) => {
      const angle = i * angleStep - Math.PI / 2 // Start from top
      positions[node.id] = {
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle),
      }
    })
  } else {
    // Multiple rings by day
    const ringSpacing = maxRadius / days.length

    days.forEach((day, ringIndex) => {
      const nodesInRing = nodesByDay.get(day)!
      const radius = (ringIndex + 1) * ringSpacing
      const angleStep = (2 * Math.PI) / nodesInRing.length

      nodesInRing.forEach((node, i) => {
        const angle = i * angleStep - Math.PI / 2 // Start from top
        positions[node.id] = {
          x: center.x + radius * Math.cos(angle),
          y: center.y + radius * Math.sin(angle),
        }
      })
    })
  }

  return positions
}
