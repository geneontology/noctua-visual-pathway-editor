import { NgModule } from '@angular/core';
import { NoctuaSharedModule } from '@noctua/shared.module';
import { NoctuaFormModule } from './noctua-form/noctua-form.module';
import { NoctuaGraphModule } from './noctua-graph/noctua-graph.module';
import { NoctuaSearchModule } from './noctua-search/noctua-search.module';
import { NoctuaPathwayModule } from './noctua-pathway/noctua-pathway.module';

@NgModule({
  imports: [
    NoctuaSharedModule,
    NoctuaFormModule,
    NoctuaSearchModule,
    NoctuaGraphModule,
    NoctuaPathwayModule
  ],
  exports: [
    NoctuaFormModule,
    NoctuaFormModule,
    NoctuaSearchModule,
    NoctuaGraphModule,
    NoctuaPathwayModule
  ],
  providers: [

  ],
  declarations: []

})

export class AppsModule {
}
