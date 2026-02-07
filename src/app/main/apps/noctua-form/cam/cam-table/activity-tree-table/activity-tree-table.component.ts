import { Component, Input, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTreeModule } from '@angular/material/tree';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { noctuaAnimations } from './../../../../../../../@noctua/animations';
import { NoctuaFormDialogService } from './../../../services/dialog.service';

import {
  NoctuaFormConfigService,
  NoctuaActivityFormService,
  NoctuaActivityEntityService,
  CamService,
  noctuaFormConfig,
  NoctuaUserService,
  ActivityType
} from '@geneontology/noctua-form-base';

import {
  Cam,
  Activity,
  ActivityNode,
  compareNodeWeight,
} from '@geneontology/noctua-form-base';

import { EditorCategory } from '@noctua.editor/models/editor-category';
import { NoctuaUtils } from '@noctua/utils/noctua-utils';
import { MatTableDataSource } from '@angular/material/table';
import { FlatTreeControl } from '@angular/cdk/tree';
import { ActivityFormTableNodeComponent } from '../activity-form-table/activity-form-table-node/activity-form-table-node.component';

@Component({
    selector: 'noc-activity-tree-table',
    templateUrl: './activity-tree-table.component.html',
    styleUrls: ['./activity-tree-table.component.scss'],
    animations: noctuaAnimations,
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatChipsModule,
        MatTreeModule,
        FontAwesomeModule,
        ActivityFormTableNodeComponent
    ]
})
export class ActivityTreeTableComponent implements OnInit, OnDestroy {
  camService = inject(CamService);
  noctuaUserService = inject(NoctuaUserService);
  noctuaFormConfigService = inject(NoctuaFormConfigService);
  private noctuaFormDialogService = inject(NoctuaFormDialogService);
  noctuaActivityEntityService = inject(NoctuaActivityEntityService);
  noctuaActivityFormService = inject(NoctuaActivityFormService);

  EditorCategory = EditorCategory;
  ActivityType = ActivityType;
  activityTypeOptions = noctuaFormConfig.activityType.options;
  dataSource: MatTableDataSource<ActivityNode>;

  @ViewChild('tree') tree;

  @Input()
  cam: Cam

  @Input()
  activity: Activity

  @Input()
  options: any = {};

  gpNode: ActivityNode;
  activeAnnotation: string = null;
  treeControl = new FlatTreeControl<ActivityNode>(
    node => node.treeLevel, node => node.expandable);

  private unsubscribeAll: Subject<any>;

  constructor() {

    this.dataSource = new MatTableDataSource<ActivityNode>();
    this.unsubscribeAll = new Subject();
  }

  ngOnInit(): void {

    this.gpNode = this.activity.getGPNode();

    this.dataSource.data = this.activity.nodes.sort(compareNodeWeight);
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next(null);
    this.unsubscribeAll.complete();
  }

  onTreeLoad() {
    this.tree.treeModel.expandAll();
  }

  hasChild = (_: number, node: ActivityNode) => node.expandable;


  toggleExpand(activity: Activity) {
    activity.expanded = !activity.expanded;
  }

  toggleNodeExpand(node: ActivityNode) {
    node.expanded = !node.expanded;
  }

  displayCamErrors() {
    const errors = this.cam.getViolationDisplayErrors();
    this.noctuaFormDialogService.openCamErrorsDialog(errors);
  }

  displayActivityErrors(activity: Activity) {
    const errors = activity.getViolationDisplayErrors();
    this.noctuaFormDialogService.openCamErrorsDialog(errors);
  }

  cleanId(dirtyId: string) {
    return NoctuaUtils.cleanID(dirtyId);
  }
}

