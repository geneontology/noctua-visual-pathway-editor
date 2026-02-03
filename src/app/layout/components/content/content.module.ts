import { NgModule } from '@angular/core';
import { ContentComponent } from 'app/layout/components/content/content.component';

/**
 * @deprecated This module is maintained for backward compatibility.
 * Import ContentComponent directly in standalone components.
 */
@NgModule({
    imports: [ContentComponent],
    exports: [ContentComponent]
})
export class ContentModule {
}
