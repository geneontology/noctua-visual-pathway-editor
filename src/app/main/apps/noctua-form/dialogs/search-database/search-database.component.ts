import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntil } from 'rxjs/operators';

import { SelectionModel } from '@angular/cdk/collections';
import { CdkTableModule } from '@angular/cdk/table';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';

import {
  ActivityNode,
  Evidence,
  NoctuaFormConfigService,
  NoctuaLookupService
} from '@geneontology/noctua-form-base';

import { noctuaAnimations } from './../../../../../../@noctua/animations';

import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSortModule } from '@angular/material/sort';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
    selector: 'app-search-database',
    templateUrl: './search-database.component.html',
    styleUrls: ['./search-database.component.scss'],
    animations: noctuaAnimations,
    standalone: true,
    imports: [
        CommonModule,
        CdkTableModule,
        MatButtonModule,
        MatCheckboxModule,
        MatSortModule,
        MatTableModule,
        FontAwesomeModule,
    ],
})
export class SearchDatabaseDialogComponent implements OnInit, OnDestroy {
  private _matDialogRef = inject<MatDialogRef<SearchDatabaseDialogComponent>>(MatDialogRef);
  private _data = inject(MAT_DIALOG_DATA);
  noctuaFormConfigService = inject(NoctuaFormConfigService);
  private noctuaLookupService = inject(NoctuaLookupService);

  private _unsubscribeAll: Subject<any>;
  evidence: Evidence[] = [];
  activityNodes: ActivityNode[] = [];
  selectedActivityNode: ActivityNode;
  searchCriteria: any;
  displayedColumns: string[] = ['select', 'evidence', 'reference', 'with', 'assignedBy'];
  dataSource;
  selection = new SelectionModel<Evidence>(true, []);

  constructor() {
    this._unsubscribeAll = new Subject();

    this.evidence = this._data.evidence;
    this.searchCriteria = this._data.searchCriteria;
    this.initialize();

  }
  ngOnInit() { }

  initialize() {
    const self = this;

    self.noctuaLookupService.companionLookup(
      this.searchCriteria.gpNode.id,
      this.searchCriteria.aspect,
      this.searchCriteria.params)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((response) => {
        this.activityNodes = response;
      });
  }

  selectActivityNode(activityNode: ActivityNode) {
    this.selectedActivityNode = activityNode;
    this.dataSource = new MatTableDataSource<Evidence>(activityNode.predicate.evidence);
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
      term: this.selectedActivityNode,
      evidences: this.selection.selected as Evidence[]
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
