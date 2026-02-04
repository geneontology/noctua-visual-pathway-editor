import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';

import { NoctuaFormConfigService } from '@geneontology/noctua-form-base';

import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
    selector: 'app-before-save',
    templateUrl: './before-save.component.html',
    styleUrls: ['./before-save.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatDialogModule,
        MatToolbarModule,
        FontAwesomeModule,
    ],
})
export class BeforeSaveDialogComponent implements OnInit, OnDestroy {
  private _unsubscribeAll: Subject<any>;
  searchForm: FormGroup;
  searchFormData: any = {};
  cam: any = {};

  constructor(
    private _matDialogRef: MatDialogRef<BeforeSaveDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private _data: any,
    public noctuaFormConfigService: NoctuaFormConfigService) {
    this._unsubscribeAll = new Subject();

    this.cam = this._data.cam
    this.searchForm = this.createAnswerForm();
  }

  ngOnInit() {
  }

  close() {
    this._matDialogRef.close();
  }

  createAnswerForm() {
    return new FormGroup({
      annotatedEntity: new FormControl(this.cam.annotatedEntity.id),
      term: new FormControl(this.cam.term.id),
      evidence: new FormControl(this.cam.evidence.id),
      reference: new FormControl(this.cam.reference.label),
      with: new FormControl(this.cam.with),
    });
  }

  ngOnDestroy(): void {

    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

}
