import type {
  ActivityFormState,
  TermNode,
  ValidationError,
} from '../models/formModels'
import { referenceAllowedDBs, withFromAllowedDBs } from '../data/allowedDatabases'

/**
 * Validate reference format — must be in DB:accession format
 * where DB is one of the allowed reference databases (PMID, DOI, GO_REF).
 */
const isValidReference = (ref: string): boolean => {
  if (!ref?.trim()) return false
  const trimmed = ref.trim()
  const colonIdx = trimmed.indexOf(':')
  if (colonIdx === -1) return false
  const prefix = trimmed.slice(0, colonIdx)
  return referenceAllowedDBs.some(db => db === prefix)
}

const allowedWithFromLower = new Set(withFromAllowedDBs.map(db => db.toLowerCase()))

/**
 * Validate a with/from value. It may hold several identifiers separated by ','
 * or '|'; each must be DB:accession with DB in the allowed with/from namespaces
 * (matched case-insensitively). Returns an error message for the first offending
 * entry, or null when every entry is valid.
 */
export const validateWithFrom = (input: string): string | null => {
  for (const identifier of input.split(/[,|]/)) {
    const trimmed = identifier.trim()
    if (!trimmed) continue
    const colonIdx = trimmed.indexOf(':')
    if (colonIdx === -1) {
      return `Invalid format: "${trimmed}" - expected format is "DATABASE:accession"`
    }
    const dbPrefix = trimmed.slice(0, colonIdx)
    const accession = trimmed.slice(colonIdx + 1).trim()
    if (!accession) {
      return `Invalid format: "${trimmed}" - accession cannot be empty`
    }
    if (!allowedWithFromLower.has(dbPrefix.toLowerCase())) {
      return `Invalid database prefix: "${dbPrefix}" is not part of allowed entities`
    }
  }
  return null
}

/**
 * Validate the activity form by walking the tree.
 *   1. Required nodes must have a term
 *   2. If a node has a term, evidence is checked:
 *      - Evidence code provided → reference is required
 *      - Reference must be in DB:accession format (contain colon)
 *   3. With/from field must be in DB:accession format
 */
export const validateActivityForm = (
  state: ActivityFormState
): ValidationError[] => {
  const { root } = state
  if (!root) {
    return [{ uid: '', field: 'root', message: 'No activity form loaded' }]
  }

  const errors: ValidationError[] = []

  function walkTerm(node: TermNode) {

    // Required node must have a term
    if (node.required && !node.term) {
      errors.push({
        uid: node.uid,
        field: 'term',
        message: `"${node.label}" is required`,
      })
    }

    for (const rel of node.relations) {
      if (rel.target.term) {
        // skipEvidenceCheck only relaxes the "evidence is required" rule (e.g. the
        // enabled_by gene product). The fields of any evidence that IS present —
        // such as the molecular function's enabled_by evidence — must still be
        // validated, so the with/from / reference checks below run regardless.
        if (!rel.target.skipEvidenceCheck && rel.evidence.length === 0) {
          errors.push({
            uid: rel.uid,
            field: 'evidence',
            message: `${rel.target.label} requires at least one evidence`,
          })
        }

        for (let i = 0; i < rel.evidence.length; i++) {
          const ev = rel.evidence[i]
          const evPosition = i + 1

          // Evidence code provided but no reference
          if (ev.evidenceCode?.id && !ev.reference) {
            errors.push({
              uid: ev.uid,
              field: 'reference',
              message: `You provided an evidence for "${rel.target.label}" but no reference: on evidence(${evPosition})`,
            })
          }

          // Reference provided but not in DB:accession format
          if (ev.reference && !isValidReference(ev.reference)) {
            errors.push({
              uid: ev.uid,
              field: 'reference',
              message: `Use DB:accession format for reference "${rel.target.label}" on evidence(${evPosition})`,
            })
          }

          // With/from provided — every identifier must use an allowed namespace
          if (ev.withFrom) {
            const withFromError = validateWithFrom(ev.withFrom)
            if (withFromError) {
              errors.push({
                uid: ev.uid,
                field: 'withFrom',
                message: `With/from for "${rel.target.label}" on evidence(${evPosition}): ${withFromError}`,
              })
            }
          }
        }
      }

      walkTerm(rel.target)
    }
  }

  walkTerm(root)

  return errors
}
