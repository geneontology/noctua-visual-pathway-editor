import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SelectionModel } from '@angular/cdk/collections';
import { CdkTableModule } from '@angular/cdk/table';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';

import {
  Evidence,
  NoctuaFormConfigService
} from '@geneontology/noctua-form-base';

import { noctuaAnimations } from '@noctua/animations';

import { FlexLayoutModule } from '@angular/flex-layout';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSortModule } from '@angular/material/sort';

@Component({
    selector: 'noc-select-evidence',
    templateUrl: './select-evidence.component.html',
    styleUrls: ['./select-evidence.component.scss'],
    animations: noctuaAnimations,
    standalone: true,
    imports: [
        CommonModule,
        FlexLayoutModule,
        CdkTableModule,
        MatCheckboxModule,
        MatSortModule,
        MatTableModule,
    ],
})
export class SelectEvidenceComponent implements OnInit, OnDestroy {
  private _unsubscribeAll: Subject<any>;

  @Input('evidence') evidence: Evidence[];

  @Output()
  onSelectionChanged: EventEmitter<any> = new EventEmitter<any>();

  displayedColumns: string[] = ['select', 'evidence', 'reference', 'with', 'assignedBy'];
  dataSource;
  selection = new SelectionModel<Evidence>(true, []);

  constructor(
    public noctuaFormConfigService: NoctuaFormConfigService,
  ) {
    this._unsubscribeAll = new Subject();
  }

  ngOnInit() {
    this.dataSource = new MatTableDataSource<Evidence>(this.evidence);
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

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }
}
