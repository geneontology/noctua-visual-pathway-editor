import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';

import { FormType, NoctuaActivityFormService, NoctuaFormConfigService } from '@geneontology/noctua-form-base';

import { ActivityFormComponent } from '../../cam/activity/activity-form/activity-form.component';
import { ActivityConnectorFormComponent } from '../../cam/activity/activity-connector-form/activity-connector-form.component';
import { ChemicalConnectorFormComponent } from '../../cam/activity/chemical-connector-form/chemical-connector-form.component';

@Component({
    selector: 'app-create-activity-dialog',
    templateUrl: './create-activity.component.html',
    styleUrls: ['./create-activity.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ActivityFormComponent,
        ActivityConnectorFormComponent,
        ChemicalConnectorFormComponent,
    ],
})
export class CreateActivityDialogComponent implements OnInit, OnDestroy {
  FormType = FormType

  closeDialog: () => void;
  private _unsubscribeAll: Subject<any>;

  formType: FormType;

  constructor(
    private _matDialogRef: MatDialogRef<CreateActivityDialogComponent>,
    private activityFormService: NoctuaActivityFormService,
    @Inject(MAT_DIALOG_DATA) private _data: any,
    public noctuaFormConfigService: NoctuaFormConfigService) {
    this.closeDialog = this.close.bind(this);
    this._unsubscribeAll = new Subject();
    this.formType = _data.formType;
  }

  ngOnInit() {

  }

  close() {
    this._matDialogRef.close();
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

}
