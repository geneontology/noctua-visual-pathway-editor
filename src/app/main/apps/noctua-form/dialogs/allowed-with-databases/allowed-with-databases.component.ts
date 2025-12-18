import { Component, Inject } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import allowedDBs from '@noctua.form/data/with-form-prefix.json';

@Component({
  selector: 'noc-allowed-with-databases-dialog',
  templateUrl: './allowed-with-databases.component.html',
  styleUrls: ['./allowed-with-databases.component.scss']
})
export class AllowedWithDatabasesDialogComponent {
  allowedDatabases: string[] = allowedDBs.slice().sort();

  constructor(
    private _matDialogRef: MatDialogRef<AllowedWithDatabasesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private _data: any
  ) { }

  close(): void {
    this._matDialogRef.close();
  }
}
