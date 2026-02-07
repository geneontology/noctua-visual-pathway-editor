import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { Subscription, Subject } from 'rxjs';

import {
  Cam,
  Activity,
  ConnectorActivity,
  ConnectorState,
  ActivityNode,
  NoctuaActivityConnectorService,
  NoctuaActivityFormService,
  NoctuaFormConfigService,
  NoctuaUserService,
  ConnectorType,
  NoctuaActivityEntityService,
  CamService,
  NoctuaGraphService
} from '@geneontology/noctua-form-base';
import { NoctuaConfirmDialogService } from '@noctua/components/confirm-dialog/confirm-dialog.service';
import { takeUntil } from 'rxjs/operators';
import { TableOptions } from '@noctua.common/models/table-options';
import { NoctuaFormDialogService } from 'app/main/apps/noctua-form';
import { SettingsOptions } from '@noctua.common/models/graph-settings';
import { NoctuaCommonMenuService } from '@noctua.common/services/noctua-common-menu.service';
import { NoctuaFormModule } from '../../noctua-form/noctua-form.module';

@Component({
  selector: 'noc-activity-connector-table',
  templateUrl: './activity-connector-table.component.html',
  styleUrls: ['./activity-connector-table.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatSelectModule,
    MatFormFieldModule,
    FontAwesomeModule,
    NoctuaFormModule
  ]
})
export class ActivityConnectorTableComponent implements OnInit, OnDestroy {
  private confirmDialogService = inject(NoctuaConfirmDialogService);
  private _camService = inject(CamService);
  private _noctuaGraphService = inject(NoctuaGraphService);
  noctuaActivityConnectorService = inject(NoctuaActivityConnectorService);
  noctuaUserService = inject(NoctuaUserService);
  private noctuaFormDialogService = inject(NoctuaFormDialogService);
  noctuaFormConfigService = inject(NoctuaFormConfigService);
  noctuaActivityFormService = inject(NoctuaActivityFormService);
  private noctuaCommonMenuService = inject(NoctuaCommonMenuService);
  noctuaActivityEntityService = inject(NoctuaActivityEntityService);

  ConnectorType = ConnectorType

  @Input()
  panelDrawer: MatDrawer;

  @Input() cam: Cam
  @Input() activity: Activity

  evidenceOptions: TableOptions = {
    editableEvidence: true,
    editableReference: true,
    editableWith: true,
    showEvidenceMenu: true,
    showAddEvidenceButton: true
  };


  @Input() public closeDialog: () => void;

  settings: SettingsOptions = new SettingsOptions()

  connectorState = ConnectorState;
  currentConnectorActivity: ConnectorActivity;
  connectorActivity: ConnectorActivity;
  mfNode: ActivityNode;
  connectorFormGroup: FormGroup;
  connectorFormSub: Subscription;
  searchCriteria: any = {};
  evidenceFormArray: FormArray;

  private _unsubscribeAll: Subject<any>;
  relationshipOptions: any;

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
        this.currentConnectorActivity = this.noctuaActivityConnectorService.currentConnectorActivity;
        this.connectorActivity = this.noctuaActivityConnectorService.connectorActivity;
        this.relationshipOptions = this.noctuaFormConfigService[this.connectorActivity.connectorType + 'Relationship']['options']

      });

    this.noctuaCommonMenuService.onCamSettingsChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((settings: SettingsOptions) => {
        if (!settings) {
          return;
        }
        this.settings = settings;
      });

    this._noctuaGraphService.onCamGraphChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((cam: Cam) => {
        if (!cam || cam.id !== this.cam.id) {
          return;
        }
        this.cam = cam;
        // Re-initialize the connector form to refresh evidence data
        if (this.noctuaActivityConnectorService.subjectActivity &&
          this.noctuaActivityConnectorService.objectActivity) {
          this.noctuaActivityConnectorService.initializeForm(
            this.noctuaActivityConnectorService.subjectActivity.id,
            this.noctuaActivityConnectorService.objectActivity.id
          );
        }
      });

  }

  openActivityConnector(connector: Activity) {
    this.noctuaActivityConnectorService.initializeForm(this.noctuaActivityConnectorService.objectActivity.id, connector.id);
  }

  save() {
    this.noctuaActivityConnectorService.saveActivity().then(() => {
      this.noctuaFormDialogService.openInfoToast('Causal relation successfully created.', 'OK');

      this.noctuaActivityConnectorService.initializeForm(
        this.noctuaActivityConnectorService.subjectActivity.id, this.noctuaActivityConnectorService.objectActivity.id)
      if (this.closeDialog) {
        this.closeDialog();
      }
    });
  }

  editActivity() {
    const success = () => {
      this.noctuaActivityConnectorService.saveActivity().then(() => {
        this.noctuaFormDialogService.openInfoToast('Causal relation successfully updated.', 'OK');
      });
    };

    this.confirmDialogService.openConfirmDialog('Confirm Delete?',
      'You are about to remove the causal relation',
      success);
  }

  deleteConnectorEdge() {
    const success = () => {
      this.noctuaActivityConnectorService.deleteConnectorEdge(this.currentConnectorActivity).then(() => {
        this._camService.onSelectedActivityChanged.next(null);
        this.noctuaCommonMenuService.closeRightDrawer();
        this._camService.getCam(this.cam.id);
        this.noctuaFormDialogService.openInfoToast('Causal relation successfully deleted.', 'OK');
      });
    };

    this.confirmDialogService.openConfirmDialog('Confirm Delete?',
      'You are about to remove the causal relation',
      success);
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
