import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
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
        MatMenuModule,
        MatTooltipModule,
        FontAwesomeModule
    ]
})
export class CamToolbarComponent implements OnInit, OnDestroy {

  ActivityType = ActivityType
  LeftPanel = LeftPanel;
  MiddlePanel = MiddlePanel;
  RightPanel = RightPanel;

  @Input() public cam: Cam;
  @Input('options') public camToolbarOptions: CamToolbarOptions;


  private _unsubscribeAll: Subject<any>;

  constructor(
    private camService: CamService,

    public noctuaActivityFormService: NoctuaActivityFormService,
    public noctuaFormConfigService: NoctuaFormConfigService,
    public noctuaCommonMenuService: NoctuaCommonMenuService,
  ) {
    this._unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
  }

  openLeftDrawer(panel) {
    this.noctuaCommonMenuService.selectLeftPanel(panel);
  }

  selectMiddlePanel(panel: MiddlePanel) {
    const self = this;
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
    this.noctuaCommonMenuService.selectLeftPanel(LeftPanel.camForm);
    this.noctuaCommonMenuService.closeRightDrawer();
    this.noctuaCommonMenuService.openLeftDrawer();
  }

  openCopyModel() {
    this.noctuaCommonMenuService.selectLeftPanel(LeftPanel.copyModel);
    this.noctuaCommonMenuService.closeRightDrawer();
    this.noctuaCommonMenuService.openLeftDrawer();
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
