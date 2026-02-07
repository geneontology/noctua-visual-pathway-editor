import { ChangeDetectorRef, Component, Input, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule, MatDrawer } from '@angular/material/sidenav';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { Subject } from 'rxjs';

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
  ActivityNode
} from '@geneontology/noctua-form-base';

import { EditorCategory } from '@noctua.editor/models/editor-category';
import { takeUntil } from 'rxjs/operators';
import { NoctuaConfirmDialogService } from '@noctua/components/confirm-dialog/confirm-dialog.service';
import { NoctuaFormDialogService } from '../../noctua-form';
import { NoctuaCommonMenuService } from '@noctua.common/services/noctua-common-menu.service';
import { NoctuaFormModule } from '../../noctua-form/noctua-form.module';

@Component({
    selector: 'noc-graph-activity-table',
    templateUrl: './activity-table.component.html',
    styleUrls: ['./activity-table.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatSidenavModule,
        FontAwesomeModule,
        NoctuaFormModule
    ]
})
export class ActivityTableComponent implements OnInit, OnDestroy {
  private ngZone = inject(NgZone);
  private changeDetectorRef = inject(ChangeDetectorRef);
  camService = inject(CamService);
  noctuaCommonMenuService = inject(NoctuaCommonMenuService);
  noctuaUserService = inject(NoctuaUserService);
  noctuaFormConfigService = inject(NoctuaFormConfigService);
  noctuaActivityEntityService = inject(NoctuaActivityEntityService);
  noctuaActivityFormService = inject(NoctuaActivityFormService);
  private confirmDialogService = inject(NoctuaConfirmDialogService);
  private noctuaFormDialogService = inject(NoctuaFormDialogService);

  EditorCategory = EditorCategory;
  ActivityType = ActivityType;
  activityTypeOptions = noctuaFormConfig.activityType.options;

  @Input() options: any = {};
  @Input() panelDrawer: MatDrawer;
  @Input() cam: Cam;

  activity: Activity

  gpNode: ActivityNode;
  nodes: ActivityNode[] = [];
  editableTerms = false;
  currentMenuEvent: any = {};

  private _unsubscribeAll: Subject<any>;

  constructor() {

    this._unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
    this.camService.onSelectedActivityChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((activity: Activity) => {
        if (!activity) {
          return;
        }
        this.activity = null

        setTimeout(() => {
          this.activity = activity
        }, 100);

      });

  }

  deleteActivity(activity: Activity) {
    const self = this;

    const success = () => {
      this.camService.deleteActivity(activity).then(() => {
        this.camService.onSelectedActivityChanged.next(null);
        this.noctuaCommonMenuService.closeRightDrawer();
        this.camService.getCam(this.cam.id);
        self.noctuaFormDialogService.openInfoToast('Successfully deleted.', 'OK');
      });
    };

    if (!self.noctuaUserService.user) {
      this.confirmDialogService.openConfirmDialog('Not Logged In',
        'Please log in to continue.',
        null);
    } else {
      this.confirmDialogService.openConfirmDialog('Confirm Delete?',
        'You are about to delete an activity.',
        success);
    }
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  close() {
    this.panelDrawer.close();
  }
}
