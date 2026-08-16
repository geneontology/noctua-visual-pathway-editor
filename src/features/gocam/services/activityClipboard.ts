import type { Activity } from '../models/cam'
import { ActivityType } from '../models/cam'
import type { ActivityFormType, TermNode } from '../models/formModels'
import { activityToFormTree } from '../data/activityTemplates'

/**
 * Copy/paste of an activity between models goes through the system clipboard as
 * plain text, so the pasting tab never needs access to the source model. The
 * payload carries the *form tree* (what `initPasteForm` consumes) rather than the
 * `Activity`, since individual uids are model-scoped and get regenerated on paste
 * anyway.
 */
export const ACTIVITY_CLIPBOARD_KIND = 'noctua-activity/v1'

export interface ActivityClipboardPayload {
  kind: typeof ACTIVITY_CLIPBOARD_KIND
  activityType: ActivityFormType
  /** Source activity label — used for user-facing messaging only. */
  label: string
  sourceModelId: string | null
  root: TermNode
}

export function activityFormTypeOf(type: ActivityType): ActivityFormType {
  switch (type) {
    case ActivityType.MOLECULE:
      return 'molecule'
    case ActivityType.PROTEIN_COMPLEX:
      return 'proteinComplex'
    default:
      return 'activity'
  }
}

export function activityClipboardLabel(activity: Activity): string {
  return activity.enabledBy?.label || activity.rootNode?.label || 'Activity'
}

export function serializeActivity(activity: Activity, sourceModelId: string | null): string {
  const payload: ActivityClipboardPayload = {
    kind: ACTIVITY_CLIPBOARD_KIND,
    activityType: activityFormTypeOf(activity.type),
    label: activityClipboardLabel(activity),
    sourceModelId,
    root: activityToFormTree(activity),
  }
  return JSON.stringify(payload)
}

/** Returns null for any clipboard text that isn't one of our activity payloads. */
export function parseActivityClipboard(text: string): ActivityClipboardPayload | null {
  const trimmed = text?.trim()
  if (!trimmed || !trimmed.startsWith('{')) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    return null
  }

  const payload = parsed as Partial<ActivityClipboardPayload> | null
  if (!payload || payload.kind !== ACTIVITY_CLIPBOARD_KIND) return null
  if (!payload.root || typeof payload.root !== 'object') return null
  if (!Array.isArray(payload.root.relations)) return null
  if (!payload.activityType) return null

  return payload as ActivityClipboardPayload
}

/**
 * Async Clipboard API where available, falling back to the legacy textarea +
 * execCommand path for non-secure contexts (the workbench can be served over
 * plain http).
 */
export async function writeClipboardText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Permission denied or non-secure context — try the legacy path.
  }

  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}
