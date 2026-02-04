import { Component, Input, OnInit, OnDestroy } from '@angular/core';
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
import { ResizableModule, ResizeEvent } from 'angular-resizable-element';

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
        ResizableModule,
        EntityFormComponent
    ]
})

export class ActivityFormComponent implements OnInit, OnDestroy {
  ActivityState = ActivityState;
  ActivityType = ActivityType;

  @Input('panelDrawer')
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

  constructor(
    private noctuaFormDialogService: NoctuaFormDialogService,
    public noctuaUserService: NoctuaUserService,
    public noctuaFormConfigService: NoctuaFormConfigService,
    public noctuaActivityFormService: NoctuaActivityFormService
  ) {
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
        this.molecularEntity = <FormGroup>this.activityFormGroup.get('molecularEntity');

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

  resizeValidate(event: ResizeEvent): boolean {
    const MIN_DIMENSIONS_PX: number = 50;
    if (
      event.rectangle.width &&
      event.rectangle.height &&
      (event.rectangle.width < MIN_DIMENSIONS_PX ||
        event.rectangle.height < MIN_DIMENSIONS_PX)
    ) {
      return false;
    }
    return true;
  }

  onResizeEnd(event: ResizeEvent): void {
    this.resizeStyle = {
      // enable/disable these per your needs
      //position: 'fixed',
      //left: `${event.rectangle.left}px`,
      //top: `${event.rectangle.top}px`,
      //height: `${event.rectangle.height}px`,
      width: `${event.rectangle.width}px`,
    };
  }

  checkErrors() {
    const errors = this.noctuaActivityFormService.activity.submitErrors;
    this.noctuaFormDialogService.openActivityErrorsDialog(errors);
  }

  save() {
    const self = this;

    self.noctuaActivityFormService.saveActivity().subscribe(() => {
      self.noctuaFormDialogService.openInfoToast('Successfully created.', 'OK');
      self.noctuaActivityFormService.clearForm();
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
    const self = this;

    self.noctuaActivityFormService.initializeFormData();
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
