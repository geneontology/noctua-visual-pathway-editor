import { NgModule } from '@angular/core';
import { NoctuaConfirmDialogComponent } from './confirm-dialog.component';

/**
 * @deprecated This module is maintained for backward compatibility.
 * Import NoctuaConfirmDialogComponent directly in standalone components.
 */
@NgModule({
    imports: [NoctuaConfirmDialogComponent],
    exports: [NoctuaConfirmDialogComponent]
})
export class NoctuaConfirmDialogModule {
}
