import { Component, Inject } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';

export interface AllowedDatabasesDialogData {
  databases: string[];
  title: string;
}

@Component({
  selector: 'noc-allowed-databases-dialog',
  templateUrl: './allowed-with-databases.component.html',
  styleUrls: ['./allowed-with-databases.component.scss']
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
