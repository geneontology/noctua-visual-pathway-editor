import { NgModule } from '@angular/core';
import { NoctuaFooterComponent } from 'app/layout/components/footer/footer.component';

/**
 * @deprecated This module is maintained for backward compatibility.
 * Import NoctuaFooterComponent directly in standalone components.
 */
@NgModule({
    imports: [NoctuaFooterComponent],
    exports: [NoctuaFooterComponent]
})
export class NoctuaFooterModule {
}
