import { ActivityError, ErrorLevel, ErrorType } from "./parser/activity-error";
import { Entity, EntityType } from './entity';
import { ActivityNode } from './activity-node';
import { find, isEqual } from 'lodash';

import { noctuaFormConfig } from './../../noctua-form-config';
import { CamStats } from "./cam";
import { Contributor } from "../contributor";
import { Group } from "../group";
import { PendingChange } from "./pending-change";
import { NoctuaFormUtils } from "../../utils/noctua-form-utils";
import { DataUtils } from "@noctua.form/data/config/data-utils";

export class EvidenceExt {
  term: Entity;
  relations: Entity[] = [];
}

export class Evidence {
  entityType = EntityType.EVIDENCE;
  edge: Entity;
  evidence: Entity = new Entity('', '');
  referenceEntity: Entity = new Entity('', '');
  withEntity: Entity = new Entity('', '');
  reference: string;
  referenceUrl: string;
  with: string;
  groups: Group[] = [];
  contributors: Contributor[] = [];
  classExpression;
  uuid;
  evidenceRequired = false;
  referenceRequired = false;
  ontologyClass = [];
  pendingEvidenceChanges: PendingChange;
  pendingReferenceChanges: PendingChange;
  pendingWithChanges: PendingChange;
  frequency: number;
  date: string;
  formattedDate: string
  evidenceExts: EvidenceExt[] = [];


  constructor() {

  }

  hasValue() {
    return this.evidence.id && this.reference;
  }

  setEvidenceOntologyClass(value) {
    this.ontologyClass = value;
  }

  setEvidence(value: Entity, classExpression?) {
    this.evidence = value;

    if (classExpression) {
      this.classExpression = classExpression;
    }
  }

  clearValues() {
    this.setEvidence(new Entity('', ''));
    this.reference = '';
    this.with = '';
  }

  isEvidenceEqual(evidence) {
    let result = true;

    result = result && isEqual(this.evidence, evidence.evidence);
    result = result && isEqual(this.reference, evidence.reference);
    result = result && isEqual(this.with, evidence.with);

    return result;
  }

  reviewEvidenceChanges(stat: CamStats, modifiedStats: CamStats): boolean {
    let modified = false;

    if (this.evidence.modified) {
      modifiedStats.evidenceCount++;
      stat.evidenceCount++;
      modified = true;
    }

    if (this.referenceEntity.modified) {
      modifiedStats.referencesCount++;
      stat.referencesCount++;
      modified = true;
    }

    if (this.withEntity.modified) {
      modifiedStats.withsCount++;
      stat.withsCount++;
      modified = true;
    }

    modifiedStats.updateTotal();
    return modified;
  }

  checkStored(oldEvidence: Evidence) {
    if (oldEvidence && this.evidence.id !== oldEvidence.evidence.id) {
      this.evidence.termHistory.unshift(new Entity(oldEvidence.evidence.id, oldEvidence.evidence.label));
      this.evidence.modified = true;
    }

    if (oldEvidence && this.reference !== oldEvidence.reference) {
      this.referenceEntity.termHistory.unshift(new Entity(oldEvidence.referenceEntity.id, oldEvidence.referenceEntity.label));
      this.referenceEntity.modified = true;

    }

    if (oldEvidence && this.with !== oldEvidence.with) {
      this.withEntity.termHistory.unshift(new Entity(oldEvidence.withEntity.id, oldEvidence.withEntity.label));
      this.withEntity.modified = true;
    }

  }

  addPendingChanges(oldEvidence: Evidence) {
    if (this.evidence.id !== oldEvidence.evidence.id) {
      this.pendingEvidenceChanges = new PendingChange(this.uuid, oldEvidence.evidence, this.evidence);
      this.pendingEvidenceChanges.uuid = this.uuid;
    }

    if (this.reference !== oldEvidence.reference) {
      const oldReference = new Entity(oldEvidence.reference, oldEvidence.reference);
      const newReference = new Entity(this.reference, this.reference);

      this.pendingReferenceChanges = new PendingChange(this.uuid, oldReference, newReference);
    }

    if (this.with !== oldEvidence.with) {
      const oldWith = new Entity(oldEvidence.with, oldEvidence.with);
      const newWith = new Entity(this.with, this.with);

      this.pendingWithChanges = new PendingChange(this.uuid, oldWith, newWith);
    }
  }

  enableSubmit(errors, node: ActivityNode, position) {
    let result = true;
    const meta = {
      aspect: node.label
    };

    if (this.evidence.id) {
      this.evidenceRequired = false;
    } else {
      this.evidenceRequired = true;

      // const error = new ActivityError(ErrorLevel.error, ErrorType.general, `No evidence for "${node.label}": on evidence(${position})`, meta);

      // errors.push(error);
      // result = false;
    }

    if (this.evidence.id && !this.reference) {
      const error = new ActivityError(ErrorLevel.error, ErrorType.general,
        `You provided an evidence for "${node.label}" but no reference: on evidence(${position})`,
        meta);
      errors.push(error);

      this.referenceRequired = true;
      result = false;
    } else {
      this.referenceRequired = false;
    }

    if (this.reference) {
      result = this.enableReferenceSubmit(errors, this.reference, node, position);
    }

    if (this.with) {
      result = this.enableWithFromSubmit(errors, this.with, node, position) && result;
    }

    return result;
  }

  enableReferenceSubmit(errors, reference: string, node: ActivityNode, position): boolean {
    const meta = {
      aspect: node.label
    };

    if (!reference.includes(':')) {
      const error = new ActivityError(ErrorLevel.error, ErrorType.general,
        `Use DB:accession format for reference "${node.label}" on evidence(${position})`,
        meta);
      errors.push(error);
      return false;
    }



    const DBAccession = NoctuaFormUtils.splitAndAppend(reference, ':', 1);
    const db = DBAccession[0].trim().toLowerCase();
    const accession = DBAccession[1].trim().toLowerCase();

    /*
    if (!dbs.includes(db)) {
      const error = new ActivityError(ErrorLevel.error, ErrorType.general, 
        `Please enter either PMID, DOI or GO_REF for "${node.label}" on evidence(${position})`,
        meta);
      errors.push(error);
      return false;
    } */

    if (accession === '') {
      const error = new ActivityError(ErrorLevel.error, ErrorType.general,
        `"${db}" accession is required "${node.label}" on evidence(${position})`,
        meta);
      errors.push(error);
      return false;
    }

    return true;
  }


  enableWithFromSubmit(errors, withFrom: string, node: ActivityNode, position): boolean {
    const meta = {
      aspect: node.label
    };

    const hasError = DataUtils.validateDatabaseIdentifiers(withFrom)

    if (hasError) {

      const error = new ActivityError(ErrorLevel.error, ErrorType.general,
        `With/From field "${node.label}" on evidence(${position})  -${hasError}`,
        meta);
      errors.push(error);
      return false;
    }

    return true;
  }

  public static formatReference(reference: string) {
    const DBAccession = NoctuaFormUtils.splitAndAppend(reference, ':', 1);
    const db = DBAccession[0].trim();
    const accession = DBAccession[1].trim();

    return db + ':' + accession;
  }

  public static getReferenceNumber(reference: string) {
    const DBAccession = NoctuaFormUtils.splitAndAppend(reference, ':', 1);
    const accession = DBAccession[1]?.trim();

    return accession;
  }

  public static checkReference(reference: string) {
    let result = false;

    if (reference.includes(':')) {
      const DBAccession = NoctuaFormUtils.splitAndAppend(reference, ':', 1);
      const db = DBAccession[0].trim().toUpperCase();
      const accession = DBAccession[1].trim();
      const dbs = [
        noctuaFormConfig.evidenceDB.options.pmid,
        noctuaFormConfig.evidenceDB.options.doi,
        noctuaFormConfig.evidenceDB.options.goRef,
      ];

      const found = find(dbs, { name: db });
      const accessionFound = accession.length > 0;
      result = found && accessionFound;
    }

    return result;
  }
}

export function compareEvidence(a: Evidence, b: Evidence) {
  return a.evidence.id === b.evidence.id
    && a.reference === b.reference
    && a.with === b.with;
}

export function compareEvidenceEvidence(a: Evidence, b: Evidence) {
  return a.evidence.id === b.evidence.id;
}

export function compareEvidenceReference(a: Evidence, b: Evidence) {
  return a.reference === b.reference;
}

export function compareEvidenceWith(a: Evidence, b: Evidence) {
  return a.with === b.with;
}

export function compareEvidenceDate(a: Evidence, b: Evidence) {
  return a.date === b.date;
}
