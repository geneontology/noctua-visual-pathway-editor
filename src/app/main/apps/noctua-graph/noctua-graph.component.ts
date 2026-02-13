import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { Subject } from 'rxjs';
import { noctuaAnimations } from './../../../../@noctua/animations';
import {
  Cam,
  Contributor,
  NoctuaUserService,
  NoctuaFormConfigService,
  CamService,
  ActivityDisplayType,
  ActivityType,
  NoctuaActivityFormService
} from '@geneontology/noctua-form-base';

import { FormGroup } from '@angular/forms';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { NoctuaCommonMenuService } from '@noctua.common/services/noctua-common-menu.service';
import { LeftPanel, MiddlePanel, RightPanel } from '@noctua.common/models/menu-panels';
import { PerfectScrollbarDirective } from 'ngx-perfect-scrollbar';
import { TableOptions } from '@noctua.common/models/table-options';
import { SettingsOptions } from '@noctua.common/models/graph-settings';
import { WorkbenchId } from '@noctua.common/models/workench-id';
import { CamToolbarOptions } from '@noctua.common/models/cam-toolbar-options';

import { CamGraphComponent } from './cam-graph/cam-graph.component';
import { ActivityTableComponent } from './activity-table/activity-table.component';
import { CamErrorsComponent } from './cam-errors/cam-errors.component';
import { ActivityConnectorTableComponent } from './activity-connector-table/activity-connector-table.component';
import { NoctuaFormModule } from '../noctua-form/noctua-form.module';

@Component({
    selector: 'noc-noctua-graph',
    templateUrl: './noctua-graph.component.html',
    styleUrls: ['./noctua-graph.component.scss'],
    animations: noctuaAnimations,
    standalone: true,
    imports: [
        CommonModule,
        MatSidenavModule,
        FontAwesomeModule,
        CamGraphComponent,
        ActivityTableComponent,
        CamErrorsComponent,
        ActivityConnectorTableComponent,
        NoctuaFormModule
    ]
})
export class NoctuaGraphComponent implements OnInit, AfterViewInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private camService = inject(CamService);
  noctuaActivityFormService = inject(NoctuaActivityFormService);
  noctuaFormConfigService = inject(NoctuaFormConfigService);
  noctuaCommonMenuService = inject(NoctuaCommonMenuService);
  noctuaUserService = inject(NoctuaUserService);


  @ViewChild('leftDrawer', { static: true })
  leftDrawer: MatDrawer;

  @ViewChild('rightDrawer', { static: true })
  rightDrawer: MatDrawer;

  @ViewChild(PerfectScrollbarDirective, { static: false })
  scrollbarRef?: PerfectScrollbarDirective;

  settings: SettingsOptions;
  tableWidth = "550px";

  loadingSpinner: any = {
    color: 'primary',
    mode: 'indeterminate'
  };


  ActivityType = ActivityType;
  LeftPanel = LeftPanel;
  MiddlePanel = MiddlePanel;
  RightPanel = RightPanel;

  public cam: Cam;
  public user: Contributor;

  searchResults = [];
  modelId = '';
  searchCriteria: any = {};
  searchFormData: any = [];
  searchForm: FormGroup;

  cams: any[] = [];

  camToolbarOptions: CamToolbarOptions = {
    showCreateButton: false
  }

  tableOptions: TableOptions = {
    displayType: ActivityDisplayType.SLIM_TREE,
    slimViewer: true,
    editableTerms: true,
    editableEvidence: true,
    editableReference: true,
    editableWith: true,
    showMenu: true
  };

  noctuaFormOptions: TableOptions = {
    displayType: ActivityDisplayType.TREE,
    slimViewer: false,
    editableTerms: true,
    editableEvidence: true,
    editableReference: true,
    editableWith: true,
    showMenu: true
  };

  scrollbarConfig = {
    suppressScrollX: true
  }

  private _unsubscribeAll: Subject<any>;

  constructor() {
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
      .subscribe((_user: Contributor) => {
        this.noctuaFormConfigService.setupUrls();
        this.noctuaFormConfigService.setUniversalUrls();
        this.loadCam(this.modelId);
      });
  }

  ngOnInit(): void {
    this.noctuaCommonMenuService.selectedMiddlePanel = MiddlePanel.camGraph;
    this.noctuaCommonMenuService.setLeftDrawer(this.leftDrawer);
    this.noctuaCommonMenuService.setRightDrawer(this.rightDrawer);

    this.noctuaCommonMenuService.onCamSettingsChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((settings: SettingsOptions) => {
        if (!settings) {
          return;
        }
        this.settings = settings;
        this.tableWidth = this.getTableWidth(settings);
      });
  }

  ngAfterViewInit(): void {
    this.noctuaCommonMenuService.resultsViewScrollbar = this.scrollbarRef;
  }

  loadCam(modelId) {
    this.cam = this.camService.getCam(modelId);
  }

  openLeftDrawer(panel) {
    this.noctuaCommonMenuService.selectLeftPanel(panel);
  }

  selectMiddlePanel(panel: MiddlePanel) {
    this.noctuaCommonMenuService.selectMiddlePanel(panel);
  }


  openRightDrawer(panel) {
    this.noctuaCommonMenuService.selectRightPanel(panel);
    this.noctuaCommonMenuService.openRightDrawer();
  }

  toggleLeftDrawer(panel) {
    this.noctuaCommonMenuService.toggleLeftDrawer(panel);
  }

  createModel(type: WorkbenchId) {
    this.noctuaCommonMenuService.createModel(type);
  }

  getTableWidth(settings: SettingsOptions) {
    let width = 500;

    if (settings.showEvidence) {
      width += settings.showEvidenceCode ? 150 : 0
      width += settings.showReference ? 100 : 0
      width += settings.showWith ? 100 : 0
      width += settings.showGroup ? 100 : 0
      width += settings.showContributor ? 100 : 0

    }

    return width + 'px'
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }
}
