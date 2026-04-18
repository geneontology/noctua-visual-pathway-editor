import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';

import { NoctuaLoadingOverlayComponent } from './loading-overlay.component';

@NgModule({
  declarations: [
    NoctuaLoadingOverlayComponent
  ],
  imports: [
    CommonModule,
    MatProgressSpinnerModule
  ],
  exports: [
    NoctuaLoadingOverlayComponent
  ]
})
export class NoctuaLoadingOverlayModule {
}
