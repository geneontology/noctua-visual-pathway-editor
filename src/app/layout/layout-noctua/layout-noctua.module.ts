import { NgModule } from '@angular/core';
import { LayoutNoctuaComponent } from 'app/layout/layout-noctua/layout-noctua.component';

/**
 * @deprecated This module is maintained for backward compatibility.
 * Import LayoutNoctuaComponent directly in standalone components.
 */
@NgModule({
    imports: [LayoutNoctuaComponent],
    exports: [LayoutNoctuaComponent]
})
export class LayoutNoctuaModule {
}




