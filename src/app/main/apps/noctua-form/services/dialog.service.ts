import { Injectable, NgZone, inject } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import {
    Cam,
    Evidence, FormType
} from '@geneontology/noctua-form-base';

import { NoctuaConfirmDialogComponent } from '@noctua/components/confirm-dialog/confirm-dialog.component';
import { referenceAllowedDBs, withFromAllowedDBs } from '@geneontology/noctua-form-base';


@Injectable({
    providedIn: 'root'
})
export class NoctuaFormDialogService {
    private zone = inject(NgZone);
    private snackBar = inject(MatSnackBar);
    private _matDialog = inject(MatDialog);


    dialogRef: any;

    openInfoToast(message: string, action: string) {
        this.zone.run(() => {
            this.snackBar.open(message, action, {
                duration: 10000,
                verticalPosition: 'top'
            });
        });

    }

    openConfirmDialog(searchCriteria, success): void {
        this.dialogRef = this._matDialog.open(NoctuaConfirmDialogComponent, {
            panelClass: 'noc-search-database-dialog',
            data: {
                searchCriteria: searchCriteria
            },
            width: '600px',
        });
        this.dialogRef.afterClosed()
            .subscribe(response => {
                if (response) {
                    success(response);
                }
            });
    }


    async openCreateActivityDialog(formType: FormType): Promise<void> {
        const { CreateActivityDialogComponent } = await import('../dialogs/create-activity/create-activity.component');
        this.dialogRef = this._matDialog.open(CreateActivityDialogComponent, {
            panelClass: 'noc-activity-create-dialog',
            data: {
                formType
            }
        });
        this.dialogRef.afterClosed()
            .subscribe(_response => {

            });
    }

    async openActivityErrorsDialog(errors: any[]): Promise<void> {
        const { ActivityErrorsDialogComponent } = await import('../dialogs/activity-errors/activity-errors.component');
        this.dialogRef = this._matDialog.open(ActivityErrorsDialogComponent, {
            panelClass: 'activity-errors-dialog',
            data: {
                errors: errors
            }
        });
        this.dialogRef.afterClosed()
            .subscribe(_response => {

            });
    }

    async openCamErrorsDialog(errors: any[]): Promise<void> {
        const { CamErrorsDialogComponent } = await import('../dialogs/cam-errors/cam-errors.component');
        this.dialogRef = this._matDialog.open(CamErrorsDialogComponent, {
            panelClass: 'cam-errors-dialog',
            data: {
                errors: errors
            }
        });
        this.dialogRef.afterClosed()
            .subscribe(_response => {

            });
    }

    async openAddEvidenceDialog(success): Promise<void> {
        const { AddEvidenceDialogComponent } = await import('../dialogs/add-evidence/add-evidence.component');
        this.dialogRef = this._matDialog.open(AddEvidenceDialogComponent, {
            panelClass: 'noc-add-evidence-dialog',
            data: {
            },
            width: '600px',
        });
        this.dialogRef.afterClosed()
            .subscribe(response => {
                if (response) {
                    success(response);
                }
            });
    }

    async openConfirmCopyModelDialog(cam: Cam, success): Promise<void> {
        const { ConfirmCopyModelDialogComponent } = await import('../dialogs/confirm-copy-model/confirm-copy-model.component');
        this.dialogRef = this._matDialog.open(ConfirmCopyModelDialogComponent, {
            panelClass: 'noc-confirm-copy-model-dialog',
            data: {
                cam: cam
            },
            width: '600px',
        });
        this.dialogRef.afterClosed()
            .subscribe(response => {
                if (response) {
                    success(response);
                }
            });
    }


    async openSelectEvidenceDialog(evidence: Evidence[], success): Promise<void> {
        const { SelectEvidenceDialogComponent } = await import('../dialogs/select-evidence/select-evidence.component');
        this.dialogRef = this._matDialog.open(SelectEvidenceDialogComponent, {
            panelClass: 'noc-select-evidence-dialog',
            data: {
                evidence: evidence
            }
        });
        this.dialogRef.afterClosed()
            .subscribe(response => {
                if (response) {
                    success(response);
                }
            });
    }

    async openSearchDatabaseDialog(searchCriteria, success): Promise<void> {
        const { SearchDatabaseDialogComponent } = await import('../dialogs/search-database/search-database.component');
        this.dialogRef = this._matDialog.open(SearchDatabaseDialogComponent, {
            panelClass: 'noc-search-database-dialog',
            data: {
                searchCriteria: searchCriteria
            },
            width: '600px',
        });
        this.dialogRef.afterClosed()
            .subscribe(response => {
                if (response) {
                    success(response);
                }
            });
    }

    async openSearchEvidenceDialog(searchCriteria, success): Promise<void> {
        const { SearchEvidenceDialogComponent } = await import('../dialogs/search-evidence/search-evidence.component');
        this.dialogRef = this._matDialog.open(SearchEvidenceDialogComponent, {
            panelClass: 'noc-search-evidence-dialog',
            data: {
                searchCriteria: searchCriteria
            },
            width: '600px',
        });
        this.dialogRef.afterClosed()
            .subscribe(response => {
                if (response) {
                    success(response);
                }
            });
    }

    async openAllowedWithDatabasesDialog(): Promise<void> {
        const { AllowedDatabasesDialogComponent } = await import('../dialogs/allowed-with-databases/allowed-with-databases.component');
        this.dialogRef = this._matDialog.open(AllowedDatabasesDialogComponent, {
            panelClass: 'noc-allowed-with-databases-dialog',
            width: '500px',
            data: {
                databases: withFromAllowedDBs,
                title: 'Allowed "With" Databases'
            }
        });
    }

    async openAllowedReferenceDatabasesDialog(): Promise<void> {
        const { AllowedDatabasesDialogComponent } = await import('../dialogs/allowed-with-databases/allowed-with-databases.component');
        this.dialogRef = this._matDialog.open(AllowedDatabasesDialogComponent, {
            panelClass: 'noc-allowed-reference-databases-dialog',
            width: '500px',
            data: {
                databases: referenceAllowedDBs,
                title: 'Allowed Reference Databases'
            }
        });
    }

}
