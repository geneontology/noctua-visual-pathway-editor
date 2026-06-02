import { ActivityType } from '../models/cam'
import type { Aspect } from '../models/cam'

/** Add ISS evidence (and Fill-with-root term) shows on rows that carry a GO
 *  aspect (MF/BP/CC) and aren't part of a Chemical/Molecule activity. */
export function canAddISSEvidence(
  aspect: Aspect | null | undefined,
  activityType: string | null | undefined
): boolean {
  return !!aspect && activityType !== ActivityType.MOLECULE
}

/**
 * The Search Annotations row-menu entry is form-scoped per the review notes
 * (downloads/notes lines 30-46): protein-complex forms and chemical/molecule
 * forms suppress it, the regular Activity Unit form keeps it. Unknown /
 * uninitialized activity types default to enabled — the menu item still gates
 * on `node.aspect` further downstream in EntityRow.
 */
export function isSearchAnnotationsEnabledFor(
  activityType: string | null | undefined
): boolean {
  return (
    activityType !== ActivityType.MOLECULE &&
    activityType !== ActivityType.PROTEIN_COMPLEX
  )
}
