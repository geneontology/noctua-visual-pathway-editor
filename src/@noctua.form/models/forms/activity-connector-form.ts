import { FormControl, FormArray, FormBuilder } from '@angular/forms';
import { ActivityFormMetadata } from './../forms/activity-form-metadata';
import { EvidenceForm } from './evidence-form';
import { Evidence } from './../../models/activity/evidence';
import { Predicate } from '..';

export class ActivityConnectorForm {
  edge = new FormControl();
  relationship = new FormControl();
  directness = new FormControl();
  effectDirection = new FormControl();
  evidenceForms: EvidenceForm[] = [];
  evidenceFormArray = new FormArray([]);
  _metadata: ActivityFormMetadata;

  private _fb = new FormBuilder();

  constructor(metadata) {
    this._metadata = metadata;
  }

  createEntityForms(predicate: Predicate) {
    predicate.evidence.forEach((evidence: Evidence) => {
      const evidenceForm = new EvidenceForm(this._metadata, null, evidence);
      this.evidenceForms.push(evidenceForm);
      evidenceForm.onValueChanges(predicate);
      this.evidenceFormArray.push(this._fb.group(evidenceForm));
    });
  }

  updateEvidenceForms(predicate: Predicate) {
    this.evidenceForms = [];
    this.evidenceFormArray = new FormArray([]);

    predicate.evidence.forEach((evidence: Evidence) => {
      const evidenceForm = new EvidenceForm(this._metadata, null, evidence);
      this.evidenceForms.push(evidenceForm);
      evidenceForm.onValueChanges(predicate);
      this.evidenceFormArray.push(this._fb.group(evidenceForm));
    });
  }

  populateConnectorForm() {
    const evidences: Evidence[] = [];

    this.evidenceForms.forEach((evidenceForm: EvidenceForm) => {
      const evidence = new Evidence();
      evidenceForm.populateEvidence(evidence);
      evidences.push(evidence);
    });
  }


}
