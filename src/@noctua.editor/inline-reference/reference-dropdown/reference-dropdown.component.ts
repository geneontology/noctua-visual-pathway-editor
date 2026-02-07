import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import {
  NoctuaFormConfigService,
  NoctuaActivityFormService,
  ActivityError,
  noctuaFormConfig,
  Article,
  NoctuaLookupService,
  ErrorLevel,
  ErrorType
} from '@geneontology/noctua-form-base';

import { referenceDropdownData } from './reference-dropdown.tokens';
import { ReferenceDropdownOverlayRef } from './reference-dropdown-ref';
import { NoctuaFormDialogService } from 'app/main/apps/noctua-form';

@Component({
  selector: 'noc-reference-dropdown',
  templateUrl: './reference-dropdown.component.html',
  styleUrls: ['./reference-dropdown.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    FontAwesomeModule
  ]
})

export class NoctuaReferenceDropdownComponent implements OnInit, OnDestroy {
  dialogRef = inject(ReferenceDropdownOverlayRef);
  data = inject(referenceDropdownData);
  private noctuaLookupService = inject(NoctuaLookupService);
  private noctuaFormDialogService = inject(NoctuaFormDialogService);
  noctuaFormConfigService = inject(NoctuaFormConfigService);
  noctuaActivityFormService = inject(NoctuaActivityFormService);

  evidenceDBForm: FormGroup;
  formControl: FormControl;
  article: Article;

  private _unsubscribeAll: Subject<any>;

  constructor() {
    const data = this.data;

    this._unsubscribeAll = new Subject();
    this.formControl = data.formControl;
  }

  ngOnInit(): void {
    this.evidenceDBForm = this._createEvidenceDBForm();
    this._onValueChange();
  }

  clearValues() {

  }

  save() {
    const db = this.evidenceDBForm.value.db;
    const accession = this.evidenceDBForm.value.accession;
    const errors = [];
    let canSave = true;

    if (accession.trim() === '') {
      const error = new ActivityError(ErrorLevel.error, ErrorType.general, `${db.name} accession is required`);
      errors.push(error);
      this.noctuaFormDialogService.openActivityErrorsDialog(errors);
      canSave = false;
    }

    if (canSave) {
      this.formControl.setValue(db.name + ':' + accession.trim());
      this.close();
    }
  }

  cancelEvidenceDb() {
    this.evidenceDBForm.controls['accession'].setValue('');
  }

  private _createEvidenceDBForm() {
    return new FormGroup({
      db: new FormControl(this.noctuaFormConfigService.evidenceDBs.selected),
      accession: new FormControl('',
        [
          Validators.required,
        ])
    });
  }

  private _onValueChange() {
    this.evidenceDBForm.valueChanges.pipe(
      takeUntil(this._unsubscribeAll),
      distinctUntilChanged(),
      debounceTime(1000)
    ).subscribe(data => {
      this.article = null;
      this._updateArticle(data);
    });
  }

  close() {
    this.dialogRef.close();
  }

  private _updateArticle(value) {
    if (value.db.name === noctuaFormConfig.evidenceDB.options.pmid.name && value.accession) {
      const pmid = value.accession.trim();

      if (pmid === '') {
        return;
      }
      this.noctuaLookupService.getPubmedInfo(pmid).pipe(
        takeUntil(this._unsubscribeAll))
        .subscribe((article: Article) => {
          this.article = article;
        });
    }
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }
}
