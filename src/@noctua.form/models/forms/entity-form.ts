import { FormArray, FormBuilder, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Evidence } from './../activity/evidence';
import { ActivityFormMetadata } from './activity-form-metadata';
import { EvidenceForm } from './evidence-form';
import { termValidator } from './validators/term-validator';
import { EntityLookup } from '../activity/entity-lookup';
import { Entity } from './../activity/entity';
import { ActivityNode } from './../activity/activity-node';

export class EntityForm {
    id: string;
    node: ActivityNode;
    relationship = new FormControl();
    term = new FormControl();
    evidenceForms: EvidenceForm[] = [];
    evidenceFormArray = new FormArray([]);
    _metadata: ActivityFormMetadata;
    private _fb = new FormBuilder();

    constructor(metadata, entity: ActivityNode) {
        this._metadata = metadata;
        this.id = entity.id;
        this.node = entity;

        this.term.setValue(entity.getTerm());
        this.relationship.setValue(entity.predicate.edge);
        this._onValueChanges(entity.termLookup);
    }

    createEvidenceForms(entity: ActivityNode) {
        this.setTermValidator(entity);

        entity.predicate.evidence.forEach((evidence: Evidence) => {
            const evidenceForm = new EvidenceForm(this._metadata, entity, evidence);

            this.evidenceForms.push(evidenceForm);
            evidenceForm.onValueChanges(entity.predicate);
            //  evidenceForm.setTermValidator(termValidator(this.term, entity));
            this.evidenceFormArray.push(this._fb.group(evidenceForm));
        });
    }

    refreshEvidenceForms(evidences: Evidence[]) {
        this.evidenceForms = [];
        this.evidenceFormArray = new FormArray([]);

        evidences.forEach((evidence: Evidence) => {
            const evidenceForm = new EvidenceForm(this._metadata, this.node, evidence);

            this.evidenceForms.push(evidenceForm);
            evidenceForm.onValueChanges(this.node.predicate);
            this.evidenceFormArray.push(this._fb.group(evidenceForm));
        });
    }

    populateTerm() {
        if (this.relationship.value && this.node.relationEditable) {
            this.node.predicate.edge = this.relationship.value;
        }

        if (this.term.value && this.term.value.id) {
            this.node.term = new Entity(this.term.value.id, this.term.value.label);

            this.evidenceForms.forEach((evidenceForm: EvidenceForm, index: number) => {
                const evidence: Evidence = this.node.predicate.evidence[index];
                if (evidence) {
                    evidenceForm.populateEvidence(evidence);
                }
            });
        }
    }

    populateTermEvidenceOnly() {
        this.evidenceForms.forEach((evidenceForm: EvidenceForm, index: number) => {
            const evidence: Evidence = this.node.predicate.evidence[index];
            if (evidence) {
                evidenceForm.populateEvidence(evidence);
            }
        });
    }

    private _onValueChanges(lookup: EntityLookup) {
        this.term.valueChanges.pipe(
            distinctUntilChanged(),
            debounceTime(400)
        ).subscribe((data) => {
            this._metadata.lookupFunc.termLookup(data, lookup.requestParams).subscribe((response) => {
                lookup.results = response;
            });
        });
    }

    setTermValidator(entity) {
        this.term.setValidators(entity.id === 'mf' ? termValidator(entity) : null);
        //  this.term.setValidators([validatorFn])
    }

    getErrors(error) {
        if (this.term.errors) {
            error.push(this.term.errors);
        }

        this.evidenceForms.forEach((evidenceForm: EvidenceForm) => {
            evidenceForm.getErrors(error)
        });
    }
}

