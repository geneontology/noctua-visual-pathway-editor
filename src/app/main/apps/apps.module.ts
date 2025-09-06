import { NgModule } from '@angular/core';
import { NoctuaSharedModule } from '@noctua/shared.module';
import { NoctuaFormModule } from './noctua-form/noctua-form.module';
import { NoctuaGraphModule } from './noctua-graph/noctua-graph.module';

@NgModule({
  imports: [
    NoctuaSharedModule,
    NoctuaFormModule,
    NoctuaGraphModule,
  ],
  exports: [
    NoctuaFormModule,
    NoctuaFormModule,
    NoctuaGraphModule,
  ],
  providers: [

  ],
  declarations: []

})

export class AppsModule {
}
