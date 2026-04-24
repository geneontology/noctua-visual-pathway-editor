import { Component, Inject } from '@angular/core';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { Cam } from '@geneontology/noctua-form-base';

@Component({
  selector: 'app-edit-activity-connector-dialog',
  templateUrl: './edit-activity-connector-dialog.component.html'
})
export class EditActivityConnectorDialogComponent {
  cam: Cam;
  closeDialog: () => void;

  constructor(
    private _matDialogRef: MatDialogRef<EditActivityConnectorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: { cam: Cam }) {
    this.cam = data.cam;
    this.closeDialog = () => this._matDialogRef.close();
  }
}
