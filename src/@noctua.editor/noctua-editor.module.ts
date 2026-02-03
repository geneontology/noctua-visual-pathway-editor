import { NgModule } from '@angular/core';
import { NoctuaInlineEditorComponent } from './inline-editor/inline-editor.component';
import { NoctuaEditorDropdownComponent } from './inline-editor/editor-dropdown/editor-dropdown.component';
import { NoctuaReferenceDropdownComponent } from './inline-reference/reference-dropdown/reference-dropdown.component';
import { NoctuaWithDropdownComponent } from './inline-with/with-dropdown/with-dropdown.component';
import { NoctuaDetailDropdownComponent } from './inline-detail/detail-dropdown/detail-dropdown.component';

/**
 * @deprecated This module is maintained for backward compatibility.
 * Import components directly in standalone components.
 */
@NgModule({
    imports: [
        NoctuaDetailDropdownComponent,
        NoctuaInlineEditorComponent,
        NoctuaEditorDropdownComponent,
        NoctuaReferenceDropdownComponent,
        NoctuaWithDropdownComponent,
    ],
    exports: [
        NoctuaDetailDropdownComponent,
        NoctuaInlineEditorComponent,
        NoctuaEditorDropdownComponent,
        NoctuaReferenceDropdownComponent,
        NoctuaWithDropdownComponent
    ]
})
export class NoctuaEditorModule {
}
