import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, forkJoin, Observable } from 'rxjs';
import { FormGroup, FormBuilder } from '@angular/forms';
import { CurieService } from './../../@noctua.curie/services/curie.service';
import { NoctuaGraphService } from './../services/graph.service';
import { NoctuaFormConfigService } from './../services/config/noctua-form-config.service';
import { NoctuaLookupService } from './lookup.service';
import { NoctuaUserService } from './user.service';
import { Activity } from './../models/activity/activity';
import { CamForm } from './../models/forms/cam-form';
import { ActivityFormMetadata } from './../models/forms/activity-form-metadata';
import { Evidence, compareEvidence } from './../models/activity/evidence';
import { Cam } from './../models/activity/cam';
import { find, uniqWith } from 'lodash';
import { ActivityNodeType, ActivityNode, Entity } from './../models/activity';
import { compareTerm } from './../models/activity/activity-node';
import { environment } from './../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { NoctuaConfirmDialogService } from '@noctua/components/confirm-dialog/confirm-dialog.service';
import { ConfirmDialogData } from '@noctua/components/confirm-dialog/confirm-dialog.component';
import { DataUtils } from '@noctua.form/data/config/data-utils';

declare const require: any;

const model = require('bbop-graph-noctua');

@Injectable({
  providedIn: 'root'
})
export class CamService {
  searchApi = environment.searchApi;
  curieUtil: any;
  cams: Cam[] = [];
  cam: Cam;
  onCamChanged: BehaviorSubject<any>;
  onCamsChanged: BehaviorSubject<any>;
  onCopyModelChanged: BehaviorSubject<any>;
  onCamsCheckoutChanged: BehaviorSubject<any>;
  onSelectedCamChanged: BehaviorSubject<any>;
  onSelectedNodeChanged: BehaviorSubject<any>;
  onSelectedActivityChanged: BehaviorSubject<any>;

  activity: Activity | undefined;
  private camForm: CamForm | undefined;
  private camFormGroup: BehaviorSubject<FormGroup | undefined>;
  camFormGroup$: Observable<FormGroup>;

  currentMatch: Entity = new Entity(null, null);

  constructor(
    public noctuaFormConfigService: NoctuaFormConfigService,
    private confirmDialogService: NoctuaConfirmDialogService,
    private zone: NgZone,
    private httpClient: HttpClient,
    private noctuaUserService: NoctuaUserService,
    private _fb: FormBuilder,
    private noctuaLookupService: NoctuaLookupService,
    private _noctuaGraphService: NoctuaGraphService,
    private curieService: CurieService) {

    this.onCamChanged = new BehaviorSubject(null);
    this.camFormGroup = new BehaviorSubject(null);
    this.camFormGroup$ = this.camFormGroup.asObservable();

    this.onCamsChanged = new BehaviorSubject(null);
    this.onCopyModelChanged = new BehaviorSubject(null);
    this.onCamsCheckoutChanged = new BehaviorSubject(null);
    this.onSelectedCamChanged = new BehaviorSubject(null);
    this.onSelectedNodeChanged = new BehaviorSubject(null);
    this.onSelectedActivityChanged = new BehaviorSubject(null);
    this.curieUtil = this.curieService.getCurieUtil();

    this.onSelectedCamChanged.subscribe((uuid: string) => {
      if (uuid) {
        this.currentMatch.modelId = uuid;
      }
    });

    this.onSelectedNodeChanged.subscribe((uuid: string) => {
      if (uuid) {
        this.currentMatch.uuid = uuid;
      }
    });
  }

  initializeForm(cam?: Cam) {
    const self = this;

    if (cam) {
      this.cam = cam;
    }

    self.camForm = this.createCamForm();
    self.camFormGroup.next(this._fb.group(this.camForm));
  }

  createCamForm() {
    const self = this;

    const formMetadata = new ActivityFormMetadata(self.noctuaLookupService.lookupFunc.bind(self.noctuaLookupService));
    const camForm = new CamForm(formMetadata);

    camForm.createCamForm(this.cam, this.noctuaUserService.user);

    return camForm;
  }

  //Gets a new cam
  getCam(modelId): Cam {
    const cam: Cam = new Cam();

    this.cam = cam;

    cam.graph = null;
    cam.id = modelId;
    cam.model = Object.assign({}, {
      id: modelId,
      title: '',
      modelInfo: this.noctuaFormConfigService.getModelUrls(modelId)
    });
    cam.expanded = true;
    this._noctuaGraphService.getGraphInfo(cam, modelId);
    cam.manager.get_model(cam.id);
    this.onCamChanged.next(cam);

    return cam;
  }



  bulkEditCam(cam: Cam): Observable<any> {
    const self = this;
    const promises = [];

    promises.push(self._noctuaGraphService.bulkEditActivity(cam));

    return forkJoin(promises);
  }

  deleteActivity(activity: Activity) {
    const self = this;
    const deleteData = activity.createDelete();

    return self._noctuaGraphService.deleteActivity(self.cam, deleteData.uuids, deleteData.triples);
  }

  updateTermList(formActivity: Activity, entity: ActivityNode) {
    this.noctuaLookupService.termList = this.getUniqueTerms(formActivity);
    entity.termLookup.results = this.noctuaLookupService.termPreLookup(entity.type);
  }

  updateEvidenceList(formActivity: Activity, entity: ActivityNode) {
    this.noctuaLookupService.evidenceList = this.getUniqueEvidence(formActivity);
    entity.predicate.evidenceLookup.results = this.noctuaLookupService.evidencePreLookup();
  }

  updateReferenceList(formActivity: Activity, entity: ActivityNode) {
    this.noctuaLookupService.evidenceList = this.getUniqueEvidence(formActivity);
    entity.predicate.referenceLookup.results = this.noctuaLookupService.referencePreLookup();
  }

  updateWithList(formActivity: Activity, entity: ActivityNode) {
    this.noctuaLookupService.evidenceList = this.getUniqueEvidence(formActivity);
    entity.predicate.withLookup.results = this.noctuaLookupService.withPreLookup();
  }

  getNodesByType(activityType: ActivityNodeType): any[] {
    return this.cam.getNodesByType(activityType);
  }

  getNodesByTypeFlat(activityType: ActivityNodeType): ActivityNode[] {
    return this.cam.getNodesByTypeFlat(activityType);
  }


  getUniqueTerms(formActivity?: Activity): ActivityNode[] {
    const activityNodes = this.cam.getTerms(formActivity);
    const result = uniqWith(activityNodes, compareTerm);

    return result;
  }

  getUniqueEvidence(formActivity?: Activity): Evidence[] {
    const evidences = this.cam.getEvidences(formActivity);
    const result = uniqWith(evidences, compareEvidence);

    return result;
  }

  copyModel(cam: Cam, title: string, includeEvidence = false) {
    const self = this;

    return self._noctuaGraphService.copyModelRaw(cam, title, includeEvidence).subscribe((response) => {
      const cam: Cam = self._noctuaGraphService.getMetadata(response['data'])
      self.onCopyModelChanged.next(cam)
    });
  }

  updateModel(cams: Cam[], responses) {
    const self = this;

    if (responses && responses.length > 0) {
      responses.forEach(response => {
        const cam: Cam = find(cams, { id: response.data().id });
        if (cam) {
          self._noctuaGraphService.rebuild(cam, response);
          cam.checkStored()
        }
      })
    }
  }

  bulkEditActivityNode(cam: Cam, node: ActivityNode): Observable<any> {
    const self = this;
    const promises = [];

    promises.push(self._noctuaGraphService.bulkEditActivityNode(cam, node));

    return forkJoin(promises).pipe(
      map(res => self.updateModel([cam], res)),
    );
  }

  updateMFProperties(cam: Cam) {

    cam.activities.forEach((activity: Activity) => {
      if (activity.mfNode?.term.id) {
        this.noctuaLookupService.getTermDetail(activity.mfNode.term.id)
          .subscribe((res) => {
            if (!Array.isArray(res) && res.neighborhoodGraphJson) {
              const parsed = JSON.parse(res.neighborhoodGraphJson);
              const objs = DataUtils.processHasParticipants(parsed);
              activity.mfNode.chemicalParticipants = objs;
            }
          });
      }
    });
  }

  isGroupMember() {
    return this.cam.groupIds.some((groupId) => {
      return this.noctuaUserService.user?.groups?.some((userGroup) => {
        return groupId === userGroup?.id;
      });
    });

  }

  checkGroup(success) {
    const isGroupMember = this.isGroupMember();

    const data: ConfirmDialogData = {
      highlightConfirm: false,
      highlightCancel: true,
      cancelLabel: 'Cancel',
      confirmLabel: 'Continue and edit anyway'
    }

    const groups = this.cam.groups.map((group) => {
      return group.name
    }).join(", ");

    if (this.cam.groups?.length === 0 || isGroupMember) {
      success();
    } else {
      this.confirmDialogService.openConfirmDialog(
        `Warning: Editing another group's model`,
        `You are about to edit a model associated with a different group(s) (${groups}). Do you want to continue or cancel?`,
        success,
        data
      );
    }
  }

}
