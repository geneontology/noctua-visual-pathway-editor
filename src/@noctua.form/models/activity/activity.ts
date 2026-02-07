import { v4 as uuid } from 'uuid';
import { noctuaFormConfig } from './../../noctua-form-config';
import { SaeGraph } from './sae-graph';
import { ActivityError, ErrorLevel, ErrorType } from './parser/activity-error';
import { ActivityNode, ActivityNodeType, compareNodeWeight } from './activity-node';
import { Evidence } from './evidence';
import { compareTripleWeight, Triple } from './triple';
import { Entity } from './entity';
import { Predicate } from './predicate';
import { getEdges, Edge, getNodes, subtractNodes } from './noctua-form-graph';
import * as ShapeDescription from './../../data/config/shape-definition';
import { each, filter, find } from 'lodash';
import { NoctuaFormUtils } from './../../utils/noctua-form-utils';
import { Violation } from './error/violation-error';
import { TermsSummary } from './summary';


import moment from 'moment';

export enum ActivityState {
  creation = 1,
  editing
}

export enum ActivitySortField {
  GP = 'gp',
  MF = 'mf',
  BP = 'bp',
  CC = 'cc',
  DATE = 'date'
}

export enum ActivityDisplayType {
  TABLE = 'table',
  TREE = 'tree',
  TREE_TABLE = 'tree_table', //for ART
  SLIM_TREE = 'slim_tree',
  GRAPH = 'graph'
}

export enum ActivityType {
  default = 'default',
  bpOnly = 'bpOnly',
  ccOnly = 'ccOnly',
  molecule = 'molecule',
  proteinComplex = 'proteinComplex'
}

export class ActivitySize {
  width = 150;
  height = 150;
}

export class ActivityPosition {
  x = 0;
  y = 0;
}

export class Activity extends SaeGraph<ActivityNode> {
  uuid: string;
  gp;
  label: string;
  date: moment.Moment;

  validateEvidence = true;

  activityRows;
  activityType;
  errors;
  submitErrors;
  modified = false;
  expanded = false;
  visible = true;
  graphPreview = {
    nodes: [],
    edges: []
  };

  molecularEntityNode: ActivityNode;
  molecularFunctionNode: ActivityNode;
  summary: TermsSummary = new TermsSummary()

  //For Display Only
  gpNode: ActivityNode;
  mfNode: ActivityNode;
  bpNode: ActivityNode;
  ccNode: ActivityNode;

  /**
   * Used for HTML id attribute
   */
  activityDisplayType: ActivityDisplayType = ActivityDisplayType.TREE;
  displayId: string;
  displayNumber = '1';

  hasViolations = false;
  violations: Violation[] = [];

  bpOnlyEdge: Entity;
  ccOnlyEdge: Entity;

  //Graph
  position: ActivityPosition = new ActivityPosition();
  size: ActivitySize = new ActivitySize();

  formattedDate: string

  private _backgroundColor = 'green'
  private _presentation: any;
  private _id: string;

  constructor() {
    super();
    this.activityType = 'default';
    this.id = uuid();
    this.errors = [];
    this.submitErrors = [];
  }

  updateProperties() {
    this.updateSummary()
    this.updateDate()

    this.gpNode = this.getGPNode()
    this.mfNode = this.getMFNode()
    this.bpNode = this.getRootNodeByType(ActivityNodeType.GoBiologicalProcess)
    this.ccNode = this.getRootNodeByType(ActivityNodeType.GoCellularComponent)
  }

  get id() {
    return this._id;
  }

  set id(id: string) {
    this._id = id;
    this.displayId = NoctuaFormUtils.cleanID(id) + 'activity';
  }

  get backgroundColor() {
    switch (this.activityType) {
      case ActivityType.ccOnly:
        return 'purple'
      case ActivityType.bpOnly:
        return 'brown'
      case ActivityType.molecule:
        return 'teal'
      default:
        return this._backgroundColor;
    }
  }

  get activityConnections() {
    throw new Error('Method not implemented');
  }

  get rootNodeType(): ActivityNodeType {
    if (this.activityType === ActivityType.ccOnly) {
      return ActivityNodeType.GoMolecularEntity
    } else if (this.activityType === ActivityType.molecule) {
      return ActivityNodeType.GoChemicalEntity;
    } else {
      return ActivityNodeType.GoMolecularFunction
    }
  }

  get rootNode(): ActivityNode {
    return this.getNode(this.rootNodeType);
  }

  get rootEdge(): Triple<ActivityNode> {
    let edge;

    if (this.activityType === ActivityType.proteinComplex) {
      edge = this.getEdge(ActivityNodeType.GoMolecularFunction, ActivityNodeType.GoProteinContainingComplex);
    } else {
      edge = this.getEdge(ActivityNodeType.GoMolecularFunction, ActivityNodeType.GoMolecularEntity);
    }

    return edge
  }

  postRunUpdateCompliment() {
    if (this.activityType === ActivityType.default || this.activityType === ActivityType.bpOnly) {
      const mfNode = this.getMFNode();
      const edge = this.getEdge(ActivityNodeType.GoMolecularFunction, ActivityNodeType.GoMolecularEntity);

      if (mfNode && edge && mfNode.isComplement) {
        edge.predicate.isComplement = true;
      }
    }
  }


  postRunUpdate() {
    if (this.activityType !== ActivityType.ccOnly) {
      const mfNode = this.getMFNode();
      const edge = this.rootEdge;

      if (mfNode && edge) {
        mfNode.predicate = edge.predicate;
        if (edge.predicate.edge) {
          edge.predicate.edge.label = ''
        }
      }
    }
  }

  getActivityTypeDetail() {
    return noctuaFormConfig.activityType.options[this.activityType];
  }

  updateDate() {
    const rootNode = this.rootNode;

    if (!rootNode) return;

    this.date = (moment as any)(rootNode.date, 'YYYY-MM-DD')

    each(this.nodes, (node: ActivityNode) => {
      const nodeDate = (moment as any)(node.date, 'YYYY-MM-DD')

      if (nodeDate > this.date) {
        this.date = nodeDate
      }
    });

    // remove the subject menu
    each(this.edges, (triple: Triple<ActivityNode>) => {
      each(triple.predicate.evidence, (evidence: Evidence) => {

        const evidenceDate = (moment as any)(evidence.date, 'YYYY-MM-DD')

        if (evidenceDate > this.date) {
          this.date = evidenceDate
        }
      })
    });

    this.formattedDate = this.date.format('ll');
  }

  updateSummary() {
    const summary = new TermsSummary()
    let coverage = 0;
    const filteredNodes = this.nodes.filter(node => node.term.hasValue())

    each(filteredNodes, (node: ActivityNode) => {
      if (node.type === ActivityNodeType.GoMolecularFunction) {
        summary.mf.append(node)
      } else if (node.type === ActivityNodeType.GoBiologicalProcess) {
        summary.bp.append(node)
      } else if (node.type === ActivityNodeType.GoCellularComponent) {
        summary.cc.append(node)
      } else {
        summary.other.append(node)
      }
    })

    if (summary.mf.nodes.length > 0) {
      coverage = coverage | 4
    }
    if (summary.bp.nodes.length > 0) {
      coverage = coverage | 2
    }
    if (summary.cc.nodes.length > 0) {
      coverage = coverage | 1
    }

    summary.coverage = coverage;

    this.summary = summary
  }

  updateEntityInsertMenu() {
    each(this.nodes, (node: ActivityNode) => {
      const canInsertNodes = ShapeDescription.canInsertEntity[node.type] || [];
      const insertNodes: ShapeDescription.ShapeDescription[] = [];

      each(canInsertNodes, (nodeDescription: ShapeDescription.ShapeDescription) => {
        if (nodeDescription.cardinality === ShapeDescription.CardinalityType.oneToOne) {
          const edgeTypeExist = this.edgeTypeExist(node.id, nodeDescription.predicate.id, node.type, nodeDescription.node.type);

          if (!edgeTypeExist) {
            insertNodes.push(nodeDescription);
          }
        } else {
          insertNodes.push(nodeDescription);
        }
      });

      node.canInsertNodes = insertNodes;
      node.insertMenuNodes = filter(insertNodes, (insertNode: ShapeDescription.ShapeDescription) => {
        return insertNode.node.showInMenu;
      });
    });

  }

  updateShapeMenuShex(rootTypes?) {
    each(this.nodes, (node: ActivityNode) => {
      const subjectIds = node.category.map((category) => {
        return category.category
      });

      if (rootTypes) {
        subjectIds.push(...rootTypes.map(rootType => rootType.id))
      }

      const canInsertNodes = ShapeDescription.getShexJson(subjectIds);
      const insertNodes: ShapeDescription.ShapeDescription[] = [];

      each(canInsertNodes, (nodeDescription: ShapeDescription.ShapeDescription) => {
        /*  if (nodeDescription.cardinality === ShapeDescription.CardinalityType.oneToOne) {
           const edgeTypeExist = this.edgeTypeExist(node.id, nodeDescription.predicate.id, node.type, nodeDescription.node.type);

           if (!edgeTypeExist) {
             insertNodes.push(nodeDescription);
           }
         } else { */
        insertNodes.push(nodeDescription);
        // }
      });


      node.canInsertNodes = insertNodes;
      node.insertMenuNodes = filter(insertNodes, (_insertNode: ShapeDescription.ShapeDescription) => {
        return true;
      });

      /* node.insertMenuNodes = filter(insertNodes, (insertNode: ShapeDescription.ShapeDescription) => {
       return insertNode.node.showInMenu;
     }); */
    });

  }

  updateEdges(subjectNode: ActivityNode, insertNode: ActivityNode, predicate: Predicate) {
    const canInsertSubjectNodes = ShapeDescription.canInsertEntity[subjectNode.type] || [];
    let updated = false;

    each(canInsertSubjectNodes, (nodeDescription: ShapeDescription.ShapeDescription) => {

      if (predicate.edge.id === nodeDescription.predicate.id) {
        if (nodeDescription.cardinality === ShapeDescription.CardinalityType.oneToOne) {
          const edgeTypeExist = this.edgeTypeExist(subjectNode.id, nodeDescription.predicate.id, subjectNode.type, nodeDescription.node.type);

          if (edgeTypeExist) {
            edgeTypeExist.object.treeLevel++;
            this.removeEdge(edgeTypeExist.subject, edgeTypeExist.object, edgeTypeExist.predicate);
            this.addEdge(edgeTypeExist.subject, insertNode, edgeTypeExist.predicate);
            this.addEdge(insertNode, edgeTypeExist.object, predicate);
            updated = true;

            return false;
          }
        }
      }
    });

    if (!updated) {
      this.addEdgeById(subjectNode.id, insertNode.id, predicate);
    }

  }


  getNodesByType(type: ActivityNodeType): ActivityNode[] {
    const result = filter(this.nodes, (activityNode: ActivityNode) => {
      return activityNode.type === type;
    });

    return result;
  }

  getGPNode() {
    if (this.activityType === ActivityType.proteinComplex) {
      return this.getNode(ActivityNodeType.GoProteinContainingComplex);
    }

    if (this.activityType === ActivityType.molecule) {
      return this.getNode(ActivityNodeType.GoChemicalEntity);
    }

    return this.getNode(ActivityNodeType.GoMolecularEntity);
  }

  getFDRootNode() {
    if (this.activityType === ActivityType.molecule) {
      return this.getNode(ActivityNodeType.GoCellularComponent);
    }

    return this.getNode(ActivityNodeType.GoMolecularFunction);
  }

  getMFNode() {
    return this.getNode(ActivityNodeType.GoMolecularFunction);
  }

  getBPNode() {
    return this.getNode(ActivityNodeType.GoBiologicalProcess);
  }

  getCCNode() {
    return this.getNode(ActivityNodeType.GoCellularComponent);
  }

  getRootNodeByType(type: ActivityNodeType): ActivityNode {
    const rootEdges = this.getEdges(this.rootNode.id)
    const found = find(rootEdges, ((node: Triple<ActivityNode>) => {
      return node.object.type === type
    }))

    if (!found) return null

    return found.object;
  }

  adjustCC() {
    const ccNode = this.getNode(ActivityNodeType.GoCellularComponent);

    if (ccNode && !ccNode.hasValue()) {
      const ccEdges: Triple<ActivityNode>[] = this.getEdges(ccNode.id);

      if (ccEdges.length > 0) {
        const firstEdge = ccEdges[0];
        const rootCC = noctuaFormConfig.rootNode.cc;
        ccNode.term = new Entity(rootCC.id, rootCC.label);
        ccNode.predicate.evidence = firstEdge.predicate.evidence;

      }
    }
  }

  getViolationDisplayErrors() {
    const result = [];

    result.push(...this.violations.map((violation: Violation) => {
      return violation.getDisplayError();
    }));

    return result;
  }

  adjustActivity() {
    if (this.activityType === noctuaFormConfig.activityType.options.bpOnly.name) {
      const rootMF = noctuaFormConfig.rootNode.mf;
      const mfNode = this.getMFNode();
      const bpNode = this.getNode(ActivityNodeType.GoBiologicalProcess);
      const bpEdge = this.getEdge(mfNode.id, bpNode.id);

      mfNode.term = new Entity(rootMF.id, rootMF.label);
      mfNode.predicate.evidence = bpNode.predicate.evidence;

      if (this.bpOnlyEdge) {
        bpEdge.predicate.edge.id = bpNode.predicate.edge.id = this.bpOnlyEdge.id;
        bpEdge.predicate.edge.label = bpNode.predicate.edge.label = this.bpOnlyEdge.label;
      }

    }

    if (this.activityType !== ActivityType.ccOnly && this.activityType !== ActivityType.molecule) {
      const mfNode = this.getMFNode();
      const edge = this.rootEdge;

      if (mfNode && edge) {
        edge.predicate.evidence = mfNode.predicate.evidence;
      }
    }
  }


  copyValues(srcActivity) {
    each(this.nodes, (destNode: ActivityNode) => {
      const srcNode = srcActivity.getNode(destNode.id);
      if (srcNode) {
        destNode.copyValues(srcNode);
      }
    });
  }

  setActivityType(type) {
    this.activityType = type;
  }

  getEdgesByEdgeId(edgeId: string): Triple<ActivityNode>[] {
    const found = filter(this.edges, ((node: Triple<ActivityNode>) => {
      return node.predicate.edge.id === edgeId
    }))

    if (!found) return null

    return found;
  }


  enableSubmit() {
    let result = true;

    this.submitErrors = [];

    each(this.nodes, (node: ActivityNode) => {
      result = node.enableSubmit(this.submitErrors, this.validateEvidence) && result;
    });

    if (this.activityType === ActivityType.bpOnly) {
      if (!this.bpOnlyEdge) {
        const meta = {
          aspect: 'Molecular Function'
        };
        const error = new ActivityError(ErrorLevel.error, ErrorType.general, `Causal relation is required`, meta);
        this.submitErrors.push(error);
        result = false;
      }
    }

    if (this.nodes.length < 2) {
      const error = new ActivityError(ErrorLevel.error, ErrorType.general, `At least 2 nodes are required`);
      this.submitErrors.push(error);
      result = false;
    }

    return result;
  }

  createSave() {
    const saveData = {
      title: 'enabled by ' + this.getNode(ActivityNodeType.GoMolecularEntity)?.term.label,
      triples: [],
      nodes: [],
      graph: null
    };

    this.adjustCC();
    this.adjustActivity();

    const graph = this.getTrimmedGraph(this.rootNodeType);
    const keyNodes = getNodes(graph);
    const edges: Edge<Triple<ActivityNode>>[] = getEdges(graph);

    saveData.nodes = Object.values(keyNodes);

    saveData.triples = edges.map((edge: Edge<Triple<ActivityNode>>) => {
      return edge.metadata;
    });

    saveData.graph = graph;

    return saveData;
  }

  createCCSave() {
    const ccEdges: Triple<ActivityNode>[] = this.getEdges(this.rootNode.id);

    each(ccEdges, (ccEdge: Triple<ActivityNode>) => {
      const activity = new Activity()
      activity.addNode(this.rootNode)
      activity.addEdge(ccEdge.subject, ccEdge.object, ccEdge.predicate)
    });
  }

  createEdit(srcActivity: Activity) {
    const srcSaveData = srcActivity.createSave();
    const destSaveData = this.createSave();
    const saveData = {
      addNodes: destSaveData.nodes,
      addTriples: destSaveData.triples,
      removeIds: subtractNodes(srcSaveData.graph, destSaveData.graph).map((node: ActivityNode) => {
        return node.uuid;
      }),
      removeTriples: []
    };

    return saveData;
  }

  createEditEvidence(srcActivity: Activity, predicate: Predicate) {
    const removeTriples = srcActivity.getEdge(predicate.subjectId, predicate.objectId)
    const addTriples = this.getEdge(predicate.subjectId, predicate.objectId)

    const saveData = {
      addTriples: addTriples,
      removeTriples: removeTriples,
    };

    return saveData;
  }

  createAddIndividual(srcActivity: Activity, predicate: Predicate) {
    const addTriples = this.getEdge(predicate.subjectId, predicate.objectId)

    const saveData = {
      addTriples: addTriples,
    };

    return saveData;
  }

  createDelete() {
    const deleteData = {
      uuids: [],
      triples: []
    };
    const uuids: string[] = [];

    each(this.nodes, (node: ActivityNode) => {
      if (node.hasValue()) {
        uuids.push(node.uuid);
      }
    });

    deleteData.uuids = uuids;

    return deleteData;
  }

  createActivityNodeDelete(node: ActivityNode) {
    const deleteData = {
      uuids: []
    };
    const uuids = this.descendants(node.id).map(node => node.uuid);
    uuids.push(node.uuid);

    deleteData.uuids = uuids;

    return deleteData;
  }

  get title() {
    const gp = this.getGPNode();
    const gpText = gp ? gp.getTerm().label : '';
    let title = '';

    if (this.activityType === ActivityType.ccOnly ||
      this.activityType === ActivityType.molecule) {
      title = gpText;
    } else {
      title = `enabled by (${gpText})`;
    }

    return title;
  }

  buildTrees(): ActivityTreeNode[] {
    const sortedEdges = this.edges.sort(compareTripleWeight);
    const fdRootNode = this.getFDRootNode();

    if (!fdRootNode) return [];
    return [this._buildTree(sortedEdges, fdRootNode)];
  }

  buildGPTrees(): ActivityTreeNode[] {
    const sortedEdges = this.edges.sort(compareTripleWeight);

    return [this._buildTree(sortedEdges, this.gpNode)];
  }

  private _buildTree(triples: Triple<ActivityNode>[], rootNode: ActivityNode): ActivityTreeNode {
    if (!rootNode) return;
    const result: ActivityTreeNode[] = [new ActivityTreeNode(rootNode)]
    const getNestedChildren = (arr: ActivityTreeNode[]) => {

      for (const i in arr) {
        const children = []
        for (const j in triples) {
          if (triples[j].subject.id === arr[i].node.id) {
            children.push(new ActivityTreeNode(triples[j].object));
          }
        }

        if (children.length > 0) {
          arr[i].children = children;
          getNestedChildren(children);
        }
      }
    }

    getNestedChildren(result);

    return result[0]
  }


  get presentation() {
    if (this._presentation) {
      return this._presentation;
    }

    const gp = this.getNode(ActivityNodeType.GoMolecularEntity);
    const mf = this.getNode(ActivityNodeType.GoMolecularFunction);
    const gpText = gp ? gp.getTerm().label : '';
    const mfText = mf ? mf.getTerm().label : '';
    let qualifier = '';
    let title = '';

    if (this.activityType === ActivityType.ccOnly) {
      title = gpText;
    } else if (this.activityType === ActivityType.molecule) {
      title = gpText;
    } else if (this.activityType === ActivityType.proteinComplex) {
      title = gpText;
    } else {
      qualifier = mf.isComplement ? 'NOT' : '';
      title = `enabled by ${gpText}`;
    }

    const result = {
      qualifier: qualifier,
      title: title,
      gpText: gpText,
      mfText: mfText,
      gp: {},
      fd: {},
      extra: []
    };

    const sortedNodes = this.nodes.sort(compareNodeWeight);

    each(sortedNodes, (node: ActivityNode) => {
      if (node.displaySection && node.displayGroup) {
        if (!result[node.displaySection.id][node.displayGroup.id]) {
          result[node.displaySection.id][node.displayGroup.id] = {
            shorthand: node.displayGroup.shorthand,
            label: node.displayGroup.label,
            nodes: []
          };
        }

        result[node.displaySection.id][node.displayGroup.id].nodes.push(node);
        node.nodeGroup = result[node.displaySection.id][node.displayGroup.id];

        if (node.isComplement) {
          node.nodeGroup.isComplement = true;
        }
      }
    });


    this._presentation = result;

    return this._presentation;
  }

  resetPresentation() {
    this._presentation = null;
  }

}

export class ActivityTreeNode {
  parentId: string;
  id: string;
  node: ActivityNode;
  children: ActivityTreeNode[];

  constructor(node: ActivityNode, children: ActivityTreeNode[] = []) {
    this.node = node;
    this.id = node.id
    this.children = children;
  }

}

export function compareActivity(a: Activity, b: Activity) {
  return a.id === b.id;
}



