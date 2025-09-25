import { Component, Inject } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';

export interface ConfirmDialogData {
    cancelLabel?: string;
    confirmLabel?: string;
    highlightCancel?: boolean;
    highlightConfirm?: boolean;
}

@Component({
    selector: 'noctua-confirm-dialog',
    templateUrl: './confirm-dialog.component.html',
    styleUrls: ['./confirm-dialog.component.scss']
})
export class NoctuaConfirmDialogComponent {
    public title: string;
    public message: string;
    public readonlyDialog = false;
    public cancelLabel = 'Cancel'
    public confirmLabel = 'Confirm'
    public highlightCancel = false
    public highlightConfirm = true

    constructor(public dialogRef: MatDialogRef<NoctuaConfirmDialogComponent>,
        @Inject(MAT_DIALOG_DATA) private _data: ConfirmDialogData) {

        if (_data) {
            this.cancelLabel = _data.cancelLabel ? _data.cancelLabel : 'Cancel';
            this.confirmLabel = _data.confirmLabel ? _data.confirmLabel : 'Confirm';
            this.highlightCancel = _data.highlightCancel !== undefined ? _data.highlightCancel : false;
            this.highlightConfirm = _data.highlightConfirm !== undefined ? _data.highlightConfirm : true;
        }

    }

    confirm() {
        this.dialogRef.close(true);
    }

    cancel() {
        this.dialogRef.close(false);
    }
}
