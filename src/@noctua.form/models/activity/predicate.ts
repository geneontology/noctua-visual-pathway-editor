import { Entity } from './entity';
import { Evidence } from './evidence';
import { each, find, cloneDeep } from 'lodash';
import { EntityLookup } from './entity-lookup';

export class Predicate {
  uuid: string;
  _edge: Entity = new Entity('', '');
  isComplement = false;
  isReverseLink = false;
  reverseLinkTitle: string;
  evidence: Evidence[];
  subjectId: string
  objectId: string

  // Because there is one predicate and multiple evidence
  evidenceLookup: EntityLookup = new EntityLookup();
  referenceLookup: EntityLookup = new EntityLookup();
  withLookup: EntityLookup = new EntityLookup();

  _evidenceMeta = {
    lookupBase: '',
    ontologyClass: 'eco'
  };

  visible = true;

  constructor(edge: Entity, evidence?: Evidence[]) {
    this.edge = edge;
    this.evidence = evidence ? evidence : [];
  }

  get edge() {
    return this._edge;
  }

  set edge(edge: Entity) {
    if (!edge) {
      this._edge = new Entity('', '');
    } else {
      this._edge = edge;
    }
  }

  setEvidenceMeta(ontologyClass, lookupBase) {
    this._evidenceMeta.lookupBase = lookupBase;
    this._evidenceMeta.ontologyClass = ontologyClass;
    this.evidenceLookup.requestParams = JSON.parse(JSON.stringify(lookupBase));
    this.addEvidence();
  }

  setEvidence(evidences: Evidence[]) {
    this.evidence = [];

    each(evidences, (srcEvidence, _i) => {
      this.addEvidence(srcEvidence);
      //destEvidence.copyValues(srcEvidence, except);
    });
  }

  addEvidence(srcEvidence?: Evidence) {
    const evidence = srcEvidence ? cloneDeep(srcEvidence) : new Evidence();

    evidence.setEvidenceOntologyClass(this._evidenceMeta.ontologyClass);
    this.evidence.push(evidence);
    return evidence;
  }

  hasEvidence(): boolean {
    if (!this.evidence) return false;
    if (this.evidence.length > 1) return true;

    if (this.evidence.length > 0) {
      return this.evidence[0].hasValue() ? true : false;
    }

    return false;
  }

  removeEvidence(index) {
    if (index === 0 && this.evidence.length === 1) {
      this.evidence[0].clearValues();
    } else {
      this.evidence.splice(index, 1);
    }
  }

  resetEvidence() {
    this.evidence = [this.evidence[0]];
    this.evidence[0].clearValues();
  }

  getEvidenceById(id) {
    return find(this.evidence, (evidence: Evidence) => {
      return evidence.uuid === id;
    });
  }
}