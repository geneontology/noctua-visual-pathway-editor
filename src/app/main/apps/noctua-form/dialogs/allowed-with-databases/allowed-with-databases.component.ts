import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

import { FlexLayoutModule } from '@angular/flex-layout';
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
        FlexLayoutModule,
        MatButtonModule,
        MatDialogModule,
        FontAwesomeModule,
    ],
})
export class AllowedDatabasesDialogComponent {
  allowedDatabases: string[];
  dialogTitle: string;

  constructor(
    private _matDialogRef: MatDialogRef<AllowedDatabasesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private _data: AllowedDatabasesDialogData
  ) {
    this.allowedDatabases = _data.databases.slice().sort();
    this.dialogTitle = _data.title;
  }

  close(): void {
    this._matDialogRef.close();
  }
}
