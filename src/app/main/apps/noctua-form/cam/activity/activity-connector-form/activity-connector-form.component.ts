import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { Subscription, Subject } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import {
  ConnectorActivity,
  ConnectorState,
  ActivityNode,
  NoctuaActivityConnectorService,
  NoctuaActivityFormService,
  NoctuaFormConfigService,
  NoctuaUserService,
  ConnectorType,
  FormType
} from '@geneontology/noctua-form-base';
import { NoctuaFormDialogService } from '../../../services/dialog.service';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'noc-activity-connector',
  templateUrl: './activity-connector-form.component.html',
  styleUrls: ['./activity-connector-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatSidenavModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatAutocompleteModule,
    FontAwesomeModule
  ]
})
export class ActivityConnectorFormComponent implements OnInit, OnDestroy {
  noctuaActivityConnectorService = inject(NoctuaActivityConnectorService);
  noctuaUserService = inject(NoctuaUserService);
  private noctuaFormDialogService = inject(NoctuaFormDialogService);
  noctuaFormConfigService = inject(NoctuaFormConfigService);
  noctuaActivityFormService = inject(NoctuaActivityFormService);

  ConnectorType = ConnectorType

  @Input()
  panelDrawer: MatDrawer;

  @Input() public closeDialog: () => void;

  connectorState = ConnectorState;
  currentConnectorActivity: ConnectorActivity;
  connectorActivity: ConnectorActivity;
  mfNode: ActivityNode;
  connectorFormGroup: FormGroup;
  connectorFormSub: Subscription;
  searchCriteria: any = {};
  evidenceFormArray: FormArray;
  relationshipOptions;
  displayChemicalConnector = false;

  private _unsubscribeAll: Subject<any>;

  constructor() {
    this._unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
    this.connectorFormSub = this.noctuaActivityConnectorService.connectorFormGroup$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(connectorFormGroup => {
        if (!connectorFormGroup) {
          return;
        }
        this.connectorFormGroup = connectorFormGroup;
        this.connectorActivity = this.noctuaActivityConnectorService.connectorActivity;
        this.relationshipOptions = this.noctuaFormConfigService[this.connectorActivity.connectorType + 'Relationship']['options']

      });

    this.displayChemicalConnector = this.canConnectViaChemicals();

  }

  private canConnectViaChemicals(): boolean {

    return this.connectorActivity.connectorType === ConnectorType.ACTIVITY_ACTIVITY &&
      (this.connectorActivity.subjectNode.chemicalParticipants?.length > 0 ||
        this.connectorActivity.objectNode.chemicalParticipants?.length > 0);
  }

  openChemicalConnectorForm() {
    if (this.closeDialog) {
      this.closeDialog();
    }
    this.noctuaFormDialogService.openCreateActivityDialog(FormType.CHEMICAL_CONNECTOR);

  }

  save() {
    const self = this;
    this.noctuaActivityConnectorService.saveActivity().then(() => {
      self.noctuaFormDialogService.openInfoToast('Causal relation successfully created.', 'OK');

      this.noctuaActivityConnectorService.initializeForm(
        self.noctuaActivityConnectorService.subjectActivity.id, self.noctuaActivityConnectorService.objectActivity.id)
      if (this.closeDialog) {
        this.closeDialog();
      }
    });
  }

  close() {
    if (this.panelDrawer) {
      this.panelDrawer.close();
    }
    if (this.closeDialog) {
      this.closeDialog();
    }
  }

  termDisplayFn(term): string | undefined {
    return term && term.id ? `${term.label} (${term.id})` : undefined;
  }

  evidenceDisplayFn(evidence): string | undefined {
    return evidence && evidence.id ? `${evidence.label} (${evidence.id})` : undefined;
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }
}
