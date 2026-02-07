import { FormControl } from '@angular/forms'
import { distinctUntilChanged, debounceTime } from 'rxjs/operators';

import { Evidence } from './../activity/evidence';
import { ActivityNode } from './../activity/activity-node';
import { ActivityFormMetadata } from './../forms/activity-form-metadata';
import { evidenceValidator } from './validators/evidence-validator';
import { Entity } from '../activity/entity';
import { Predicate } from '../activity/predicate';
import { DataUtils } from '@noctua.form/data/config/data-utils';

export class EvidenceForm {
    uuid;
    evidence = new FormControl();
    reference = new FormControl();
    with = new FormControl();

    _metadata: ActivityFormMetadata;
    private _term

    constructor(metadata, term: ActivityNode, evidence: Evidence) {
        this._metadata = metadata;

        this._term = term;

        if (evidence) {
            this.uuid = evidence.uuid;
            this.evidence.setValue(evidence.evidence);
            this.reference.setValue(evidence.reference);
            this.with.setValue(evidence.with);
        }

        this.setEvidenceValidator();
    }

    populateEvidence(evidence: Evidence) {
        const withFrom = this.with.value ? DataUtils.correctDatabaseIdentifierCase(this.with.value) : null;
        evidence.evidence = new Entity(this.evidence.value.id, this.evidence.value.label);
        evidence.reference = this.reference.value ? this.reference.value.replace(/\s/g, '') : null;
        evidence.with = withFrom ? withFrom.replace(/\s/g, '') : null;
    }

    onValueChanges(predicate: Predicate) {
        this.evidence.valueChanges.pipe(
            distinctUntilChanged(),
            debounceTime(400)
        ).subscribe((data) => {
            this._metadata.lookupFunc.termLookup(data, predicate.evidenceLookup.requestParams).subscribe((response) => {
                predicate.evidenceLookup.results = response;
            });
        });

        this.reference.valueChanges.pipe(
            distinctUntilChanged(),
            debounceTime(400)
        ).subscribe((data) => {
            predicate.referenceLookup.results = this._metadata.lookupFunc.evidenceLookup(data, 'reference');
        });

        this.with.valueChanges.pipe(
            distinctUntilChanged(),
            debounceTime(400)
        ).subscribe((data) => {
            predicate.withLookup.results = this._metadata.lookupFunc.evidenceLookup(data, 'with');
        });
    }

    setEvidenceValidator() {
        this.evidence.setValidators(evidenceValidator(this._term));
    }

    getErrors(error) {
        if (this.evidence.errors) {
            error.push(this.evidence.errors);
        }
        if (this.reference.errors) {
            error.push(this.reference.errors);
        }
        if (this.with.errors) {
            error.push(this.with.errors);
        }
    }
}

