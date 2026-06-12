import { v4 as uuidv4 } from 'uuid'
import type { Activity, Edge, GraphNode, UserContext } from '@/features/gocam/models/cam'
import { ActivityType } from '@/features/gocam/models/cam'
import { Relations } from '@/@noctua.core/models/relations'
import type { EvidenceForm } from '@/features/gocam/models/formModels'
import { evidenceToForm } from '@/features/gocam/models/formModels'
import {
  OperationEntity,
  OperationType,
  AnnotationKey,
  ExpressionType,
} from '@/features/gocam/models/operations'
import type { Operation } from '@/features/gocam/models/operations'

/**
 * `has_input` is rendered as a reverse arrow (molecule → activity, labeled "input of"),
 * but the persisted triple is always `activity has_input molecule`.
 * This predicate identifies that case from the form's source/relation perspective.
 */
export const isReverseLinkConnector = (
  relationId: string | null | undefined,
  sourceActivity: Activity
): boolean =>
  relationId === Relations.HAS_INPUT && sourceActivity.type === ActivityType.MOLECULE

/**
 * Default connector evidence: the evidence on the upstream activity's
 * enabled_by edge (molecular function → gene product). When the source side is
 * a molecule (which has no enabled_by edge), the evidence is taken from the
 * target activity instead. Returns [] when there is no such evidence, so the
 * caller can fall back to a single empty evidence row.
 */
export const getDefaultConnectorEvidence = (
  sourceActivity: Activity,
  targetActivity: Activity,
  edges: Edge[]
): EvidenceForm[] => {
  const evidenceActivity =
    sourceActivity.type === ActivityType.MOLECULE ? targetActivity : sourceActivity

  const mfUid = evidenceActivity.molecularFunction?.uid
  if (!mfUid) return []

  const enabledByEdge = edges.find(
    edge => edge.id === Relations.ENABLED_BY && edge.sourceId === mfUid
  )

  return (enabledByEdge?.evidence ?? []).map(evidenceToForm)
}

/**
 * Build Barista API operations to create a causal relation between two activities.
 * Uses the rootNode UIDs (server-assigned MF node IDs) as subject/object.
 */
export const buildConnectorOperations = (
  sourceActivity: Activity,
  targetActivity: Activity,
  relationId: string,
  evidences: EvidenceForm[],
  modelId: string,
  userContext?: UserContext
): Operation[] => {
  const operations: Operation[] = []

  // When the form's source is the molecule and relation is has_input, swap
  // subject/object back so the persisted triple is `activity has_input molecule`.
  const reverseLink = isReverseLinkConnector(relationId, sourceActivity)
  const subjectId = reverseLink ? targetActivity.rootNode.uid : sourceActivity.rootNode.uid
  const objectId = reverseLink ? sourceActivity.rootNode.uid : targetActivity.rootNode.uid

  operations.push({
    entity: OperationEntity.EDGE,
    operation: OperationType.ADD,
    arguments: {
      subject: subjectId,
      object: objectId,
      predicate: relationId,
      'model-id': modelId,
    },
  })

  const validEvidences = evidences.filter(ev => ev.evidenceCode?.id)
  for (const evidence of validEvidences) {
    const evidenceVarId = uuidv4()

    operations.push({
      entity: OperationEntity.INDIVIDUAL,
      operation: OperationType.ADD,
      arguments: {
        expressions: [{ type: ExpressionType.CLASS, id: evidence.evidenceCode.id }],
        'model-id': modelId,
        'assign-to-variable': evidenceVarId,
      },
    })

    const annotationValues: { key: AnnotationKey; value: string }[] = []
    if (evidence.reference) {
      annotationValues.push({ key: AnnotationKey.SOURCE, value: evidence.reference })
    }
    if (evidence.withFrom) {
      annotationValues.push({ key: AnnotationKey.WITH, value: evidence.withFrom })
    }
    if (userContext?.orcid) {
      annotationValues.push({ key: AnnotationKey.CONTRIBUTOR, value: userContext.orcid })
    }
    if (userContext?.groupUrl) {
      annotationValues.push({ key: AnnotationKey.PROVIDED_BY, value: userContext.groupUrl })
    }

    if (annotationValues.length > 0) {
      operations.push({
        entity: OperationEntity.INDIVIDUAL,
        operation: OperationType.ADD_ANNOTATION,
        arguments: {
          individual: evidenceVarId,
          values: annotationValues,
          'model-id': modelId,
        },
      })
    }

    operations.push({
      entity: OperationEntity.EDGE,
      operation: OperationType.ADD_ANNOTATION,
      arguments: {
        subject: subjectId,
        object: objectId,
        predicate: relationId,
        values: [{ key: AnnotationKey.EVIDENCE, value: evidenceVarId }],
        'model-id': modelId,
      },
    })
  }

  operations.push({
    entity: OperationEntity.MODEL,
    operation: OperationType.STORE,
    arguments: { 'model-id': modelId },
  })

  return operations
}

/**
 * Build operations to remove an existing causal relation edge.
 */
/**
 * Build Barista operations to create chemical intermediate connections.
 * For each selected chemical, creates:
 *   subjectMfNode --[has_output]--> chemicalNode
 *   objectMfNode  --[has_input]-->  chemicalNode
 *
 */
export const buildChemicalParticipantOperations = (
  subjectMfNode: GraphNode,
  objectMfNode: GraphNode,
  chemicals: Array<{ id: string; label: string }>,
  modelId: string,
  _userContext?: UserContext
): Operation[] => {
  const operations: Operation[] = []

  for (const chemical of chemicals) {
    const chemVarId = uuidv4()

    operations.push({
      entity: OperationEntity.INDIVIDUAL,
      operation: OperationType.ADD,
      arguments: {
        expressions: [{ type: ExpressionType.CLASS, id: chemical.id }],
        'model-id': modelId,
        'assign-to-variable': chemVarId,
      },
    })

    operations.push({
      entity: OperationEntity.EDGE,
      operation: OperationType.ADD,
      arguments: {
        subject: subjectMfNode.uid,
        object: chemVarId,
        predicate: Relations.HAS_OUTPUT,
        'model-id': modelId,
      },
    })

    operations.push({
      entity: OperationEntity.EDGE,
      operation: OperationType.ADD,
      arguments: {
        subject: objectMfNode.uid,
        object: chemVarId,
        predicate: Relations.HAS_INPUT,
        'model-id': modelId,
      },
    })
  }

  if (chemicals.length > 0) {
    operations.push({
      entity: OperationEntity.MODEL,
      operation: OperationType.STORE,
      arguments: { 'model-id': modelId },
    })
  }

  return operations
}

/**
 * Build operations to remove an existing causal relation edge.
 */
export const buildConnectorDeleteOperations = (
  sourceNodeUid: string,
  targetNodeUid: string,
  predicateId: string,
  modelId: string
): Operation[] => {
  return [
    {
      entity: OperationEntity.EDGE,
      operation: OperationType.REMOVE,
      arguments: {
        subject: sourceNodeUid,
        object: targetNodeUid,
        predicate: predicateId,
        'model-id': modelId,
      },
    },
    {
      entity: OperationEntity.MODEL,
      operation: OperationType.STORE,
      arguments: { 'model-id': modelId },
    },
  ]
}
