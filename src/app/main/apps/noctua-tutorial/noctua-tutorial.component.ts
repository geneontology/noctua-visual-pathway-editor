
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDrawer } from '@angular/material/sidenav';
import { Subject } from 'rxjs';

import { noctuaAnimations } from './../../../../@noctua/animations';

import {
  Cam,
  ActivityType,
  Contributor,
  NoctuaUserService,
  NoctuaFormConfigService,
  NoctuaFormMenuService,
  NoctuaActivityFormService,
  CamService,
  noctuaFormConfig,
  MiddlePanel,
  LeftPanel,
  Activity,
  NoctuaGraphService,
  ActivityDisplayType,
  CamLoadingIndicator,
  ReloadType
} from '@geneontology/noctua-form-base';

import { takeUntil, distinctUntilChanged } from 'rxjs/operators';
import { NoctuaDataService } from '@noctua.common/services/noctua-data.service';
import { TableOptions } from '@noctua.common/models/table-options';
import { NoctuaSearchDialogService } from '@noctua.search/services/dialog.service';
import { NoctuaReviewSearchService } from '@noctua.search/services/noctua-review-search.service';

@Component({
  selector: 'app-noctua-tutorial',
  templateUrl: './noctua-tutorial.component.html',
  styleUrls: ['./noctua-tutorial.component.scss'],
  animations: noctuaAnimations
})
export class NoctuaTutorialComponent implements OnInit, OnDestroy {
  ActivityType = ActivityType;
  LeftPanel = LeftPanel;
  MiddlePanel = MiddlePanel;


  @ViewChild('leftDrawer', { static: true })
  leftDrawer: MatDrawer;

  @ViewChild('rightDrawer', { static: true })
  rightDrawer: MatDrawer;

  summary;
  public cam: Cam;
  searchResults = [];
  modelId = '';

  noctuaFormConfig = noctuaFormConfig;

  tableOptions: TableOptions = {
    displayType: ActivityDisplayType.TREE,
    slimViewer: false,
    editableTerms: true,
    editableEvidence: true,
    editableReference: true,
    editableWith: true,
    editableRelation: true,
    showMenu: true
  };

  private _unsubscribeAll: Subject<any>;

  constructor(
    private route: ActivatedRoute,
    private camService: CamService,
    private _noctuaGraphService: NoctuaGraphService,
    private noctuaDataService: NoctuaDataService,
    private noctuaReviewSearchService: NoctuaReviewSearchService,
    public noctuaSearchDialogService: NoctuaSearchDialogService,
    public noctuaUserService: NoctuaUserService,
    public noctuaFormConfigService: NoctuaFormConfigService,
    public noctuaActivityFormService: NoctuaActivityFormService,
    public noctuaFormMenuService: NoctuaFormMenuService) {

    this._unsubscribeAll = new Subject();

    this.route
      .queryParams
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(params => {
        this.modelId = params['model_id'] || null;
        const baristaToken = params['barista_token'] || null;
        this.noctuaUserService.getUser(baristaToken);
      });

    this.noctuaUserService.onUserChanged.pipe(
      distinctUntilChanged(this.noctuaUserService.distinctUser),
      takeUntil(this._unsubscribeAll))
      .subscribe((user: Contributor) => {

        if (user === undefined) return;

        this.noctuaFormConfigService.setupUrls();
        this.noctuaFormConfigService.setUniversalUrls();
        this.loadCam(this.modelId);

      });
  }

  ngOnInit(): void {
    const self = this;

    self.noctuaFormMenuService.setLeftDrawer(self.leftDrawer);
    self.noctuaFormMenuService.setRightDrawer(self.rightDrawer);

    this._noctuaGraphService.onCamGraphChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((cam: Cam) => {
        if (!cam || cam.id !== self.cam.id) {
          return;
        }
        this.cam = cam;

        if (cam.activities.length > 0) {
          this.camService.addCamEdit(this.cam)
          this.camService.cams = [cam]
        }
        //this.noctuaReviewSearchService.addCamsToReview([this.cam], this.camService.cams);

      });
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  loadCam(modelId) {
    this.cam = this.camService.getCam(modelId);

  }

  openCamForm() {
    this.camService.initializeForm(this.cam);
    this.noctuaFormMenuService.openLeftDrawer(LeftPanel.camForm);
  }

  openActivityForm(activityType: ActivityType) {
    this.noctuaActivityFormService.setActivityType(activityType);
    this.noctuaFormMenuService.openLeftDrawer(LeftPanel.activityForm);
  }

  openSearch() {
    this.noctuaFormMenuService.openLeftDrawer(LeftPanel.findReplace);
  }

  openCopyModel() {
    this.noctuaFormMenuService.openLeftDrawer(LeftPanel.copyModel);
  }

  resetCam(cam: Cam) {
    const self = this;

    const summary = self.camService.reviewCamChanges(cam);
    const success = (ok) => {
      if (ok) {
        cam.loading = new CamLoadingIndicator(true, 'Resetting Model ...');
        self.camService.reloadCam(cam, ReloadType.RESET)
        self.noctuaReviewSearchService.onClearForm.next(true);
        self.noctuaReviewSearchService.clear();
        self.cam.clearHighlight()
      }
    }

    const options = {
      title: 'Discard Unsaved Changes',
      message: `All your changes will be discarded for model. Model Name:"${cam.title}"`,
      cancelLabel: 'Cancel',
      confirmLabel: 'OK'
    }

    self.noctuaSearchDialogService.openCamReviewChangesDialog(success, summary, options)
  }

  storeCam(cam: Cam) {

    const self = this;
    const summary = self.camService.reviewCamChanges(cam);

    const success = (replace) => {
      if (replace) {
        cam.loading = new CamLoadingIndicator(true, 'Saving Model ...');
        self.camService.reloadCam(cam, ReloadType.STORE)
        self.noctuaReviewSearchService.onClearForm.next(true);
        self.noctuaReviewSearchService.clear();
        self.cam.clearHighlight()
      }
    };

    const options = {
      title: 'Save Changes?',
      message: `All your changes will be saved for model. Model Name:"${cam.title}"`,
      cancelLabel: 'Go Back',
      confirmLabel: 'Submit'
    }

    self.noctuaSearchDialogService.openCamReviewChangesDialog(success, summary, options)
  }
}


