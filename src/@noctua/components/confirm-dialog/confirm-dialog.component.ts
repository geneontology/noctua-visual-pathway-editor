import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

export interface ConfirmDialogData {
    cancelLabel?: string;
    confirmLabel?: string;
    highlightCancel?: boolean;
    highlightConfirm?: boolean;
}

@Component({
    selector: 'noctua-confirm-dialog',
    templateUrl: './confirm-dialog.component.html',
    styleUrls: ['./confirm-dialog.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        FontAwesomeModule
    ]
})
export class NoctuaConfirmDialogComponent {
    dialogRef = inject<MatDialogRef<NoctuaConfirmDialogComponent>>(MatDialogRef);
    private _data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);

    public title: string;
    public message: string;
    public readonlyDialog = false;
    public cancelLabel = 'Cancel'
    public confirmLabel = 'Confirm'
    public highlightCancel = false
    public highlightConfirm = true

    constructor() {
        const _data = this._data;


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
