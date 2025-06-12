import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormArray } from '@angular/forms';
import { MatDrawer } from '@angular/material/sidenav';
import { Subscription, Subject } from 'rxjs';

import {
  Activity,
  ConnectorActivity,
  ConnectorState,
  ActivityNode,
  NoctuaActivityConnectorService,
  NoctuaActivityFormService,
  NoctuaFormConfigService,
  NoctuaUserService,
  ConnectorType
} from '@geneontology/noctua-form-base';
import { NoctuaFormDialogService } from '../../../services/dialog.service';
import { NoctuaConfirmDialogService } from '@noctua/components/confirm-dialog/confirm-dialog.service';
import { takeUntil } from 'rxjs/operators';
import { DataUtils } from '@noctua.form/data/config/data-utils';

@Component({
  selector: 'noc-chemical-connector-form',
  templateUrl: './chemical-connector-form.component.html',
  styleUrls: ['./chemical-connector-form.component.scss']
})
export class ChemicalConnectorFormComponent implements OnInit, OnDestroy {
  ConnectorType = ConnectorType

  @Input('panelDrawer')
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

  allSelected: boolean = false;

  items = []
  commonItems = []
  subjectItems = []
  objectItems = []

  private _unsubscribeAll: Subject<any>;

  constructor(
    private confirmDialogService: NoctuaConfirmDialogService,
    public noctuaActivityConnectorService: NoctuaActivityConnectorService,
    public noctuaUserService: NoctuaUserService,
    private noctuaFormDialogService: NoctuaFormDialogService,
    public noctuaFormConfigService: NoctuaFormConfigService,
    public noctuaActivityFormService: NoctuaActivityFormService,
  ) {
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

        this.commonItems = DataUtils.findCommonItems(
          this.connectorActivity.subjectNode.chemicalParticipants,
          this.connectorActivity.objectNode.chemicalParticipants)


        this.subjectItems = DataUtils.findItemsNotInB(this.connectorActivity.subjectNode.chemicalParticipants,
          this.connectorActivity.objectNode.chemicalParticipants)

        this.objectItems = DataUtils.findItemsNotInB(this.connectorActivity.objectNode.chemicalParticipants,
          this.connectorActivity.subjectNode.chemicalParticipants)


        this.items = [...this.commonItems, ...this.subjectItems, ...this.objectItems];

      });


  }

  updateAllSelected() {
    this.allSelected = this.items.every(item => item.selected);
  }

  selectAll() {
    this.allSelected = !this.allSelected;
    this.items.forEach(item => item.selected = this.allSelected);
  }

  getSelectedItems(): any[] {
    return this.items.filter(item => item.selected);
  }

  onItemChangeOld() {
    this.updateAllSelected();
  }

  onItemChange() {

    this.updateAllSelected();
  }

  openActivityConnector(connector: Activity) {
    this.noctuaActivityConnectorService.initializeForm(this.noctuaActivityConnectorService.objectActivity.id, connector.id);
  }


  save() {
    this.noctuaActivityConnectorService.saveChemicalParticipants(this.connectorActivity.subjectNode, this.connectorActivity.objectNode, this.getSelectedItems())
      .subscribe(() => {
        this.noctuaFormDialogService.openInfoToast('Chemical Reactions created.', 'OK');

        this.noctuaActivityConnectorService.initializeForm(
          this.noctuaActivityConnectorService.subjectActivity.id, this.noctuaActivityConnectorService.objectActivity.id)
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


  evidenceDisplayFn(evidence): string | undefined {
    return evidence && evidence.id ? `${evidence.label} (${evidence.id})` : undefined;
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }
}
