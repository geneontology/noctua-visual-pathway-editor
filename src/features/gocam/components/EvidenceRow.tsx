import type React from 'react'
import { useState, useCallback, useRef } from 'react'
import type { Evidence, UserContext } from '../models/cam'
import { EditorCategory } from '../models/editorCategory'
import { AnnotationKey } from '../models/operations'
import { useUpdateGraphModelMutation } from '../slices/camApiSlice'
import {
  buildEditIndividualTypeOperations,
  buildEditEvidenceAnnotationOperations,
} from '../services/activityOperations'
import { getEntityUrl } from '@/@noctua.core/services/goLinker/goLinker'
import { validateWithFrom } from '../services/formValidation'
import { showToast } from '@/@noctua.core/components/toast/toastSlice'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { selectAuthUser } from '@/features/auth/slices/authSlice'
import { openDialog, DialogComponent } from '@/@noctua.core/components/dialog/dialogSlice'
import { REFERENCE_COMMENT_CATEGORIES } from '../data/commentCategories'
import EditableCell from '@/@noctua.core/components/cell/EditableCell'
import EditorDropdown from './forms/EditorDropdown'
import type { EditorDropdownValues } from './forms/EditorDropdown'
import { useGroupGuard } from './GroupGuardProvider'

interface EvidenceRowProps {
  ev: Evidence
  modelId: string
  userContext?: UserContext
  onRemoveEvidence: (ev: Evidence) => void
  onClearField: (ev: Evidence, key: AnnotationKey.SOURCE | AnnotationKey.WITH) => void
}

const EvidenceRow: React.FC<EvidenceRowProps> = ({
  ev,
  modelId,
  userContext,
  onRemoveEvidence,
  onClearField,
}) => {
  const [updateGraphModel] = useUpdateGraphModelMutation()
  const dispatch = useAppDispatch()
  const isLoggedIn = !!useAppSelector(selectAuthUser)
  const checkGroup = useGroupGuard()
  const evCellRef = useRef<HTMLDivElement>(null)
  const refCellRef = useRef<HTMLDivElement>(null)
  const withCellRef = useRef<HTMLDivElement>(null)

  const [editorAnchor, setEditorAnchor] = useState<HTMLElement | null>(null)
  const [editorCategory, setEditorCategory] = useState<EditorCategory>(EditorCategory.evidence)

  const openEditor = (ref: React.RefObject<HTMLDivElement | null>, cat: EditorCategory) => {
    checkGroup(() => {
      setEditorCategory(cat)
      setEditorAnchor(ref.current)
    })
  }

  // Comment on the reference — stored on the evidence individual (#231).
  const handleReferenceComment = useCallback(() => {
    checkGroup(() =>
      dispatch(
        openDialog({
          component: DialogComponent.INDIVIDUAL_COMMENTS_FORM,
          title: 'Reference Comments',
          size: 'sm',
          customProps: {
            individualUid: ev.uid,
            categories: REFERENCE_COMMENT_CATEGORIES,
            subjectLabel: ev.reference || ev.evidenceCode?.label || 'Reference',
          },
        })
      )
    )
  }, [ev.uid, ev.reference, ev.evidenceCode, checkGroup, dispatch])

  const commentCount = ev.comments?.length ?? 0

  const handleEditorSave = useCallback(
    async (values: EditorDropdownValues) => {
      switch (editorCategory) {
        case EditorCategory.evidence: {
          if (!values.evidence || !ev.evidenceCode?.id) break
          await updateGraphModel(
            buildEditIndividualTypeOperations(ev.uid, ev.evidenceCode.id, values.evidence.id, modelId)
          )
          break
        }
        case EditorCategory.reference: {
          if (values.reference === undefined) break
          await updateGraphModel(
            buildEditEvidenceAnnotationOperations(
              ev.uid, AnnotationKey.SOURCE, ev.reference || '', values.reference, modelId, userContext
            )
          )
          break
        }
        case EditorCategory.with: {
          if (values.with === undefined) break
          const withError = validateWithFrom(values.with)
          if (withError) {
            dispatch(showToast({ message: withError, severity: 'error' }))
            break
          }
          await updateGraphModel(
            buildEditEvidenceAnnotationOperations(
              ev.uid, AnnotationKey.WITH, ev.with || '', values.with, modelId, userContext
            )
          )
          break
        }
      }
      setEditorAnchor(null)
    },
    [editorCategory, ev, modelId, userContext, updateGraphModel, dispatch]
  )

  return (
    <div className="mb-2 flex h-full flex-row items-stretch last:mb-0">
      <EditableCell
        ref={evCellRef}
        label="Evidence"
        className="ml-1 grow"
        onEdit={isLoggedIn ? () => openEditor(evCellRef, EditorCategory.evidence) : undefined}
        onDelete={isLoggedIn ? () => onRemoveEvidence(ev) : undefined}
      >
        <span>
          {ev.evidenceCode?.label || '—'}
          {ev.evidenceCode?.id && (
            <>
              {' ('}
              {(() => {
                const url = getEntityUrl(ev.evidenceCode.id)
                return url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {ev.evidenceCode.id}
                  </a>
                ) : (
                  <span>{ev.evidenceCode.id}</span>
                )
              })()}
              {')'}
            </>
          )}
        </span>
      </EditableCell>

      <EditableCell
        ref={refCellRef}
        label="Reference"
        className="ml-1 w-[130px] shrink-0"
        onEdit={isLoggedIn ? () => openEditor(refCellRef, EditorCategory.reference) : undefined}
        onDelete={
          isLoggedIn && ev.reference ? () => onClearField(ev, AnnotationKey.SOURCE) : undefined
        }
        onComment={isLoggedIn || commentCount > 0 ? handleReferenceComment : undefined}
        commentCount={commentCount}
      >
        {ev.reference ? (
          <span>
            {ev.reference.split('|').map((part, i) => {
              const src = part.trim()
              const url = getEntityUrl(src)
              return (
                <span key={`${src}-${i}`}>
                  {i > 0 && ', '}
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {src}
                    </a>
                  ) : (
                    src
                  )}
                </span>
              )
            })}
          </span>
        ) : (
          <span>—</span>
        )}
      </EditableCell>

      <EditableCell
        ref={withCellRef}
        label="With"
        className="ml-1 w-[120px] shrink-0"
        onEdit={isLoggedIn ? () => openEditor(withCellRef, EditorCategory.with) : undefined}
        onDelete={isLoggedIn && ev.with ? () => onClearField(ev, AnnotationKey.WITH) : undefined}
      >
        <span>{ev.with || '—'}</span>
      </EditableCell>

      <EditorDropdown
        anchorEl={editorAnchor}
        category={editorCategory}
        onClose={() => setEditorAnchor(null)}
        onSave={handleEditorSave}
        initialEvidence={ev.evidenceCode?.id ? ev.evidenceCode : null}
        initialReference={ev.reference || ''}
        initialWith={ev.with || ''}
      />
    </div>
  )
}

export default EvidenceRow
