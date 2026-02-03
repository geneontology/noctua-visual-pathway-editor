import { NgModule } from '@angular/core';

import { NoctuaPerfectScrollbarDirective } from './noctua-perfect-scrollbar/noctua-perfect-scrollbar.directive';

/**
 * @deprecated This module is maintained for backward compatibility.
 * Prefer importing NoctuaPerfectScrollbarDirective directly in standalone components.
 */
@NgModule({
    imports: [
        NoctuaPerfectScrollbarDirective
    ],
    exports: [
        NoctuaPerfectScrollbarDirective
    ]
})
export class NoctuaDirectivesModule {
}

// Re-export the standalone directive for direct imports
export { NoctuaPerfectScrollbarDirective } from './noctua-perfect-scrollbar/noctua-perfect-scrollbar.directive';
