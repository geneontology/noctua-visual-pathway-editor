import { Component, Input, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';
import { MatMenuTrigger, MatMenuModule } from '@angular/material/menu';
import { Subject } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { NoctuaFormDialogService } from './../../../../services/dialog.service';
import {
  CamService,
  NoctuaFormConfigService,
  NoctuaActivityFormService,
  ActivityNode,
  Evidence,
  noctuaFormConfig,
  Entity,
  ShapeDefinition,
  ActivityError,
  ActivityNodeType,
  Activity,
  ErrorLevel,
  ErrorType,
  ActivityType
} from '@geneontology/noctua-form-base';
import { InlineReferenceService } from '@noctua.editor/inline-reference/inline-reference.service';
import { each, find } from 'lodash';
import { InlineWithService } from '@noctua.editor/inline-with/inline-with.service';
import { InlineDetailService } from '@noctua.editor/inline-detail/inline-detail.service';

@Component({
    selector: 'noc-entity-form',
    templateUrl: './entity-form.component.html',
    styleUrls: ['./entity-form.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatMenuModule,
        MatFormFieldModule,
        MatInputModule,
        MatAutocompleteModule,
        FontAwesomeModule
    ]
})

export class EntityFormComponent implements OnInit, OnDestroy {
  private noctuaFormDialogService = inject(NoctuaFormDialogService);
  private camService = inject(CamService);
  private inlineReferenceService = inject(InlineReferenceService);
  private inlineDetailService = inject(InlineDetailService);
  private inlineWithService = inject(InlineWithService);
  noctuaFormConfigService = inject(NoctuaFormConfigService);
  noctuaActivityFormService = inject(NoctuaActivityFormService);

  @Input()
  public entityFormGroup: FormGroup;

  @Input() public displayAddButton = false;

  @Input() public displayMenuButton = true;

  @ViewChild('evidenceDBreferenceMenuTrigger', { static: true, read: MatMenuTrigger })
  evidenceDBreferenceMenuTrigger: MatMenuTrigger;

  evidenceDBForm: FormGroup;
  evidenceFormArray: FormArray;
  entity: ActivityNode;
  selectedItemDisplay;
  friendNodes;
  friendNodesFlat;
  activityNodeType = ActivityNodeType;

  termData

  private unsubscribeAll: Subject<any>;

  get evidenceFormArrayControls(): FormArray {
    return this.entityFormGroup.get('evidenceFormArray') as FormArray;
  }

  constructor() {
    this.unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
    this.entity = this.noctuaActivityFormService.activity.getNode(this.entityFormGroup.get('id').value);
    this.friendNodes = this.camService.getNodesByType(this.entity.type);

    if (this.noctuaActivityFormService.activity.activityType === ActivityType.proteinComplex
      && this.entity.type === ActivityNodeType.GoProteinContainingComplex) {
      this.displayAddButton = true;
    }
    //  this.friendNodesFlat = this.camService.getNodesByTypeFlat(this.entity.type);
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next(null);
    this.unsubscribeAll.complete();
  }

  addEvidence() {
    this.entity.predicate.addEvidence();
    this.noctuaActivityFormService.initializeForm();
  }

  useTerm(node: ActivityNode, _activity: Activity) {
    this.entity.term = node.term;
    switch (this.entity.type) {
      case ActivityNodeType.GoBiologicalProcess:
      case ActivityNodeType.GoCellularComponent:
        this.entity.linkedNode = true;
        this.entity.uuid = node.uuid;
    }

    this.noctuaActivityFormService.initializeForm();
  }

  removeEvidence(index: number) {
    this.entity.predicate.removeEvidence(index);
    this.noctuaActivityFormService.initializeForm();
  }

  toggleIsComplement(entity: ActivityNode) {
    const errors = [];
    let canToggle = true;

    each(entity.nodeGroup.nodes, (node: ActivityNode) => {
      if (node.isExtension) {
        canToggle = false;
        const meta = {
          aspect: node.label
        };
        const error = new ActivityError(ErrorLevel.error, ErrorType.general,
          `Cannot add 'NOT Qualifier', Remove Extension'${node.label}'`, meta);
        errors.push(error);
      }
    });

    if (canToggle) {
      entity.toggleIsComplement();
      this.noctuaActivityFormService.initializeForm();
    } else {
      this.noctuaFormDialogService.openActivityErrorsDialog(errors);
    }
  }

  openSearchDatabaseDialog(entity: ActivityNode) {
    const gpNode = this.noctuaActivityFormService.activity.getGPNode();

    if (gpNode && gpNode.hasValue()) {
      const data = {
        readonly: false,
        gpNode: gpNode.term,
        aspect: entity.aspect,
        entity: entity,
        params: {
          term: '',
          evidence: ''
        }
      };

      const success = (selected) => {
        if (selected.term) {
          entity.term = new Entity(selected.term.term.id, selected.term.term.label);

          if (selected.evidences && selected.evidences.length > 0) {
            entity.predicate.setEvidence(selected.evidences);
          }


          this.noctuaActivityFormService.initializeForm();
        }
      };
      this.noctuaFormDialogService.openSearchDatabaseDialog(data, success);
    } else {
      const meta = {
        aspect: 'Gene Product'
      };
      const error = new ActivityError(ErrorLevel.error, ErrorType.general, 'Please enter a gene product', meta)
      this.noctuaFormDialogService.openActivityErrorsDialog([error])
    }
  }

  openSearchEvidenceDialog(entity: ActivityNode) {
    const gpNode = this.noctuaActivityFormService.activity.getGPNode();

    if (gpNode) {
      const data = {
        readonly: false,
        gpNode: gpNode.term,
        aspect: entity.aspect,
        entity: entity,
        params: {
          term: '',
          evidence: ''
        }
      };

      const success = (selected) => {
        if (selected && selected.evidences) {
          entity.predicate.setEvidence(selected.evidences);
          this.noctuaActivityFormService.initializeForm();
        }
      };
      this.noctuaFormDialogService.openSearchEvidenceDialog(data, success);
    } else {
      // const error = new ActivityError(ErrorLevel.error, ErrorType.general,  "Please enter a gene product", meta)
      //errors.push(error);
      // this.dialogService.openActivityErrorsDialog(ev, entity, errors)
    }
  }

  openSearchModels() {
    // Placeholder for future implementation
    // const searchCriteria = new SearchCriteria();
    // const gpNode = this.noctuaActivityFormService.activity.getGPNode();
    //searchCriteria.goterms.push(this.entity.term);

    // const url = this.noctuaFormConfigService.getUniversalWorkbenchUrl('noctua-search', searchCriteria.buildEncoded());


    // window.open(url, '_blank');

  }

  insertEntity(nodeDescription: ShapeDefinition.ShapeDescription) {
    this.noctuaFormConfigService.insertActivityNode(this.noctuaActivityFormService.activity, this.entity, nodeDescription);
    this.noctuaActivityFormService.initializeForm();
  }

  insertEntityShex(predExpr: ShapeDefinition.PredicateExpression) {
    this.noctuaFormConfigService.insertActivityNodeShex(this.noctuaActivityFormService.activity, this.entity, predExpr);
    this.noctuaActivityFormService.initializeForm();
  }

  addRootTerm() {
    const term = find(noctuaFormConfig.rootNode, (rootNode) => {
      return rootNode.aspect === this.entity.aspect;
    });

    if (term) {
      this.entity.term = new Entity(term.id, term.label);
      this.noctuaActivityFormService.initializeForm();

      const evidence = new Evidence();
      evidence.setEvidence(new Entity(
        noctuaFormConfig.evidenceAutoPopulate.nd.evidence.id,
        noctuaFormConfig.evidenceAutoPopulate.nd.evidence.label));
      evidence.reference = noctuaFormConfig.evidenceAutoPopulate.nd.reference;
      this.entity.predicate.setEvidence([evidence]);
      this.noctuaActivityFormService.initializeForm();
    }
  }

  addEvidenceISS() {
    const evidence = new Evidence();
    evidence.setEvidence(new Entity(
      noctuaFormConfig.evidenceAutoPopulate.iss.evidence.id,
      noctuaFormConfig.evidenceAutoPopulate.iss.evidence.label));
    evidence.reference = noctuaFormConfig.evidenceAutoPopulate.iss.reference;

    this.entity.predicate.setEvidence([evidence]);
    this.noctuaActivityFormService.initializeForm();
  }

  clearValues() {
    this.entity.clearValues();
    this.noctuaActivityFormService.initializeForm();
  }

  removeNode() {
    this.noctuaActivityFormService.activity.removeNode(this.entity);
    this.noctuaActivityFormService.initializeForm();
  }

  openSelectEvidenceDialog() {
    const evidences: Evidence[] = this.camService.getUniqueEvidence(this.noctuaActivityFormService.activity);
    const success = (selected) => {
      if (selected.evidences && selected.evidences.length > 0) {
        this.entity.predicate.setEvidence(selected.evidences);
        this.noctuaActivityFormService.initializeForm();
      }
    };

    this.noctuaFormDialogService.openSelectEvidenceDialog(evidences, success);
  }
  updateMenu(entity) {
    this.noctuaActivityFormService.initializeForm(entity.rootTypes);
  }

  updateTermList() {
    this.camService.updateTermList(this.noctuaActivityFormService.activity, this.entity);
  }

  updateEvidenceList() {
    this.camService.updateEvidenceList(this.noctuaActivityFormService.activity, this.entity);
  }

  updateReferenceList() {
    this.camService.updateReferenceList(this.noctuaActivityFormService.activity, this.entity);
  }

  updateWithList() {
    this.camService.updateWithList(this.noctuaActivityFormService.activity, this.entity);
  }

  openAddReference(event, evidence: FormGroup, name: string) {
    event.stopPropagation();
    const data = {
      formControl: evidence.controls[name] as FormControl,
    };
    this.inlineReferenceService.open(event.target, { data });
  }

  openAddWith(event, evidence: FormGroup, name: string) {
    event.stopPropagation();
    const data = {
      formControl: evidence.controls[name] as FormControl,
    };
    this.inlineWithService.open(event.target, { data });
  }

  unselectItemDisplay() {
    this.selectedItemDisplay = null;
  }

  openTermDetails(event, item) {
    event.stopPropagation();

    const data = {
      termDetail: item,
      formControl: this.entityFormGroup.controls['term'] as FormControl,
    };
    this.inlineDetailService.open(event.target, { data });

    //this.termData = data

  }

  termDisplayFn(term): string | undefined {
    return term && term.id ? `${term.label} (${term.id})` : undefined;
  }

  evidenceDisplayFn(evidence): string | undefined {
    return evidence && evidence.id ? `${evidence.label} (${evidence.id})` : undefined;
  }

  referenceDisplayFn(evidence: Evidence | string): string | undefined {
    if (typeof evidence === 'string') {
      return evidence;
    }

    return evidence && evidence.reference ? evidence.reference : undefined;
  }

  withDisplayFn(evidence: Evidence | string): string | undefined {
    if (typeof evidence === 'string') {
      return evidence;
    }

    return evidence && evidence.with ? evidence.with : undefined;
  }
}
