import type React from 'react'
import { getColor } from '@/features/pathway/graph/colors'
import { activityEntryNodeUids } from '@/features/gocam/services/regionClipboard'
import type {
  RegionActivityEntry,
  RegionClipboardPayload,
} from '@/features/gocam/services/regionClipboard'

// Nominal node footprint in graph units. The stored offsets are real graph
// coordinates, so keeping these close to the canvas's own sizes makes the
// preview's proportions match what the paste will actually look like.
const NODE_W = 200
const NODE_H = 90
const PADDING = 20

/** Same mapping the canvas uses, so the preview reads as the same graph. */
function colorFor(type: RegionActivityEntry['activityType']): { fill: string; stroke: string } {
  const key = type === 'molecule' ? 'teal' : type === 'proteinComplex' ? 'purple' : 'green'
  return {
    fill: getColor(key, 100) ?? '#e5e7eb',
    stroke: getColor(key, 500) ?? '#9ca3af',
  }
}

const truncate = (text: string, max = 22) =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text

interface RegionPreviewProps {
  payload: RegionClipboardPayload
}

/**
 * Miniature of the region about to be pasted, drawn from the offsets stored at
 * copy time — so it is the actual copied layout, not an approximation of it.
 *
 * Relations are drawn between the activities that own their endpoints, which
 * needs the full node-uid walk: an endpoint isn't always an activity root.
 */
const RegionPreview: React.FC<RegionPreviewProps> = ({ payload }) => {
  const { activities, connections } = payload
  if (activities.length === 0) return null

  // Which activity owns each node uid, so connections can be placed.
  const ownerByNodeUid = new Map<string, number>()
  activities.forEach((entry, index) => {
    for (const uid of activityEntryNodeUids(entry)) ownerByNodeUid.set(uid, index)
    ownerByNodeUid.set(entry.rootNodeUid, index)
  })

  const centreOf = (index: number) => ({
    x: activities[index].offset.x + NODE_W / 2,
    y: activities[index].offset.y + NODE_H / 2,
  })

  const width = Math.max(...activities.map(a => a.offset.x)) + NODE_W + PADDING * 2
  const height = Math.max(...activities.map(a => a.offset.y)) + NODE_H + PADDING * 2

  const edges = connections
    .map(conn => {
      const from = ownerByNodeUid.get(conn.sourceNodeUid)
      const to = ownerByNodeUid.get(conn.targetNodeUid)
      if (from === undefined || to === undefined || from === to) return null
      return { from, to, key: `${conn.sourceNodeUid}->${conn.targetNodeUid}` }
    })
    .filter((edge): edge is { from: number; to: number; key: string } => edge !== null)

  return (
    <div className="overflow-hidden rounded border border-gray-200 bg-gray-50 p-2">
      <svg
        viewBox={`${-PADDING} ${-PADDING} ${width} ${height}`}
        className="max-h-48 w-full"
        role="img"
        aria-label={`Preview of ${activities.length} activities to paste`}
      >
        {edges.map(edge => {
          const a = centreOf(edge.from)
          const b = centreOf(edge.to)
          return (
            <line
              key={edge.key}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="#9ca3af"
              strokeWidth={3}
            />
          )
        })}

        {activities.map(entry => {
          const { fill, stroke } = colorFor(entry.activityType)
          return (
            <g key={entry.rootNodeUid}>
              <rect
                x={entry.offset.x}
                y={entry.offset.y}
                width={NODE_W}
                height={NODE_H}
                rx={10}
                fill={fill}
                stroke={stroke}
                strokeWidth={3}
              />
              <text
                x={entry.offset.x + NODE_W / 2}
                y={entry.offset.y + NODE_H / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={22}
                fill="#374151"
              >
                {truncate(entry.label)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default RegionPreview
