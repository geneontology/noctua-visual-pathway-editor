import { Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { Subject } from 'rxjs';

import {
  NoctuaFormConfigService,
  Entity,
} from '@geneontology/noctua-form-base';

import { detailDropdownData } from './detail-dropdown.tokens';
import { DetailDropdownOverlayRef } from './detail-dropdown-ref';
import { NoctuaFormDialogService } from 'app/main/apps/noctua-form';

@Component({
  selector: 'noc-detail-dropdown',
  templateUrl: './detail-dropdown.component.html',
  styleUrls: ['./detail-dropdown.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatListModule,
    FontAwesomeModule
  ]
})

export class NoctuaDetailDropdownComponent implements OnDestroy {
  dialogRef = inject(DetailDropdownOverlayRef);
  data = inject(detailDropdownData);
  private noctuaFormDialogService = inject(NoctuaFormDialogService);
  noctuaFormConfigService = inject(NoctuaFormConfigService);

  evidenceDBForm: FormGroup;
  formControl: FormControl;
  termDetail

  private _unsubscribeAll: Subject<any>;

  constructor() {
    const data = this.data;

    this._unsubscribeAll = new Subject();
    this.formControl = data.formControl;
    this.termDetail = data.termDetail;

  }

  save() {
    const db = this.evidenceDBForm.value.db;
    const accession = this.evidenceDBForm.value.accession;
    const errors = [];
    let canSave = true;

    if (accession.trim() === '') {
      this.noctuaFormDialogService.openActivityErrorsDialog(errors);
      canSave = false;
    }

    if (canSave) {
      this.formControl.setValue(db.name + ':' + accession.trim());
      this.close();
    }
  }

  useTerm(term: Entity) {
    this.formControl.setValue(term);
  }

  cancelEvidenceDb() {
    this.evidenceDBForm.controls['accession'].setValue('');
  }

  close() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }
}
