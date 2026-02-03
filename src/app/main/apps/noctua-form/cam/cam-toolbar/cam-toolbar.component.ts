import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
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
    standalone: false
})
export class CamToolbarComponent implements OnInit, OnDestroy {

  ActivityType = ActivityType
  LeftPanel = LeftPanel;
  MiddlePanel = MiddlePanel;
  RightPanel = RightPanel;

  @Input('cam') public cam: Cam;
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
