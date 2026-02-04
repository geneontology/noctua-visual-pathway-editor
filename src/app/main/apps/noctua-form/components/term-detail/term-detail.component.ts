import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';

import {
  NoctuaFormConfigService,
  Entity,
} from '@geneontology/noctua-form-base';

import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
    selector: 'noc-term-details',
    templateUrl: './term-detail.component.html',
    styleUrls: ['./term-detail.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        FontAwesomeModule,
    ],
})

export class NoctuaTermDetailComponent implements OnInit, OnDestroy {

  @Input() termData: any = {}
  evidenceDBForm: FormGroup;
  formControl: FormControl;
  termDetail

  private _unsubscribeAll: Subject<any>;

  constructor(
    public noctuaFormConfigService: NoctuaFormConfigService,
  ) {
    this._unsubscribeAll = new Subject();
    this.formControl = this.termData.formControl;
    this.termDetail = this.termData.termDetail;

  }

  ngOnInit(): void {
  }

  useTerm(term: Entity) {
    this.formControl.setValue(term);
  }

  close() {
    // this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }
}
