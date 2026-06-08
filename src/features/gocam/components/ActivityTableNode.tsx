import type React from 'react'
import { useCallback, useRef, useState } from 'react'
import { ActionIcon, Menu } from '@mantine/core'
import { usePopover } from '@/@noctua.core/hooks/usePopover'
import { FaEllipsisV, FaPlus } from 'react-icons/fa'
import ConfirmDialog from '@/@noctua.core/components/dialog/ConfirmDialog'
import type { Edge, Evidence, UserContext, DisplayTreeNode } from '../models/cam'
import { ActivityType, RootTypes, Aspect } from '../models/cam'
import { AnnotationKey } from '../models/operations'
import { EditorCategory } from '../models/editorCategory'
import { ENVIRONMENT } from '@/@noctua.core/data/constants'
import EditableCell from '@/@noctua.core/components/cell/EditableCell'
import EvidenceRow from './EvidenceRow'
import { useOpenAnnotationForm } from '../hooks/useOpenAnnotationForm'
import {
  buildAddNodeOperations,
  buildEditIndividualTypeOperations,
  buildReconcileEdgeEvidenceOperations,
} from '../services/activityOperations'
import { evidenceToForm } from '../models/formModels'
import { useActivityNodeEditor } from '../hooks/useActivityNodeEditor'
import { getInsertMenuItems } from '../data/insertMenuConfig'
import type { InsertMenuItem } from '../data/insertMenuConfig'
import { getPrimaryRootType } from '../data/nodeCategories'
import EditorDropdown from './forms/EditorDropdown'
import type { EditorDropdownValues } from './forms/EditorDropdown'

interface ActivityTableNodeProps {
  treeNode: DisplayTreeNode
  modelId: string
  userContext?: UserContext
  allEdges: Edge[]
  onNodeDeleted?: () => void
  gpNodeId?: string
  activityType: ActivityType
}

function getAspectFromRootTypes(rootTypes: string[]): Aspect | null {
  if (rootTypes.includes(RootTypes.MOLECULAR_FUNCTION)) return Aspect.MOLECULAR_FUNCTION
  if (rootTypes.includes(RootTypes.BIOLOGICAL_PROCESS)) return Aspect.BIOLOGICAL_PROCESS
  if (rootTypes.includes(RootTypes.CELLULAR_COMPONENT)) return Aspect.CELLULAR_COMPONENT
  return null
}

// Aspect-based tree connector colors — mirrors EntityRow's TREE_BORDER.
// Null aspect (gene products, molecules) falls back to blue (GP).
const TREE_BORDER_BY_ASPECT: Record<Aspect, string> = {
  [Aspect.MOLECULAR_FUNCTION]: 'border-green-400',
  [Aspect.BIOLOGICAL_PROCESS]: 'border-orange-400',
  [Aspect.CELLULAR_COMPONENT]: 'border-purple-400',
}

// ── Main ActivityTableNode ──────────────────────────────────────────

const ActivityTableNode: React.FC<ActivityTableNodeProps> = ({
  treeNode,
  modelId,
  userContext,
  allEdges,
  onNodeDeleted,
  gpNodeId,
  activityType,
}) => {
  const { node, edge, children, treeLevel, canDelete, showEvidence, showMenu, showAddButton } =
    treeNode
  const evidence = edge?.evidence ?? []

  const termCellRef = useRef<HTMLDivElement>(null)
  const actionCellRef = useRef<HTMLDivElement>(null)
  // EditorDropdown is now only used for single-field term edits on this row.
  const editor = usePopover<{ category: EditorCategory }>()

  const {
    updateGraphModel,
    resolvedUserContext,
    handleRemoveEvidence,
    handleClearField,
    handleDeleteNode: handleDeleteNodeRaw,
  } = useActivityNodeEditor({ nodeUid: node.uid, modelId, userContext, allEdges, onNodeDeleted })

  const usedEdges = allEdges
    .filter(e => e.sourceId === node.uid)
    .map(e => ({
      predicateId: e.id,
      targetType: getPrimaryRootType(e.target?.rootTypes ?? []) ?? '',
    }))
  // Most-specific-first: a complex carries both CC and complex root types; resolve
  // to the complex so its `+` menu offers `has part`, not CC's `part of`.
  const insertMenuItems = getInsertMenuItems(
    getPrimaryRootType(node.rootTypes) ?? '',
    usedEdges,
    edge?.id
  )
  const termWidth = 250 - (treeLevel - 1) * 20
  const { aspect } = treeNode
  const treeBorder = aspect ? TREE_BORDER_BY_ASPECT[aspect] : 'border-blue-400'

  const openAnnotationForm = useOpenAnnotationForm()

  const handleEditorSave = useCallback(
    async (values: EditorDropdownValues) => {
      if (editor.data?.category === EditorCategory.term && values.term) {
        await updateGraphModel(
          buildEditIndividualTypeOperations(node.uid, node.id, values.term.id, modelId)
        )
      }
      editor.close()
    },
    [editor, node.uid, node.id, modelId, updateGraphModel]
  )

  const [nodeDeleteConfirmOpen, setNodeDeleteConfirmOpen] = useState(false)
  const [evidencePendingDelete, setEvidencePendingDelete] = useState<Evidence | null>(null)
  const [fieldPendingClear, setFieldPendingClear] = useState<{
    ev: Evidence
    key: AnnotationKey.SOURCE | AnnotationKey.WITH
  } | null>(null)

  const requestDeleteNode = useCallback(() => {
    setNodeDeleteConfirmOpen(true)
  }, [])

  const confirmDeleteNode = useCallback(async () => {
    setNodeDeleteConfirmOpen(false)
    await handleDeleteNodeRaw()
  }, [handleDeleteNodeRaw])

  const requestRemoveEvidence = useCallback((ev: Evidence) => {
    setEvidencePendingDelete(ev)
  }, [])

  const confirmRemoveEvidence = useCallback(async () => {
    if (!evidencePendingDelete) return
    const ev = evidencePendingDelete
    setEvidencePendingDelete(null)
    await handleRemoveEvidence(ev)
  }, [evidencePendingDelete, handleRemoveEvidence])

  const requestClearField = useCallback(
    (ev: Evidence, key: AnnotationKey.SOURCE | AnnotationKey.WITH) => {
      setFieldPendingClear({ ev, key })
    },
    []
  )

  const confirmClearField = useCallback(async () => {
    if (!fieldPendingClear) return
    const { ev, key } = fieldPendingClear
    setFieldPendingClear(null)
    await handleClearField(ev, key)
  }, [fieldPendingClear, handleClearField])

  const handleInsertNode = useCallback(
    (item: InsertMenuItem) => {
      const targetAspect = getAspectFromRootTypes([item.targetType])
      openAnnotationForm({
        showTerm: true,
        title: `Add ${item.label}`,
        termLabel: item.label,
        termRootTypes: [item.targetType],
        gpId: gpNodeId,
        aspect: targetAspect,
        activityType,
        onSubmit: async ({ term, evidences }) => {
          if (!term) return
          await updateGraphModel(
            buildAddNodeOperations(
              node.uid,
              item.predicate.id,
              item.targetType,
              modelId,
              resolvedUserContext,
              { termId: term.id, evidences }
            )
          )
        },
      })
    },
    [openAnnotationForm, gpNodeId, activityType, node.uid, modelId, resolvedUserContext, updateGraphModel]
  )

  const handleAddEvidence = useCallback(() => {
    if (!edge) return
    const existing = edge.evidence ?? []
    openAnnotationForm({
      showTerm: false,
      title: existing.length > 0 ? 'Edit Evidence' : 'Add Evidence',
      // Pre-load every existing evidence row so the form shows them all.
      initialEvidences: existing.map(evidenceToForm),
      gpId: gpNodeId,
      aspect,
      activityType,
      onSubmit: async ({ evidences }) => {
        const ops = buildReconcileEdgeEvidenceOperations(
          edge,
          existing,
          evidences,
          modelId,
          resolvedUserContext
        )
        if (ops.length > 0) await updateGraphModel(ops)
      },
    })
  }, [edge, openAnnotationForm, gpNodeId, aspect, activityType, modelId, resolvedUserContext, updateGraphModel])

  return (
    <>
      <div className="mb-2 flex w-full flex-row items-stretch justify-start">
        {/* Tree connector lines */}
        {treeLevel > 1 &&
          Array.from({ length: treeLevel - 1 }, (_, i) => {
            const isConnector = i === treeLevel - 2
            return (
              <div key={i} className="relative flex w-5 shrink-0 flex-col items-stretch">
                <div className={`ml-2 h-full border-l-2 ${treeBorder}`} />
                {isConnector && (
                  <div className={`absolute left-2 right-0 top-1/2 border-t-2 ${treeBorder}`} />
                )}
              </div>
            )
          })}

        {/* Term cell — a node with no evidence of its own (the gene product /
            chemical / protein-containing complex) widens to fill the row; rows
            that carry evidence keep the fixed term width beside their columns. */}
        <EditableCell
          ref={termCellRef}
          label={treeNode.floatingLabel}
          onEdit={() => {
            if (termCellRef.current) {
              editor.open(termCellRef.current, { category: EditorCategory.term })
            }
          }}
          onDelete={canDelete ? requestDeleteNode : undefined}
          className={showEvidence ? 'shrink-0' : 'min-w-0 flex-1'}
          style={showEvidence ? { flexBasis: termWidth } : undefined}
        >
          {node.label ? (
            <span>
              {node.label}
              <br />
              <a
                href={`${ENVIRONMENT.amigoTermUrl}${node.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {node.id}
              </a>
            </span>
          ) : (
            <span className="italic text-gray-400">—</span>
          )}
        </EditableCell>

        {/* Evidence cells */}
        {showEvidence && (
          <div className="flex min-w-0 flex-1 flex-col items-stretch p-0">
            {evidence.length > 0 ? (
              evidence.map(ev =>
                edge ? (
                  <EvidenceRow
                    key={ev.uid}
                    ev={ev}
                    modelId={modelId}
                    userContext={resolvedUserContext}
                    onRemoveEvidence={requestRemoveEvidence}
                    onClearField={requestClearField}
                  />
                ) : null
              )
            ) : activityType !== ActivityType.MOLECULE ? (
              <div className="flex items-center px-2 py-1 text-2xs italic text-gray-400">
                no evidence present.
              </div>
            ) : null}
          </div>
        )}

        {/* Action cell */}
        <div ref={actionCellRef} className="flex w-10 shrink-0 flex-col items-center justify-center p-0">
          {showMenu && (
            <Menu shadow="md" position="bottom-end" withinPortal>
              <Menu.Target>
                <ActionIcon variant="light" color="primary" radius="xl" size="md">
                  <FaEllipsisV size={12} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                {insertMenuItems.length > 0 && (
                  <Menu.Sub position="left-start">
                    <Menu.Sub.Target>
                      <Menu.Sub.Item>Add Context</Menu.Sub.Item>
                    </Menu.Sub.Target>
                    <Menu.Sub.Dropdown>
                      {insertMenuItems.map(item => (
                        <Menu.Item
                          key={`${item.predicate.id}-${item.targetType}`}
                          onClick={() => handleInsertNode(item)}
                        >
                          <div className="flex flex-col items-start">
                            <span>{item.label}</span>
                            <span className="text-xs text-gray-500">{item.rangeLabel}</span>
                          </div>
                        </Menu.Item>
                      ))}
                    </Menu.Sub.Dropdown>
                  </Menu.Sub>
                )}
                {edge && <Menu.Item onClick={handleAddEvidence}>Add Evidence</Menu.Item>}
                {canDelete && (
                  <Menu.Item color="red" onClick={requestDeleteNode}>
                    Delete
                  </Menu.Item>
                )}
              </Menu.Dropdown>
            </Menu>
          )}
          {showAddButton && insertMenuItems.length > 0 && (
            <Menu shadow="md" position="bottom-start" withinPortal>
              <Menu.Target>
                <ActionIcon variant="light" color="primary" radius="xl" size="md">
                  <FaPlus size={12} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                {insertMenuItems.map(item => (
                  <Menu.Item
                    key={`${item.predicate.id}-${item.targetType}`}
                    onClick={() => handleInsertNode(item)}
                  >
                    <div className="flex flex-col items-start">
                      <span>{item.label}</span>
                      <span className="text-xs text-gray-500">{item.rangeLabel}</span>
                    </div>
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
          )}
        </div>
      </div>

      <EditorDropdown
        anchorEl={editor.anchor}
        category={editor.data?.category ?? EditorCategory.term}
        onClose={editor.close}
        onSave={handleEditorSave}
        termLabel={treeNode.floatingLabel}
        termRootTypes={node.rootTypes}
        initialTerm={node.id ? { id: node.id, label: node.label } : null}
      />

      {children.map(child => (
        <ActivityTableNode
          key={child.node.uid}
          treeNode={child}
          modelId={modelId}
          userContext={resolvedUserContext}
          gpNodeId={gpNodeId}
          activityType={activityType}
          allEdges={allEdges}
          onNodeDeleted={onNodeDeleted}
        />
      ))}

      <ConfirmDialog
        open={nodeDeleteConfirmOpen}
        onClose={() => setNodeDeleteConfirmOpen(false)}
        onConfirm={confirmDeleteNode}
        title="Delete Annotation"
        message={
          <>
            Are you sure you want to delete <strong>{node.label || node.id}</strong>? This cannot be undone.
          </>
        }
      />

      <ConfirmDialog
        open={evidencePendingDelete !== null}
        onClose={() => setEvidencePendingDelete(null)}
        onConfirm={confirmRemoveEvidence}
        title="Remove Evidence"
        message={
          <>
            Are you sure you want to remove this evidence
            {evidencePendingDelete?.evidenceCode?.label
              ? <> (<strong>{evidencePendingDelete.evidenceCode.label}</strong>)</>
              : null}
            ? This cannot be undone.
          </>
        }
        confirmLabel="Remove"
      />

      <ConfirmDialog
        open={fieldPendingClear !== null}
        onClose={() => setFieldPendingClear(null)}
        onConfirm={confirmClearField}
        title={fieldPendingClear?.key === AnnotationKey.WITH ? 'Clear With' : 'Clear Reference'}
        message={
          <>
            Clear the{' '}
            <strong>{fieldPendingClear?.key === AnnotationKey.WITH ? 'With' : 'Reference'}</strong>{' '}
            value
            {(() => {
              const current =
                fieldPendingClear?.key === AnnotationKey.WITH
                  ? fieldPendingClear?.ev.with
                  : fieldPendingClear?.ev.reference
              return current ? <> (<strong>{current}</strong>)</> : null
            })()}
            ? This cannot be undone.
          </>
        }
        confirmLabel="Clear"
      />
    </>
  )
}

export { getAspectFromRootTypes }
export default ActivityTableNode
