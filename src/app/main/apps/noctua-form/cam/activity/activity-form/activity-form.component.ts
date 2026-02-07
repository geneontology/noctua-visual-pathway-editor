import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { Subscription, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { NoctuaFormDialogService } from './../../../services/dialog.service';
import {
  Cam,
  Activity,
  NoctuaActivityFormService,
  NoctuaFormConfigService,
  ActivityState,
  ActivityType,
  NoctuaUserService,
} from '@geneontology/noctua-form-base';
import { EntityFormComponent } from './entity-form/entity-form.component';

@Component({
  selector: 'noc-activity-form',
  templateUrl: './activity-form.component.html',
  styleUrls: ['./activity-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatSidenavModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    FontAwesomeModule,
    EntityFormComponent
  ]
})

export class ActivityFormComponent implements OnInit, OnDestroy {
  private noctuaFormDialogService = inject(NoctuaFormDialogService);
  noctuaUserService = inject(NoctuaUserService);
  noctuaFormConfigService = inject(NoctuaFormConfigService);
  noctuaActivityFormService = inject(NoctuaActivityFormService);

  ActivityState = ActivityState;
  ActivityType = ActivityType;

  @Input()
  panelDrawer: MatDrawer;

  @Input() public closeDialog: () => void;

  resizeStyle = {};

  cam: Cam;
  activityFormGroup: FormGroup;
  activityFormSub: Subscription;
  molecularEntity: FormGroup;
  searchCriteria: any = {};
  activityFormPresentation: any;
  evidenceFormArray: FormArray;
  activityFormData: any = [];
  activity: Activity;
  currentActivity: Activity;
  state: ActivityState;

  descriptionSectionTitle = 'Function Description';
  annotatedSectionTitle = 'Gene Product';

  private _unsubscribeAll: Subject<any>;

  constructor() {
    this._unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
    this.activityFormSub = this.noctuaActivityFormService.activityFormGroup$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(activityFormGroup => {
        if (!activityFormGroup) {
          return;
        }

        this.activityFormGroup = activityFormGroup;
        this.currentActivity = this.noctuaActivityFormService.currentActivity;
        this.activity = this.noctuaActivityFormService.activity;
        this.state = this.noctuaActivityFormService.state;
        this.molecularEntity = this.activityFormGroup.get('molecularEntity') as FormGroup;

        if (this.activity.activityType === ActivityType.ccOnly) {
          this.descriptionSectionTitle = 'Localization Description';
        } else if (this.activity.activityType === ActivityType.molecule) {
          this.annotatedSectionTitle = 'Chemical';
          this.descriptionSectionTitle = 'Location (optional)';
        } else {
          this.descriptionSectionTitle = 'Function Description';
        }
      });
  }

  checkErrors() {
    const errors = this.noctuaActivityFormService.activity.submitErrors;
    this.noctuaFormDialogService.openActivityErrorsDialog(errors);
  }

  save() {
    this.noctuaActivityFormService.saveActivity().subscribe(() => {
      this.noctuaFormDialogService.openInfoToast('Successfully created.', 'OK');
      this.noctuaActivityFormService.clearForm();
      if (this.closeDialog) {
        this.closeDialog();
      }
    });
  }

  showAllowedWithDatabases(event) {
    event.stopPropagation();
    this.noctuaFormDialogService.openAllowedWithDatabasesDialog();
  }

  showAllowedReferenceDatabases(event) {
    event.stopPropagation();
    this.noctuaFormDialogService.openAllowedReferenceDatabasesDialog();
  }

  clear() {
    this.noctuaActivityFormService.clearForm();
  }

  createExample() {
    this.noctuaActivityFormService.initializeFormData();
  }

  termDisplayFn(term): string | undefined {
    return term ? term.label : undefined;
  }

  close() {

    if (this.panelDrawer) {
      this.panelDrawer.close();
    }
    if (this.closeDialog) {
      this.closeDialog();
    }

  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }
}
