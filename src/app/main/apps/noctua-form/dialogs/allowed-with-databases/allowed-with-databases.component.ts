import { Component, Inject } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { withFromAllowedDBs } from '@geneontology/noctua-form-base';


@Component({
  selector: 'noc-allowed-with-databases-dialog',
  templateUrl: './allowed-with-databases.component.html',
  styleUrls: ['./allowed-with-databases.component.scss']
})
export class AllowedWithDatabasesDialogComponent {
  allowedDatabases: string[] = withFromAllowedDBs.slice().sort();

  constructor(
    private _matDialogRef: MatDialogRef<AllowedWithDatabasesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private _data: any
  ) { }

  close(): void {
    this._matDialogRef.close();
  }
}
