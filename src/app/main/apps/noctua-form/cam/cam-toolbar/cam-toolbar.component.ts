import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import {
  Cam,
  NoctuaFormConfigService,
  CamService,
  ActivityType,
  NoctuaActivityFormService
} from '@geneontology/noctua-form-base';

import { NoctuaCommonMenuService } from '@noctua.common/services/noctua-common-menu.service';
import { NoctuaFormDialogService } from '../../services/dialog.service';
import { LeftPanel, MiddlePanel, RightPanel } from '@noctua.common/models/menu-panels';
import { WorkbenchId } from '@noctua.common/models/workench-id';
import { CamToolbarOptions } from '@noctua.common/models/cam-toolbar-options';

@Component({
    selector: 'noc-cam-toolbar',
    templateUrl: './cam-toolbar.component.html',
    styleUrls: ['./cam-toolbar.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatChipsModule,
        MatMenuModule,
        MatTooltipModule,
        FontAwesomeModule
    ]
})
export class CamToolbarComponent implements OnInit, OnDestroy {
  private camService = inject(CamService);
  private noctuaFormDialogService = inject(NoctuaFormDialogService);
  noctuaActivityFormService = inject(NoctuaActivityFormService);
  noctuaFormConfigService = inject(NoctuaFormConfigService);
  noctuaCommonMenuService = inject(NoctuaCommonMenuService);


  ActivityType = ActivityType
  LeftPanel = LeftPanel;
  MiddlePanel = MiddlePanel;
  RightPanel = RightPanel;

  @Input() public cam: Cam;
  @Input('options') public camToolbarOptions: CamToolbarOptions;


  private _unsubscribeAll: Subject<any>;

  constructor() {
    this._unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
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

  openCamForm() {
    this.camService.initializeForm(this.cam);
    this.noctuaFormDialogService.openCamFormDialog(this.cam);
  }

  openCopyModel() {
    this.noctuaFormDialogService.openCopyModelDialog(this.cam);
  }

  openCamErrors() {
    this.noctuaCommonMenuService.selectRightPanel(RightPanel.camErrors);
    this.noctuaCommonMenuService.closeLeftDrawer();
    this.noctuaCommonMenuService.openRightDrawer();
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }
}
