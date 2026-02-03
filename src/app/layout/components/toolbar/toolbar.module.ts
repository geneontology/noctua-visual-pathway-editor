import { NgModule } from '@angular/core';
import { NoctuaToolbarComponent } from './toolbar.component';

/**
 * @deprecated This module is maintained for backward compatibility.
 * Import NoctuaToolbarComponent directly in standalone components.
 */
@NgModule({
    imports: [NoctuaToolbarComponent],
    exports: [NoctuaToolbarComponent]
})
export class NoctuaToolbarModule {
}
