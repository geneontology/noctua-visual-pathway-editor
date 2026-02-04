import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { Cam, NoctuaFormConfigService } from '@geneontology/noctua-form-base';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
    selector: 'app-confirm-copy-model',
    templateUrl: './confirm-copy-model.component.html',
    styleUrls: ['./confirm-copy-model.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        FontAwesomeModule,
    ],
})
export class ConfirmCopyModelDialogComponent implements OnInit, OnDestroy {
  private _unsubscribeAll: Subject<any>;
  camForm: FormGroup;
  cam: Cam

  constructor(
    private _matDialogRef: MatDialogRef<ConfirmCopyModelDialogComponent>,
    public noctuaFormConfigService: NoctuaFormConfigService,
    @Inject(MAT_DIALOG_DATA) private _data: any,
  ) {
    this._unsubscribeAll = new Subject();
    this.cam = _data.cam

    this.camForm = this.createCamForm(this.cam);
  }

  ngOnInit() { }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  createCamForm(cam: Cam) {
    return new FormGroup({
      title: new FormControl('Copy of ' + cam?.title),
    });
  }


  save() {
    const value = this.camForm.value
    this._matDialogRef.close(value);
  }

  close() {
    this._matDialogRef.close();
  }
}
