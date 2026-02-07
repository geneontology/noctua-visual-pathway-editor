import { FormControl, FormBuilder, FormArray } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ActivityFormMetadata } from './../forms/activity-form-metadata';
import { EvidenceForm } from './evidence-form';

import {
  Triple,
  Evidence,
  EntityLookup,
  Entity
} from '../activity';
import { ActivityNode } from '..';

export class TripleForm {
  subject = new FormControl();
  object = new FormControl();
  evidenceForms: EvidenceForm[] = [];
  evidenceFormArray = new FormArray([]);
  _metadata: ActivityFormMetadata;

  private _fb = new FormBuilder();

  constructor(metadata) {
    this._metadata = metadata;
  }

  createTripleForm(triple: Triple<ActivityNode>) {
    this.subject.setValue(triple.subject.getTerm());
    this.object.setValue(triple.object.getTerm());
    this.onValueChanges(triple.subject.termLookup);
    triple.predicate.evidence.forEach((evidence: Evidence) => {
      const evidenceForm = new EvidenceForm(this._metadata, triple.subject, evidence);

      this.evidenceForms.push(evidenceForm);
      evidenceForm.onValueChanges(triple.predicate);
      this.evidenceFormArray.push(this._fb.group(evidenceForm));
    });
  }

  populateActivityEntityForm(activityNode: ActivityNode) {
    activityNode.term = new Entity(this.subject.value.id, this.subject.value.label);
    this.evidenceForms.forEach(() => {
      // const evidenceFound = activityNode.getEvidenceById(evidenceForm.uuid);
      // const evidence = evidenceFound ? evidenceFound : new Evidence();

      //  evidenceForm.populateEvidence(evidence);
      //  evidences.push(evidence)
    });

    // activityNode.setEvidence(evidences);
  }

  onValueChanges(lookup: EntityLookup) {
    this.subject.valueChanges.pipe(
      distinctUntilChanged(),
      debounceTime(400)
    ).subscribe((data) => {
      this._metadata.lookupFunc.termLookup(data, lookup.requestParams).subscribe((response) => {
        lookup.results = response;
      });
    });
  }

}
