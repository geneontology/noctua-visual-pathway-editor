import { v4 as uuid } from 'uuid';
import { noctuaFormConfig } from './../../noctua-form-config';
import { SaeGraph } from './sae-graph';
import { Activity, ActivityType } from './activity';
import { ActivityNode } from './activity-node';
import { ConnectorRule } from './connector-rule';
import { Entity } from './entity';
import { Triple } from './triple';
import { Evidence } from './evidence';
import { Predicate } from './predicate';
import { cloneDeep, find } from 'lodash';

export enum ConnectorState {
  creation = 1,
  editing
}

export enum ConnectorType {
  ACTIVITY_ACTIVITY = 'activity',
  ACTIVITY_MOLECULE = 'activityMolecule',
  MOLECULE_ACTIVITY = 'moleculeActivity',
};

export class ConnectorActivity extends SaeGraph<ActivityNode> {
  id: string;
  subject: Activity;
  object: Activity;
  subjectNode: ActivityNode;
  objectNode: ActivityNode;
  predicate: Predicate;
  state: ConnectorState;
  rule: ConnectorRule;
  connectorType: ConnectorType
  reverseEdge = false;

  graphPreview = {
    nodes: [],
    edges: []
  };

  constructor(subject: Activity, object: Activity, predicate: Predicate) {
    super();
    this.id = uuid();

    this.subject = subject;
    this.object = object;
    this.predicate = predicate;
    this.setConnectorType()
    this.rule = new ConnectorRule(this.connectorType);
    this.subjectNode = cloneDeep(this.subject.rootNode);
    this.objectNode = this.object.rootNode;
    this.subjectNode.predicate.evidence = predicate.evidence

    this.setRule();
    this.setLinkDirection()
    this.createGraph();
  }

  setRule() {
    const question = this.edgeToConnectorQuestion(this.predicate.edge);

    if (question) {

      Object.entries(question).forEach((entry) => {
        const [key, value] = entry;
        const id = (value as string).split(':');
        this.rule[key] = noctuaFormConfig[id[0]][id[1]]
      });
    } else {
      this.rule.relationship = null;
      this.rule.directness = null;
      this.rule.effectDirection = null;
    }

  }

  addDefaultEvidence() {
    let activity: Activity;
    if (this.connectorType === ConnectorType.MOLECULE_ACTIVITY) {
      activity = this.object;
    } else {
      activity = this.subject
    }

    const mfNode = activity.getMFNode()
    const gpNode = activity.getGPNode()
    if (gpNode && mfNode) {
      const edge = activity.getEdge(mfNode.id, gpNode.id)
      this.predicate.evidence = cloneDeep(edge.predicate.evidence)
    }
  }

  checkConnection(value: any) {

    this.rule.displaySection.chemicalIntermediate = false;
    this.rule.displaySection.directness = false;

    if (value.relationship) {
      switch (value.relationship.id) {
        case noctuaFormConfig.activityRelationship.regulation.id:
          this.rule.displaySection.effectDirection = true;
          this.rule.displaySection.directness = true;
          break;
        case noctuaFormConfig.activityRelationship.providesInputFor.id:
          this.rule.displaySection.chemicalIntermediate = true;
          this.rule.displaySection.effectDirection = false;
          break;
        case noctuaFormConfig.activityRelationship.constitutivelyUpstream.id:
        case noctuaFormConfig.activityRelationship.removesInputFor.id:
          this.rule.displaySection.effectDirection = false;
          break;
        case noctuaFormConfig.activityRelationship.undetermined.id:
          this.rule.displaySection.effectDirection = true;
          break;
        case noctuaFormConfig.moleculeActivityRelationship.regulates.id:
          this.rule.displaySection.effectDirection = true;
          break;
        case noctuaFormConfig.moleculeActivityRelationship.substrate.id:
          this.rule.displaySection.effectDirection = false;
          break;
        case (noctuaFormConfig.activityMoleculeRelationship.product.id):
          this.rule.displaySection.effectDirection = false;
          break;
        default:
          this.rule.displaySection.effectDirection = true;
      }
    }

    /* 
        if (value.relationship && value.effectDirection) {
          switch (value.effectDirection.id) {
            case noctuaFormConfig.effectDirection.negative.id:
            case noctuaFormConfig.effectDirection.positive.id:
              this.rule.displaySection.directness = true;
              break;
          }
        } */

    this.predicate.edge = this.getCausalConnectorEdge(
      value.relationship?.id,
      this.rule.displaySection.effectDirection && value.effectDirection ? value.effectDirection.id : null,
      this.rule.displaySection.directness && value.directness ? value.directness.id : null);

    this.prepareSave(value);

    this.setLinkDirection();
  }

  getVPEEdge(relationship: string, effectDirection?: string, directness?: string): string | undefined {
    const tree = noctuaFormConfig.decisionTree;
    if (tree[relationship]) {
      if (tree[relationship].edge) {
        return tree[relationship].edge;
      } else if (effectDirection && tree[relationship][effectDirection]) {
        if (tree[relationship][effectDirection].edge) {
          return tree[relationship][effectDirection].edge;
        } else if (directness && tree[relationship][effectDirection][directness]) {
          return tree[relationship][effectDirection][directness].edge;
        }
      }
    }
    return undefined;
  }

  getCausalConnectorEdge(relationship, effectDirection, directness): Entity {
    const predicateId = this.getVPEEdge(relationship, effectDirection, directness)

    const entity = find(noctuaFormConfig.allEdges, {
      id: predicateId
    });
    const edge = entity ? Entity.createEntity(entity) : Entity.createEntity({ id: predicateId, label: predicateId });

    if (edge.id === noctuaFormConfig.edge.hasInput.id) {
      edge.label = 'input of'
    }

    return edge
  }

  getInputs(edge: string): any {
    const tree = noctuaFormConfig.decisionTree;
    for (const relationship in tree) {
      if (tree[relationship].edge === edge) {
        return { relationship };
      } else if (typeof tree[relationship] === 'object') {
        for (const effectDirection in tree[relationship]) {
          if (tree[relationship][effectDirection].edge === edge) {
            return { relationship, effectDirection };
          } else if (typeof tree[relationship][effectDirection] === 'object') {
            for (const directness in tree[relationship][effectDirection]) {
              if (tree[relationship][effectDirection][directness].edge === edge) {
                return { relationship, effectDirection, directness };
              }
            }
          }
        }
      }
    }
    return null;
  }

  edgeToConnectorQuestion(edge: Entity) {

    const question = this.getInputs(edge.id)
    return question
  }

  setConnectorType() {
    if (this.subject.activityType !== ActivityType.molecule && this.object.activityType !== ActivityType.molecule) {
      this.connectorType = ConnectorType.ACTIVITY_ACTIVITY
    } else if (this.subject.activityType !== ActivityType.molecule && this.object.activityType === ActivityType.molecule) {
      this.connectorType = ConnectorType.ACTIVITY_MOLECULE
    } else if (this.subject.activityType === ActivityType.molecule && this.object.activityType !== ActivityType.molecule) {
      this.connectorType = ConnectorType.MOLECULE_ACTIVITY
    }
  }


  setLinkDirection() {
    this.predicate.isReverseLink = (this.connectorType === ConnectorType.MOLECULE_ACTIVITY
      && this.predicate.edge.id === noctuaFormConfig.edge.hasInput.id);
  }


  createSave() {
    const saveData = {
      title: '',
      nodes: [],
      triples: [],
      graph: null
    };

    let triples: Triple<ActivityNode>[]

    if (this.predicate.isReverseLink) {
      triples = [new Triple<ActivityNode>(
        this.objectNode, this.subjectNode, this.predicate)
      ]
    } else {
      triples = [new Triple<ActivityNode>(
        this.subjectNode, this.objectNode, this.predicate)
      ]
    }

    saveData.triples = triples;

    return saveData;
  }

  createEdit(srcActivity: ConnectorActivity, predicate?: Predicate) {
    if (predicate) {
      this.predicate = predicate;
    }

    const srcSaveData = srcActivity.createSave();
    const destSaveData = this.createSave();
    const saveData = {
      removeTriples: srcSaveData.triples,
      addTriples: destSaveData.triples
    };

    return saveData;
  }

  createEditEvidence(srcActivity: ConnectorActivity, predicate: Predicate) {
    this.predicate.evidence = predicate.evidence;

    const removeTriples = new Triple(this.subjectNode, this.objectNode, srcActivity.predicate);
    const addTriples = new Triple(this.subjectNode, this.objectNode, this.predicate);

    const saveData = {
      addTriples: addTriples,
      removeTriples: removeTriples,
    };

    return saveData;
  }

  createDelete() {
    const deleteData = {
      triples: []
    };

    if (this.predicate.isReverseLink) {
      deleteData.triples.push(new Triple(this.objectNode, this.subjectNode, this.predicate));
    } else {
      deleteData.triples.push(new Triple(this.subjectNode, this.objectNode, this.predicate));
    }

    return deleteData;
  }

  createGraph(srcEvidence?: Evidence[]) {
    const evidence = srcEvidence ? srcEvidence : this.predicate.evidence;

    this.addNodes(this.subjectNode, this.objectNode);
    this.addEdge(this.subjectNode, this.objectNode, new Predicate(this.predicate.edge, evidence));
  }

  prepareSave(value) {
    const evidence: Evidence[] = value.evidenceFormArray.map((evidence: Evidence) => {
      const result = new Evidence();

      result.uuid = evidence.uuid;
      result.evidence = new Entity(evidence.evidence.id, evidence.evidence.label);
      result.reference = evidence.reference;
      result.with = evidence.with;

      return result;
    });

    this.predicate.evidence = evidence;

    // this.createGraph(evidence);
  }

}
