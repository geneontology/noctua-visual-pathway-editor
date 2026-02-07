import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

export interface AllowedDatabasesDialogData {
  databases: string[];
  title: string;
}

@Component({
    selector: 'noc-allowed-databases-dialog',
    templateUrl: './allowed-with-databases.component.html',
    styleUrls: ['./allowed-with-databases.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatDialogModule,
        FontAwesomeModule,
    ],
})
export class AllowedDatabasesDialogComponent {
  private _matDialogRef = inject<MatDialogRef<AllowedDatabasesDialogComponent>>(MatDialogRef);
  private _data = inject<AllowedDatabasesDialogData>(MAT_DIALOG_DATA);

  allowedDatabases: string[];
  dialogTitle: string;

  constructor() {
    const _data = this._data;

    this.allowedDatabases = _data.databases.slice().sort();
    this.dialogTitle = _data.title;
  }

  close(): void {
    this._matDialogRef.close();
  }
}
