import type React from 'react'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { ActionIcon } from '@mantine/core'
import AnchoredPopover from '@/@noctua.core/components/popover/AnchoredPopover'
import { FaRegCircleXmark, FaRegCircleCheck } from 'react-icons/fa6'
import { useAppSelector } from '@/app/hooks'
import { EditorCategory } from '../../models/editorCategory'
import { RootTypes } from '../../models/cam'
import { makeSelectModelTerms, selectModelEvidence } from '../../slices/camSlice'
import TermAutocomplete from '@/features/search/components/Autocomplete'
import { AutocompleteType } from '@/features/search/models/search'
import type { GOlrResponse } from '@/features/search/models/search'
import DatabaseField from './DatabaseField'

// ── Types ────────────────────────────────────────────────────────────

/**
 * EditorDropdown is the inline single-field editor: one of term, evidence,
 * reference, or with at a time. Multi-section editing (add new child node,
 * add multiple evidences) lives in AnnotationForm.
 */
export interface EditorDropdownValues {
  term?: GOlrResponse | null
  evidence?: GOlrResponse | null
  reference?: string
  with?: string
}

interface EditorDropdownProps {
  anchorEl: HTMLElement | null
  category: EditorCategory
  onClose: () => void
  onSave: (values: EditorDropdownValues) => void

  termLabel?: string
  termRootTypes?: string[]

  initialTerm?: { id: string; label: string } | null
  initialEvidence?: { id: string; label: string } | null
  initialReference?: string
  initialWith?: string
}

function getDisplaySections(category: EditorCategory) {
  const sections = { term: false, evidence: false, reference: false, with: false }
  switch (category) {
    case EditorCategory.term:
      sections.term = true
      break
    case EditorCategory.evidence:
      sections.evidence = true
      break
    case EditorCategory.reference:
      sections.reference = true
      break
    case EditorCategory.with:
      sections.with = true
      break
  }
  return sections
}

// ── Component ────────────────────────────────────────────────────────

const EditorDropdown: React.FC<EditorDropdownProps> = ({
  anchorEl,
  category,
  onClose,
  onSave,
  termLabel = 'Term',
  termRootTypes,
  initialTerm = null,
  initialEvidence = null,
  initialReference = '',
  initialWith = '',
}) => {
  const open = Boolean(anchorEl)
  const sections = getDisplaySections(category)

  const selectTerms = useMemo(makeSelectModelTerms, [])
  const rootTypes = termRootTypes ?? []
  const termInitialOptions = useAppSelector(state => selectTerms(state, rootTypes))
  const evidenceInitialOptions = useAppSelector(selectModelEvidence)

  // Field state
  const [term, setTerm] = useState<GOlrResponse | null>(null)
  const [evidence, setEvidence] = useState<GOlrResponse | null>(null)
  const [reference, setReference] = useState('')
  const [withVal, setWithVal] = useState('')

  useEffect(() => {
    if (open) {
      setTerm(initialTerm ? ({ id: initialTerm.id, label: initialTerm.label } as GOlrResponse) : null)
      setEvidence(
        initialEvidence
          ? ({ id: initialEvidence.id, label: initialEvidence.label } as GOlrResponse)
          : null
      )
      setReference(initialReference)
      setWithVal(initialWith)
    }
  }, [open, initialTerm, initialEvidence, initialReference, initialWith]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = useCallback(() => {
    onSave({
      term: sections.term ? term : undefined,
      evidence: sections.evidence ? evidence : undefined,
      reference: sections.reference ? reference : undefined,
      with: sections.with ? withVal : undefined,
    })
  }, [term, evidence, reference, withVal, sections, onSave])

  return (
    <AnchoredPopover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      placement="bottom-end"
      className="!bg-accent-50 !shadow-lg !min-w-[400px]"
    >
      <div className="flex w-full flex-row items-center justify-start gap-1 pb-1 pt-2">
        {sections.term && (
          <div className="flex-1 p-1">
            <TermAutocomplete
              label={termLabel}
              name="editor-term"
              autocompleteType={AutocompleteType.TERM}
              rootTypeIds={termRootTypes ?? []}
              value={term}
              onChange={val => {
                if (val && typeof val === 'object') setTerm(val)
              }}
              variant="outlined"
              initialOptions={termInitialOptions}
            />
          </div>
        )}
        {sections.evidence && (
          <div className="flex-1 p-1">
            <TermAutocomplete
              label="Evidence"
              name="editor-evidence"
              autocompleteType={AutocompleteType.EVIDENCE_CODE}
              rootTypeIds={[RootTypes.EVIDENCE]}
              value={evidence}
              onChange={val => {
                if (val && typeof val === 'object') setEvidence(val)
              }}
              variant="outlined"
              initialOptions={evidenceInitialOptions}
            />
          </div>
        )}
        {sections.reference && (
          <div className="flex-1 p-1">
            <DatabaseField type="reference" value={reference} onChange={setReference} />
          </div>
        )}
        {sections.with && (
          <div className="flex-1 p-1">
            <DatabaseField type="with" value={withVal} onChange={setWithVal} />
          </div>
        )}

        <div className="flex shrink-0 items-center gap-1">
          <ActionIcon variant="subtle" color="gray" size="md" onClick={onClose} title="Cancel" className="!text-red-400">
            <FaRegCircleXmark size={18} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="gray" size="md" onClick={handleSave} title="Save" className="!text-green-600">
            <FaRegCircleCheck size={18} />
          </ActionIcon>
        </div>
      </div>
    </AnchoredPopover>
  )
}

export default EditorDropdown
