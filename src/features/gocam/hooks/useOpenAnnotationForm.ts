import { useCallback } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { openDialog, DialogComponent } from '@/@noctua.core/components/dialog/dialogSlice'
import type { Aspect, Entity } from '../models/cam'
import type { EvidenceForm } from '../models/formModels'

export interface AnnotationFormResult {
  term: Entity | null
  evidences: EvidenceForm[]
}

export type AnnotationFormOnSubmit = (result: AnnotationFormResult) => void | Promise<void>

interface OpenAnnotationFormParams {
  /** When true, the dialog shows a term section above the evidence list. */
  showTerm: boolean
  title?: string
  termLabel?: string
  termRootTypes?: string[]
  initialTerm?: Entity | null
  initialEvidences?: EvidenceForm[]
  /** Needed for the in-dialog "Search Annotations" trigger. Omit to hide it. */
  gpId?: string
  aspect?: Aspect | null
  onSubmit: AnnotationFormOnSubmit
}

export function useOpenAnnotationForm() {
  const dispatch = useAppDispatch()
  return useCallback(
    (params: OpenAnnotationFormParams) => {
      dispatch(
        openDialog({
          component: DialogComponent.ANNOTATION_FORM,
          title: params.title ?? (params.showTerm ? 'Add Annotation' : 'Add Evidence'),
          size: 'md',
          bodyScroll: 'none',
          customProps: {
            showTerm: params.showTerm,
            termLabel: params.termLabel,
            termRootTypes: params.termRootTypes ?? [],
            initialTerm: params.initialTerm ?? null,
            initialEvidences: params.initialEvidences ?? [],
            gpId: params.gpId,
            aspect: params.aspect ?? null,
            onSubmit: params.onSubmit,
          },
        })
      )
    },
    [dispatch]
  )
}
