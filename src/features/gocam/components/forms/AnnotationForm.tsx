import type React from 'react'
import { useCallback, useMemo, useState } from 'react'
import { ActionIcon, Button } from '@mantine/core'
import { FaPlus, FaTrash } from 'react-icons/fa'
import { v4 as uuidv4 } from 'uuid'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { closeDialog } from '@/@noctua.core/components/dialog/dialogSlice'
import TermAutocomplete from '@/features/search/components/Autocomplete'
import { AutocompleteType } from '@/features/search/models/search'
import type { GOlrResponse } from '@/features/search/models/search'
import type { Aspect, Entity } from '../../models/cam'
import { RootTypes } from '../../models/cam'
import type { EvidenceForm } from '../../models/formModels'
import { createEvidenceForm } from '../../models/formModels'
import { ROOT_NODES, EVIDENCE_AUTO_POPULATE } from '../../data/camConstants'
import { makeSelectModelTerms, selectModelEvidence } from '../../slices/camSlice'
import DatabaseField from './DatabaseField'
import {
  consumeAnnotationFormOnSubmit,
  useOpenAnnotationForm,
} from '../../hooks/useOpenAnnotationForm'
import { useOpenSearchAnnotations } from '../../hooks/useOpenSearchAnnotations'

interface AnnotationFormProps {
  showTerm: boolean
  termLabel?: string
  termRootTypes?: string[]
  initialTerm?: Entity | null
  initialEvidences?: EvidenceForm[]
  gpId?: string
  aspect?: Aspect | null
}

const SectionHeader: React.FC<{ title: React.ReactNode; right?: React.ReactNode }> = ({
  title,
  right,
}) => (
  <div className="flex h-9 shrink-0 items-center justify-between border-b border-primary-500/30 bg-white px-3">
    <div className="text-xs font-semibold text-primary-700">{title}</div>
    {right}
  </div>
)

const AnnotationForm: React.FC<AnnotationFormProps> = ({
  showTerm,
  termLabel = 'Term',
  termRootTypes = [],
  initialTerm = null,
  initialEvidences = [],
  gpId,
  aspect,
}) => {
  const dispatch = useAppDispatch()

  const [term, setTerm] = useState<Entity | null>(initialTerm)
  const [evidences, setEvidences] = useState<EvidenceForm[]>(() =>
    initialEvidences.length > 0 ? initialEvidences : [createEvidenceForm()]
  )

  const selectTerms = useMemo(makeSelectModelTerms, [])
  const termInitialOptions = useAppSelector(state => selectTerms(state, termRootTypes))
  const evidenceInitialOptions = useAppSelector(selectModelEvidence)

  const openSearchAnnotations = useOpenSearchAnnotations()
  const openAnnotationForm = useOpenAnnotationForm()

  const addEvidence = useCallback(() => {
    setEvidences(prev => [...prev, createEvidenceForm()])
  }, [])

  const removeEvidenceAt = useCallback((index: number) => {
    setEvidences(prev => prev.filter((_, i) => i !== index))
  }, [])

  const patchEvidence = useCallback(
    (uid: string, patch: Partial<EvidenceForm>) => {
      setEvidences(prev => prev.map(ev => (ev.uid === uid ? { ...ev, ...patch } : ev)))
    },
    []
  )

  const handleTermChange = useCallback((value: GOlrResponse | null | string) => {
    if (typeof value === 'object' && value) {
      setTerm({ id: value.id, label: value.label })
    }
  }, [])

  const handleSearchAnnotations = useCallback(() => {
    if (!gpId || !aspect) return
    // The global dialog slot holds one component at a time, so opening the
    // picker unmounts this AnnotationForm instance. We consume the pending
    // onSubmit now (otherwise the re-opened instance would find an empty slot
    // and silently no-op on Save), and snapshot the props that defined this
    // dialog so the re-opened form is shaped identically.
    const capturedOnSubmit = consumeAnnotationFormOnSubmit()
    if (!capturedOnSubmit) return
    const snapshot = { showTerm, termLabel, termRootTypes, gpId, aspect }
    openSearchAnnotations({
      gpId,
      aspect,
      onApply: ({ term: pickedTerm, evidences: pickedEvidences }) => {
        const nextEvidences: EvidenceForm[] =
          pickedEvidences.length > 0
            ? pickedEvidences.map(ev => ({
              uid: uuidv4(),
              evidenceCode: { id: ev.evidenceCode.id, label: ev.evidenceCode.label },
              reference: ev.reference || '',
              withFrom: ev.with || '',
            }))
            : [createEvidenceForm()]
        openAnnotationForm({
          ...snapshot,
          initialTerm: { id: pickedTerm.id, label: pickedTerm.label },
          initialEvidences: nextEvidences,
          onSubmit: capturedOnSubmit,
        })
      },
    })
  }, [gpId, aspect, showTerm, termLabel, termRootTypes, openSearchAnnotations, openAnnotationForm])

  const handleFillRootTerm = useCallback(() => {
    const matchedRoot = termRootTypes.find(rt => ROOT_NODES[rt])
    if (!matchedRoot) return
    const { id, label } = ROOT_NODES[matchedRoot]
    const { evidence: ndEvidence, reference: ndReference } = EVIDENCE_AUTO_POPULATE.nd
    setTerm({ id, label })
    setEvidences([
      {
        uid: uuidv4(),
        evidenceCode: { id: ndEvidence.id, label: ndEvidence.label },
        reference: ndReference,
        withFrom: '',
      },
    ])
  }, [termRootTypes])

  const handleCancel = useCallback(() => {
    dispatch(closeDialog())
  }, [dispatch])

  const handleSave = useCallback(async () => {
    if (showTerm && !term) return
    const validEvidences = evidences.filter(ev => ev.evidenceCode?.id || ev.reference || ev.withFrom)
    const cb = consumeAnnotationFormOnSubmit()
    await cb?.({ term: showTerm ? term : null, evidences: validEvidences })
    dispatch(closeDialog())
  }, [showTerm, term, evidences, dispatch])

  const saveDisabled = showTerm && !term

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      {/* ── Body ── */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {showTerm && (
          <section className="flex shrink-0 flex-col bg-white">
            <SectionHeader
              title="Term"
              right={
                <div className="flex items-center gap-2">
                  {gpId && aspect && (
                    <Button size="compact-sm" variant="light" color="primary" onClick={handleSearchAnnotations}>
                      Search Annotations
                    </Button>
                  )}
                  {termRootTypes.length > 0 && (
                    <Button size="compact-sm" variant="light" color="primary" onClick={handleFillRootTerm}>
                      Fill with root term
                    </Button>
                  )}
                </div>
              }
            />
            <div className="px-3 py-2">
              <TermAutocomplete
                label={termLabel}
                name="annotation-term"
                autocompleteType={AutocompleteType.TERM}
                rootTypeIds={termRootTypes}
                value={term}
                onChange={handleTermChange}
                variant="outlined"
                initialOptions={termInitialOptions}
              />
            </div>
          </section>
        )}

        <section className="flex min-h-0 flex-1 flex-col bg-white">
          <SectionHeader
            title={`Evidence (${evidences.length})`}
            right={
              <Button size="compact-xs" variant="subtle" leftSection={<FaPlus size={10} />} onClick={addEvidence}>
                Add evidence
              </Button>
            }
          />
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
            {evidences.map((ev, i) => (
              <div
                key={ev.uid}
                className="mb-2 flex w-full flex-row items-start gap-2 rounded border border-gray-200 bg-gray-50 p-2"
              >
                <div className="w-1/2 min-w-0">
                  <TermAutocomplete
                    label="Evidence"
                    name={`annotation-evidence-${ev.uid}`}
                    autocompleteType={AutocompleteType.EVIDENCE_CODE}
                    rootTypeIds={[RootTypes.EVIDENCE]}
                    value={
                      ev.evidenceCode?.id
                        ? ({ id: ev.evidenceCode.id, label: ev.evidenceCode.label } as GOlrResponse)
                        : null
                    }
                    onChange={value => {
                      if (typeof value === 'object' && value) {
                        patchEvidence(ev.uid, {
                          evidenceCode: { id: value.id, label: value.label },
                        })
                      }
                    }}
                    variant="outlined"
                    initialOptions={evidenceInitialOptions}
                  />
                </div>
                <div className="w-1/4 min-w-0">
                  <DatabaseField
                    type="reference"
                    value={ev.reference}
                    onChange={value => patchEvidence(ev.uid, { reference: value })}
                  />
                </div>
                <div className="w-1/4 min-w-0">
                  <DatabaseField
                    type="with"
                    value={ev.withFrom}
                    onChange={value => patchEvidence(ev.uid, { withFrom: value })}
                  />
                </div>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="md"
                  onClick={() => removeEvidenceAt(i)}
                  disabled={evidences.length === 1}
                  title="Remove evidence"
                >
                  <FaTrash size={12} />
                </ActionIcon>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── Footer ── */}
      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3">
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saveDisabled} variant="filled">
          Save
        </Button>
      </div>
    </div>
  )
}

export default AnnotationForm
