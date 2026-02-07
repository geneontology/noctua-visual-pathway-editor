import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';

import { ErrorLevel, ErrorType, NoctuaFormConfigService } from '@geneontology/noctua-form-base';

import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
    selector: 'app-cam-errors',
    templateUrl: './cam-errors.component.html',
    styleUrls: ['./cam-errors.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatDialogModule,
        MatToolbarModule,
        FontAwesomeModule,
    ],
})
export class CamErrorsDialogComponent implements OnInit, OnDestroy {
  private _matDialogRef = inject<MatDialogRef<CamErrorsDialogComponent>>(MatDialogRef);
  private _data = inject(MAT_DIALOG_DATA);
  noctuaFormConfigService = inject(NoctuaFormConfigService);

  ErrorType = ErrorType;
  ErrorLevel = ErrorLevel;
  private _unsubscribeAll: Subject<any>;
  errors

  constructor() {
    this._unsubscribeAll = new Subject();

    this.errors = this._data.errors

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
