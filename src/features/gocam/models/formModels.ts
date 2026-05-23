import { v4 as uuidv4 } from 'uuid'
import type { Aspect, Entity } from './cam'
import type { DisplayGroup } from '../data/insertMenuConfig'
import { EVIDENCE_AUTO_POPULATE } from '../data/camConstants'

export type ActivityFormType = 'activity' | 'molecule' | 'proteinComplex'

export enum FormMode {
  CREATE = 'create',
  EDIT = 'edit',
}

// ── Template descriptors (used by activityTemplates.ts) ─────────────

export interface NodeCategory {
  id: string
  label: string
  aspect: Aspect | null
  searchClosureIds: string[]
  excludeClosureIds?: string[]
}

export interface TermDescriptor {
  category: NodeCategory
  label?: string
  required?: boolean
  canDelete?: boolean
  visible?: boolean
  skipEvidenceCheck?: boolean
  showEvidence?: boolean
  relations?: RelationDescriptor[]
}

export interface RelationDescriptor {
  predicateId: string
  target: TermDescriptor
}

// ── Recursive tree ──────────────────────────────────────────────────

export interface TermNode {
  uid: string
  category: string // RootTypes ID (e.g. 'GO:0003674')
  label: string
  term: Entity | null
  aspect: Aspect | null
  rootTypes: string[]
  excludeRootTypes?: string[]
  isComplement: boolean
  canDelete: boolean
  required: boolean
  visible?: boolean
  skipEvidenceCheck?: boolean
  showEvidence?: boolean
  relations: RelationNode[]
}

export interface RelationNode {
  uid: string
  predicate: Entity
  target: TermNode
  evidence: EvidenceForm[]
}

export interface EvidenceForm {
  uid: string
  evidenceCode: Entity
  reference: string
  withFrom: string
}

export interface ValidationError {
  uid: string
  field: string
  message: string
}

export interface ActivityFormState {
  activityType: ActivityFormType | null
  mode: FormMode
  existingActivityUid: string | null
  root: TermNode | null
  isDirty: boolean
  errors: ValidationError[]
}

// ── Flattened tree row (used by ActivityForm) ───────────────────────

export interface FlatRow {
  termNode: TermNode
  relation: RelationNode | null
  parentTermUid: string | null
  treeLevel: number
}

/** Row tagged with its displayGroup card + sort weight + tree depth */
export interface GroupedRow {
  termNode: TermNode
  relation: RelationNode | null
  parentTermUid: string | null
  treeLevel: number
  displayGroup: DisplayGroup
  weight: number
}

// ── With/From field types (used by WithDropdown) ────────────────────

export interface WithEntity {
  db: string
  accession: string
}

export interface WithGroup {
  entities: WithEntity[]
}

// ── Factory ─────────────────────────────────────────────────────────

export const createEvidenceForm = (): EvidenceForm => ({
  uid: uuidv4(),
  evidenceCode: { id: '', label: '' },
  reference: '',
  withFrom: '',
})

/** Build an evidence form pre-filled from EVIDENCE_AUTO_POPULATE (e.g. 'nd', 'iss'). */
export const createAutoPopulatedEvidence = (
  variant: keyof typeof EVIDENCE_AUTO_POPULATE
): EvidenceForm => {
  const { evidence, reference } = EVIDENCE_AUTO_POPULATE[variant]
  return {
    uid: uuidv4(),
    evidenceCode: { id: evidence.id, label: evidence.label },
    reference,
    withFrom: '',
  }
}
