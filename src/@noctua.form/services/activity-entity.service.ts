import { Injectable, NgZone, inject } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { FormGroup, FormBuilder } from '@angular/forms';
import { NoctuaFormConfigService } from './config/noctua-form-config.service';
import { NoctuaLookupService } from './lookup.service';
import { CamService } from './../services/cam.service';
import { Cam, CamLoadingIndicator } from './../models/activity/cam';
import { EntityForm } from './../models/forms/entity-form';
import { ActivityFormMetadata } from './../models/forms/activity-form-metadata';
import { NoctuaGraphService } from './graph.service';
import { cloneDeep } from 'lodash';
import { Activity } from './../models/activity/activity';
import { ActivityNode } from './../models/activity/activity-node';
import { Entity } from '../models/activity/entity';
import { Evidence } from './../models/activity/evidence';
import { ConnectorActivity } from './../models/activity/connector-activity';

@Injectable({
  providedIn: 'root'
})
export class NoctuaActivityEntityService {
  private _fb = inject(FormBuilder);
  private zone = inject(NgZone);
  noctuaFormConfigService = inject(NoctuaFormConfigService);
  private noctuaGraphService = inject(NoctuaGraphService);
  private camService = inject(CamService);
  private noctuaLookupService = inject(NoctuaLookupService);

  public cam: Cam;
  public currentActivity: Activity;
  public activity: Activity;
  public entity: ActivityNode;
  private entityForm: EntityForm;
  private entityFormGroup: BehaviorSubject<FormGroup | undefined>;
  public entityFormGroup$: Observable<FormGroup>;

  constructor() {

    this.entityFormGroup = new BehaviorSubject(null);
    this.entityFormGroup$ = this.entityFormGroup.asObservable();
    this.camService.onCamChanged.subscribe((cam) => {
      if (!cam) {
        return;
      }

      this.cam = cam;
    });
  }

  initializeForm(activity: Activity, entity: ActivityNode) {
    this.currentActivity = cloneDeep(activity);
    this.activity = activity;
    this.entity = entity;
    this.entityForm = this.createActivityEntityForm(this.entity);
    this.entityFormGroup.next(this._fb.group(this.entityForm));
    this._onActivityFormChanges();
  }

  reinitializeForm(term: Entity, evidences: Evidence[]) {
    this.entityForm.term.setValue(term);
    this.entityForm.refreshEvidenceForms(evidences);
    this.entityFormGroup.next(this._fb.group(this.entityForm));
  }

  createActivityEntityForm(entity: ActivityNode) {
    const formMetadata = new ActivityFormMetadata(this.noctuaLookupService.lookupFunc.bind(this.noctuaLookupService));
    const entityForm = new EntityForm(formMetadata, entity);

    entityForm.createEvidenceForms(entity);

    return entityForm;
  }

  activityEntityFormToActivity() {
    this.entityForm.populateTerm();
  }

  private _onActivityFormChanges(): void {
    this.entityFormGroup.getValue().valueChanges.subscribe(() => {
      // this.errors = this.getActivityFormErrors();
      //  this.activityEntityFormToActivity();
      // this.activity.enableSubmit();
    });
  }

  saveActivity() {
    this.activityEntityFormToActivity();

    if (this.activity instanceof ConnectorActivity) {
      this.activity.predicate.evidence = this.entity.predicate.evidence;
    }

    const saveData = this.activity.createEdit(this.currentActivity);

    return this.noctuaGraphService.editActivity(this.cam,
      saveData.addNodes,
      saveData.addTriples,
      saveData.removeIds);
  }

  addIndividual() {
    this.activityEntityFormToActivity();

    const saveData = this.activity.createAddIndividual(this.currentActivity, this.entity.predicate);

    return this.noctuaGraphService.editActivity(this.cam,
      [this.entity],
      [saveData.addTriples],
      [],
      []);
  }

  saveSearchDatabase() {
    const removeTriples = this.currentActivity.getEdge(
      this.entity.predicate.subjectId,
      this.entity.predicate.objectId)
    const addTriples = this.activity.getEdge(
      this.entity.predicate.subjectId,
      this.entity.predicate.objectId)

    return this.noctuaGraphService.editActivity(this.cam,
      [],
      [addTriples],
      [],
      [removeTriples]);
  }

  addEvidence() {
    this.activityEntityFormToActivity();

    const saveData = this.activity.createEditEvidence(this.currentActivity, this.entity.predicate);

    return this.noctuaGraphService.editActivity(this.cam,
      [],
      [saveData.addTriples],
      [],
      [saveData.removeTriples]);
  }

  createEvidence(evidence: Evidence[]) {
    this.entity.predicate.evidence = evidence

    const saveData = this.activity.createEditEvidence(this.currentActivity, this.entity.predicate);

    return this.noctuaGraphService.editActivity(this.cam,
      [],
      [saveData.addTriples],
      [],
      [saveData.removeTriples]);
  }


  deleteActivityNode(activity: Activity, activityNode: ActivityNode) {
    const deleteData = activity.createActivityNodeDelete(activityNode);

    return this.noctuaGraphService.deleteActivity(this.cam, deleteData.uuids, []);
  }

  deleteEvidence(uuid: string) {
    return this.noctuaGraphService.deleteEvidence(this.cam, uuid);
  }


  deleteEvidenceReference(uuid: string, oldReference: string) {
    return this.noctuaGraphService.deleteEvidenceAnnotation(this.cam, uuid, 'source', oldReference);
  }

  deleteEvidenceWith(uuid: string, oldWith: string) {
    return this.noctuaGraphService.deleteEvidenceAnnotation(this.cam, uuid, 'with', oldWith);
  }


  saveActivityReplace(cam: Cam, addLoadingStatus?: boolean): Observable<any> {
    if (addLoadingStatus) {
      cam.loading = new CamLoadingIndicator(true, 'Replacing  ...');
    }

    const oldEntity = cloneDeep(this.entity);
    this.activityEntityFormToActivity();
    this.entity.addPendingChanges(oldEntity);

    return this.camService.bulkEditActivityNode(cam, this.entity);

  }
}

