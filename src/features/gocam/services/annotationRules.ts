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
