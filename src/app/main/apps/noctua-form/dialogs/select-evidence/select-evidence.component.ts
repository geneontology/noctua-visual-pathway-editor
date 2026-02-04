import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SelectionModel } from '@angular/cdk/collections';
import { CdkTableModule } from '@angular/cdk/table';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';

import {
  Evidence,
  NoctuaFormConfigService
} from '@geneontology/noctua-form-base';

import { noctuaAnimations } from '@noctua/animations';

import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSortModule } from '@angular/material/sort';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
    selector: 'app-select-evidence',
    templateUrl: './select-evidence.component.html',
    styleUrls: ['./select-evidence.component.scss'],
    animations: noctuaAnimations,
    standalone: true,
    imports: [
        CommonModule,
        CdkTableModule,
        MatButtonModule,
        MatCheckboxModule,
        MatSortModule,
        MatTableModule,
        MatToolbarModule,
        FontAwesomeModule,
    ],
})
export class SelectEvidenceDialogComponent implements OnInit, OnDestroy {
  private _unsubscribeAll: Subject<any>;
  evidence: Evidence[] = [];
  displayedColumns: string[] = ['select', 'evidence', 'reference', 'with'];
  dataSource;
  selection = new SelectionModel<Evidence>(true, []);

  constructor(
    private _matDialogRef: MatDialogRef<SelectEvidenceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private _data: any,
    public noctuaFormConfigService: NoctuaFormConfigService,
  ) {
    this._unsubscribeAll = new Subject();

    this.evidence = this._data.evidence;
    this.dataSource = new MatTableDataSource<Evidence>(this.evidence);

  }

  ngOnInit() {
  }
  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.dataSource.data.forEach(row => this.selection.select(row));
  }

  save() {
    this._matDialogRef.close({
      evidences: <Evidence[]>this.selection.selected
    });
  }

  close() {
    this._matDialogRef.close();
  }

  ngOnDestroy(): void {

    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }
}
