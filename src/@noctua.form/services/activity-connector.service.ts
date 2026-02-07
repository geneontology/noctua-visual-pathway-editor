import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, forkJoin } from 'rxjs';
import { FormGroup, FormBuilder } from '@angular/forms';
import { NoctuaFormConfigService } from './config/noctua-form-config.service';
import { NoctuaLookupService } from './lookup.service';
import { CamService } from './cam.service';
import { NoctuaGraphService } from './graph.service';
import { ActivityConnectorForm } from './../models/forms/activity-connector-form';
import { ActivityFormMetadata } from './../models/forms/activity-form-metadata';
import { Activity } from './../models/activity/activity';
import { ActivityNode } from './../models/activity/activity-node';
import { Cam, CamOperation } from './../models/activity/cam';
import { ConnectorActivity, ConnectorState, ConnectorType } from './../models/activity/connector-activity';
import { Entity } from '../models/activity/entity';
import { noctuaFormConfig } from '../noctua-form-config';
import { Triple } from '../models/activity/triple';
import { cloneDeep } from 'lodash';
import { Predicate } from '../models';

@Injectable({
  providedIn: 'root'
})
export class NoctuaActivityConnectorService {
  private _fb = inject(FormBuilder);
  noctuaFormConfigService = inject(NoctuaFormConfigService);
  private camService = inject(CamService);
  private noctuaLookupService = inject(NoctuaLookupService);
  private noctuaGraphService = inject(NoctuaGraphService);


  cam: Cam;
  public subjectActivity: Activity;
  public objectActivity: Activity;

  public causalConnection: Triple<Activity>;
  public connectors: any = [];
  private connectorForm: ActivityConnectorForm;
  private connectorFormGroup: BehaviorSubject<FormGroup | undefined>;
  public connectorFormGroup$: Observable<FormGroup>;
  public currentConnectorActivity: ConnectorActivity;
  public connectorActivity: ConnectorActivity;
  public onActivityChanged: BehaviorSubject<any>;
  public onLinkChanged: BehaviorSubject<any>;

  private _allowRequestWatch = false;

  constructor() {

    this.onActivityChanged = new BehaviorSubject(null);
    this.onLinkChanged = new BehaviorSubject(null);
    this.connectorFormGroup = new BehaviorSubject(null);
    this.connectorFormGroup$ = this.connectorFormGroup.asObservable();

    this.camService.onCamChanged.subscribe((cam) => {
      if (!cam) {
        return;
      }

      this.cam = cam;

    });
  }

  initializeForm(subjectId: string, objectId: string) {
    this._allowRequestWatch = false;

    this.subjectActivity = this.cam.findActivityById(subjectId);
    this.objectActivity = this.cam.findActivityById(objectId);
    this.causalConnection = this.cam.getCausalRelation(subjectId, objectId);

    if (this.causalConnection) {
      const predicate = cloneDeep(this.causalConnection.predicate)
      this.connectorActivity = new ConnectorActivity(this.subjectActivity, this.objectActivity, predicate);
      this.connectorActivity.state = ConnectorState.editing
      this.currentConnectorActivity = cloneDeep(this.connectorActivity)
    } else {
      const predicate = this.noctuaFormConfigService.createPredicate(Entity.createEntity(noctuaFormConfig.edge.positivelyRegulates))
      this.connectorActivity = new ConnectorActivity(this.subjectActivity, this.objectActivity, predicate);
      this.connectorActivity.state = ConnectorState.creation
      this.connectorActivity.addDefaultEvidence();
    }

    this.connectorForm = this.createConnectorForm();
    this.connectorFormGroup.next(this._fb.group(this.connectorForm));

    this.connectorActivity.rule.displaySection.directness = false;
    this.connectorActivity.rule.displaySection.effectDirection = false;

    if (this.connectorActivity.connectorType === ConnectorType.ACTIVITY_ACTIVITY) {
      this.connectorForm.relationship.setValue(this.connectorActivity.rule.relationship);
      this.connectorForm.effectDirection.setValue(this.connectorActivity.rule.effectDirection);
      this.connectorForm.directness.setValue(this.connectorActivity.rule.directness);
    } else if (this.connectorActivity.connectorType === ConnectorType.ACTIVITY_MOLECULE) {
      this.connectorForm.relationship.setValue(this.connectorActivity.rule.relationship);
    } else if (this.connectorActivity.connectorType === ConnectorType.MOLECULE_ACTIVITY) {
      this.connectorForm.relationship.setValue(this.connectorActivity.rule.relationship);
      this.connectorForm.effectDirection.setValue(this.connectorActivity.rule.effectDirection);
    }

    this._onActivityFormChanges();

    // just to trigger the on Changes event
    this.connectorForm.effectDirection.setValue(this.connectorActivity.rule.effectDirection);
  }

  updateEvidence(node: ActivityNode) {
    this.connectorForm.updateEvidenceForms(node.predicate);
    this.connectorFormGroup.next(this._fb.group(this.connectorForm));
  }

  createConnectorForm() {
    const formMetadata = new ActivityFormMetadata(this.noctuaLookupService.lookupFunc.bind(this.noctuaLookupService));
    const connectorForm = new ActivityConnectorForm(formMetadata);

    connectorForm.createEntityForms(this.connectorActivity.predicate);

    return connectorForm;
  }

  saveChemicalParticipants(subjectNode: ActivityNode, objectNode: ActivityNode, chemicals: any[]) {
    const nodes = chemicals.map((chemical) => {
      const nodes = new ActivityNode()
      nodes.term.id = chemical.id

      return nodes
    });

    const triples2 = nodes.map((node) => {
      const edge = new Entity(noctuaFormConfig.edge.hasOutput.id, '')
      const predicate = new Predicate(edge);
      const triple = new Triple<ActivityNode>(
        subjectNode, node, predicate)
      return triple
    });

    const triples = nodes.map((node) => {
      const edge = new Entity(noctuaFormConfig.edge.hasInput.id, '')
      const predicate = new Predicate(edge);
      const triple = new Triple<ActivityNode>(
        objectNode, node, predicate)
      return triple
    });

    return forkJoin(this.noctuaGraphService.addActivity(this.cam, nodes, [...triples, ...triples2], this.cam.title));

  }

  saveActivity() {
    if (this.connectorActivity.state === ConnectorState.editing) {
      const saveData = this.connectorActivity.createEdit(this.currentConnectorActivity);
      return this.noctuaGraphService.editConnection(
        this.cam,
        saveData.removeTriples,
        saveData.addTriples).then(() => {
          this.initializeForm(this.subjectActivity.id, this.objectActivity.id)
        });
    } else { // creation
      const saveData = this.connectorActivity.createSave();
      return this.noctuaGraphService.addActivity(this.cam, [], saveData.triples, '', CamOperation.ADD_CAUSAL_RELATION);
    }
  }

  deleteConnectorEdge(connectorActivity: ConnectorActivity) {
    const deleteData = connectorActivity.createDelete();

    return this.noctuaGraphService.deleteActivity(this.cam, [], deleteData.triples);
  }


  private _onActivityFormChanges(): void {
    this.connectorFormGroup.getValue().valueChanges.subscribe(value => {
      this.connectorActivity.checkConnection(value);
      if (this.connectorActivity.predicate?.edge?.id && this._allowRequestWatch && (this.connectorActivity.state === ConnectorState.editing)) {
        this.saveActivity()
      }
      this._allowRequestWatch = true
    });
  }
}

