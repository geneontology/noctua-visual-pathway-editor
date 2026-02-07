import { Evidence } from './evidence';
import { ActivityError, ErrorLevel, ErrorType } from './parser/activity-error';
import { Activity } from './activity';
import { Entity, EntityType } from './entity';
import { EntityLookup } from './entity-lookup';
import { Contributor } from './../contributor';
import { each, find } from 'lodash';
import { NoctuaFormUtils } from './../../utils/noctua-form-utils';
import { Predicate } from './predicate';
import { PendingChange } from './pending-change';
import { CamStats } from './cam';

export class GoCategory {
  id: ActivityNodeType;
  category: string;
  categoryType = 'isa_closure';
  suffix: string;
}

export enum ActivityNodeType {

  GoCellularComponent = 'GoCellularComponent',
  GoBiologicalProcess = 'GoBiologicalProcess',
  GoMolecularFunction = 'GoMolecularFunction',
  GoMolecularEntity = 'GoMolecularEntity',
  // extensions 
  GoCellularAnatomical = 'GoCellularAnatomical',
  GoProteinContainingComplex = 'GoProteinContainingComplex',
  GoBiologicalPhase = 'GoBiologicalPhase',
  GoChemicalEntity = 'GoChemicalEntity',
  GoCellTypeEntity = 'GoCellTypeEntity',
  GoAnatomicalEntity = 'GoAnatomicalEntity',
  GoOrganism = 'GoOrganism',
  WormLifeStage = "WormLifeStage",
  // extra internal use
  GoChemicalEntityHasInput = 'GoChemicalEntityHasInput',
  GoChemicalEntityHasOutput = 'GoChemicalEntityHasOutput',

  // evidence
  GoEvidence = 'GoEvidence',
  BPPhaseStageExistenceOverlaps = "BPPhaseStageExistenceOverlaps",
  BPPhaseStageExistenceStartsEnds = "BPPhaseStageExistenceStartsEnds",
  UberonStage = "UberonStage"
}

export interface ActivityNodeDisplay {
  id: string;
  rootTypes: Entity[];
  type: ActivityNodeType;
  label: string;
  uuid: string;
  isExtension: boolean;
  aspect: string;
  category: GoCategory[];
  displaySection: any;
  displayGroup: any;
  treeLevel: number;
  required: boolean;
  termRequired: boolean;
  visible: boolean;
  skipEvidenceCheck: boolean;
  showEvidence: boolean;
  isKey: boolean;
  weight: number;
  relationEditable: boolean;
  showInMenu: boolean;
  canDelete: boolean;
}

export class ActivityNode implements ActivityNodeDisplay {
  subjectId: string;
  entityType = EntityType.ACTIVITY_NODE
  type: ActivityNodeType;
  label: string;
  uuid: string;
  category: GoCategory[];
  rootTypes: Entity[] = [];
  term: Entity = new Entity('', '');
  date: string;
  termLookup: EntityLookup = new EntityLookup();
  isExtension = false;
  aspect: string;
  nodeGroup: any = {};
  activity: Activity;
  ontologyClass: any = [];
  isComplement = false;
  closures: any = [];
  assignedBy: boolean = null;
  contributor: Contributor = null;
  isCatalyticActivity = false;
  isKey = false;
  displaySection: any;
  displayGroup: any;
  predicate: Predicate;
  treeLevel = 1;
  required = false;
  termRequired = false;
  visible = true;
  canInsertNodes;
  skipEvidenceCheck = false;
  showEvidence = true;
  errors = [];
  warnings = [];
  status = '0';
  weight: 0;
  relationEditable = false;
  showInMenu = false;
  insertMenuNodes = [];
  linkedNode = false;
  familyNodes = [];
  displayId: string;
  expandable = true;
  expanded = false;
  causalNode = false;
  frequency: number;
  canDelete = true;

  private _id: string;

  //For Save 
  pendingEntityChanges: PendingChange;
  pendingRelationChanges: PendingChange;

  //CHemical Properties  
  chemicalParticipants = []


  constructor(activityNode?: Partial<ActivityNodeDisplay>) {
    if (activityNode) {
      this.overrideValues(activityNode);
    }
  }

  getTerm() {
    return this.term;
  }

  get id() {
    return this._id;
  }

  set id(id: string) {
    this._id = id;
    this.displayId = NoctuaFormUtils.cleanID(id);
  }

  get classExpression() {
    return this.term.classExpression;
  }

  set classExpression(classExpression) {
    this.term.classExpression = classExpression;
  }

  setTermOntologyClass(value) {
    this.ontologyClass = value;
  }

  toggleIsComplement() {
    this.isComplement = !this.isComplement;
    this.nodeGroup.isComplement = this.isComplement;
  }

  setIsComplement(complement) {
    this.isComplement = complement;
  }

  hasValue() {
    return this.term.hasValue();
  }

  hasRootType(inRootType: GoCategory) {
    const found = find(this.rootTypes, (rootType: Entity) => {
      return rootType.id === inRootType.category;
    });

    return found ? true : false
  }

  hasRootTypes(inRootTypes: GoCategory[]) {
    let found = false;
    for (let i = 0; i < this.rootTypes.length; i++) {
      for (let j = 0; j < inRootTypes.length; j++) {
        if (this.rootTypes[i].id === inRootTypes[j].category) {
          found = true;
          break;
        }
      }
    }

    return found;
  }

  clearValues() {
    this.term.id = null;
    this.term.label = null;
    this.predicate.resetEvidence();
  }

  copyValues(node: ActivityNode) {
    this.uuid = node.uuid;
    this.term = node.term;
    this.assignedBy = node.assignedBy;
    this.isComplement = node.isComplement;
    this.isCatalyticActivity = node.isCatalyticActivity;
  }

  setTermLookup(value) {
    this.termLookup.requestParams = value;
  }

  setDisplay(value) {
    if (value) {
      this.displaySection = value.displaySection;
      this.displayGroup = value.displayGroup;
    }
  }

  enableRow() {
    let result = true;
    if (this.nodeGroup) {
      if (this.nodeGroup.isComplement && this.treeLevel > 0) {
        result = false;
      }
    }

    return result;
  }

  reviewTermChanges(stat: CamStats, modifiedStats: CamStats): boolean {
    let modified = false;

    if (this.term.modified) {
      if (this.id === ActivityNodeType.GoMolecularEntity) {
        modifiedStats.gpsCount++;
        stat.gpsCount++;
      } else {
        modifiedStats.termsCount++;
        stat.termsCount++;
      }

      modified = true;
    }

    each(this.predicate.evidence, (evidence: Evidence, _key) => {
      const evidenceModified = evidence.reviewEvidenceChanges(stat, modifiedStats);
      modified = modified || evidenceModified;
    });

    modifiedStats.updateTotal();
    return modified;
  }

  checkStored(oldNode: ActivityNode) {
    if (oldNode && this.term.id !== oldNode.term.id) {
      this.term.termHistory.unshift(new Entity(oldNode.term.id, oldNode.term.label));
      this.term.modified = true;
    }

    each(this.predicate.evidence, (evidence: Evidence, _key) => {
      const oldEvidence = oldNode?.predicate.getEvidenceById(evidence.uuid)
      evidence.checkStored(oldEvidence)
    });
  }

  addPendingChanges(oldNode: ActivityNode) {
    if (this.term.id !== oldNode.term.id) {
      this.pendingEntityChanges = new PendingChange(this.uuid, oldNode.term, this.term);
    }

    if (this.predicate.edge.id !== oldNode.predicate.edge.id) {
      this.pendingRelationChanges = new PendingChange(this.uuid, oldNode.predicate.edge, this.predicate.edge);
    }

    each(this.predicate.evidence, (evidence: Evidence, _key) => {
      const oldEvidence = oldNode.predicate.getEvidenceById(evidence.uuid)
      evidence.addPendingChanges(oldEvidence);
    });

    //this is temporary swap back into old
    //this.term = oldNode.term
  }

  enableSubmit(errors, validateEvidence = true) {
    let result = true;

    if (this.termRequired && !this.term.id) {
      this.required = true;
      const meta = {
        aspect: this.label
      };
      const error = new ActivityError(ErrorLevel.error, ErrorType.general, `"${this.label}" is required`, meta);
      errors.push(error);
      result = false;
    } else {
      this.required = false;
    }

    if (!this.skipEvidenceCheck && this.hasValue() && validateEvidence) {
      each(this.predicate.evidence, (evidence: Evidence, key) => {
        result = evidence.enableSubmit(errors, this, key + 1) && result;
      });
    }

    return result;
  }

  overrideValues(override: Partial<ActivityNodeDisplay> = {}) {
    Object.assign(this, override);
  }
}

export function categoryToClosure(categories: GoCategory[]) {

  const results = categories.map((category) => {
    let result
    if (category.categoryType === 'is_obsolete') {
      result = `${category.categoryType}:${category.category}`;
    } else {
      result = `${category.categoryType}:"${category.category}"`;
    }
    if (category.suffix) {
      result += ' ' + category.suffix;
    }
    return result
  }).join(' OR ');

  return results;
}

export function compareTerm(a: ActivityNode, b: ActivityNode) {
  return a.term.id === b.term.id;
}

export function compareNodeWeight(a: ActivityNode, b: ActivityNode): number {
  if (a.weight < b.weight) {
    return -1;
  } else {
    return 1;
  }
}

