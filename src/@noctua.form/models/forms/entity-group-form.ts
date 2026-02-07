import { FormBuilder, FormArray } from '@angular/forms';
import { Activity } from './../activity/activity';
import { ActivityFormMetadata } from './../forms/activity-form-metadata';
import { EntityForm } from './entity-form';
import { ActivityNode } from '../activity';


export class EntityGroupForm {
    name = '';
    isComplement = false;
    entityForms: EntityForm[] = [];
    entityGroup = new FormArray([]);

    _metadata: ActivityFormMetadata;
    private _fb = new FormBuilder();

    constructor(metadata) {
        this._metadata = metadata;
    }

    createEntityForms(entities: ActivityNode[]) {
        this.entityForms = [];
        entities.forEach((entity: ActivityNode) => {
            if (entity.visible) {
                const entityForm = new EntityForm(this._metadata, entity);
                if (!entity.skipEvidenceCheck) {
                    entityForm.createEvidenceForms(entity);
                }
                this.entityForms.push(entityForm);
                this.entityGroup.push(this._fb.group(entityForm));
            }
        });
    }

    populateActivityNodes(_activity: Activity) {
        this.entityForms.forEach((entityForm: EntityForm) => {
            entityForm.populateTerm();
        });
    }

    getErrors(error) {
        this.entityForms.forEach((entityForm: EntityForm) => {
            entityForm.getErrors(error);
        });
    }
}

