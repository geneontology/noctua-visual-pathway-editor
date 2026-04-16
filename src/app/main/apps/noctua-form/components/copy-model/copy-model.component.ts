import { Component, Input, OnInit, OnDestroy, NgZone } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  Cam,
  NoctuaUserService,
  NoctuaFormConfigService,
  NoctuaGraphService,
  CamService,
} from '@geneontology/noctua-form-base';
import { NoctuaFormDialogService } from '../../services/dialog.service';
import { NoctuaCommonMenuService } from '@noctua.common/services/noctua-common-menu.service';
import { LeftPanel } from '@noctua.common/models/menu-panels';


@Component({
  selector: 'noc-copy-model',
  templateUrl: './copy-model.component.html',
  styleUrls: ['./copy-model.component.scss'],
})

export class CopyModelComponent implements OnInit, OnDestroy {

  @Input('panelDrawer') panelDrawer: MatDrawer;
  @Input('panelSide') panelSide: string
  cam: Cam;
  loading = false;
  includeEvidence = false;

  duplicatedCam;

  private _unsubscribeAll: Subject<any>;

  constructor(public noctuaUserService: NoctuaUserService,
    private ngZone: NgZone,
    private camService: CamService,
    private noctuaGraphService: NoctuaGraphService,
    private noctuaFormDialogService: NoctuaFormDialogService,
    public noctuaFormConfigService: NoctuaFormConfigService,
    public noctuaCommonMenuService: NoctuaCommonMenuService
  ) {
    this._unsubscribeAll = new Subject();
    // this.activity = self.noctuaCamFormService.activity;
    //  this.camFormPresentation = this.noctuaCamFormService.activityPresentation;
  }

  ngOnInit(): void {
    this.noctuaGraphService.onCamChanged
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

    const self = this;

    const success = (value) => {
      if (value) {
        this.loading = true;
        this.camService.copyModel(this.cam, value?.title, this.includeEvidence);
      } else {
        this.loading = false;
      };
    }

    this.noctuaFormDialogService.openConfirmCopyModelDialog(self.cam, success);
  }

  close() {
    this.noctuaCommonMenuService.selectLeftPanel(LeftPanel.camForm);
    this.panelDrawer.close();
  }

}
