import { Component, Input, OnInit, OnDestroy, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import {
  Cam,
  NoctuaUserService,
  NoctuaFormConfigService,
  CamService,
} from '@geneontology/noctua-form-base';
import { NoctuaFormDialogService } from '../../services/dialog.service';
import { NoctuaCommonMenuService } from '@noctua.common/services/noctua-common-menu.service';
import { LeftPanel } from '@noctua.common/models/menu-panels';


@Component({
    selector: 'noc-copy-model',
    templateUrl: './copy-model.component.html',
    styleUrls: ['./copy-model.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,
        MatSidenavModule,
        MatTooltipModule,
        FontAwesomeModule
    ]
})

export class CopyModelComponent implements OnInit, OnDestroy {
  noctuaUserService = inject(NoctuaUserService);
  private ngZone = inject(NgZone);
  private camService = inject(CamService);
  private noctuaFormDialogService = inject(NoctuaFormDialogService);
  noctuaFormConfigService = inject(NoctuaFormConfigService);
  noctuaCommonMenuService = inject(NoctuaCommonMenuService);


  @Input() panelDrawer: MatDrawer;
  @Input() panelSide: string
  cam: Cam;
  loading = false;
  includeEvidence = false;

  duplicatedCam;

  private _unsubscribeAll: Subject<any>;

  constructor() {
    this._unsubscribeAll = new Subject();
    // this.activity = self.noctuaCamFormService.activity;
    //  this.camFormPresentation = this.noctuaCamFormService.activityPresentation;
  }

  ngOnInit(): void {
    this.camService.onCamChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((cam) => {
        if (!cam) {
          return;
        }

        this.cam = cam;
      });

    this.camService.onCopyModelChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((cam) => {
        this.loading = false;

        this.ngZone.run(() => {
          this.duplicatedCam = cam
        });
      });
  }

  ngOnDestroy(): void {
    this.camService.onCopyModelChanged.next(null)
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  copyModel() {
    const success = (value) => {
      if (value) {
        this.loading = true;
        this.camService.copyModel(this.cam, value?.title, this.includeEvidence);
      } else {
        this.loading = false;
      };
    }

    this.noctuaFormDialogService.openConfirmCopyModelDialog(this.cam, success);
  }

  close() {
    this.noctuaCommonMenuService.selectLeftPanel(LeftPanel.camForm);
    this.panelDrawer.close();
  }

}
