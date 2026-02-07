import { Injectable, inject } from '@angular/core';

import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { NoctuaConfirmDialogComponent } from './../../components/confirm-dialog/confirm-dialog.component';


@Injectable({
    providedIn: 'root'
})
export class NoctuaConfirmDialogService {
    private snackBar = inject(MatSnackBar);
    private _matDialog = inject(MatDialog);


    dialogRef: any;

    openInfoToast(message: string, action: string) {
        this.snackBar.open(message, action, {
            duration: 5000,
            verticalPosition: 'top'
        });
    }

    openConfirmDialog(title: string, message: string, success, options?): void {
        let confirmDialogRef: MatDialogRef<NoctuaConfirmDialogComponent> = this._matDialog.open(NoctuaConfirmDialogComponent, {
            panelClass: 'noc-confirm-dialog',
            disableClose: false,
            width: '600px',
            data: options
        });

        confirmDialogRef.componentInstance.title = title;
        confirmDialogRef.componentInstance.message = message;
        if (!success) {
            confirmDialogRef.componentInstance.readonlyDialog = true;
        }

        confirmDialogRef.afterClosed().subscribe(response => {
            if (response) {
                success(response);
            }
            confirmDialogRef = null;
        });
    }
}
