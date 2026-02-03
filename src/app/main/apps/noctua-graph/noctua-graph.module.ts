import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NoctuaGraphComponent } from './noctua-graph.component';
import { CamGraphComponent } from './cam-graph/cam-graph.component';
import { RelationPreviewComponent } from './relation-preview/relation-preview.component';
import { ActivityTableComponent } from './activity-table/activity-table.component';
import { ActivityConnectorTableComponent } from './activity-connector-table/activity-connector-table.component';
import { CamErrorsComponent } from './cam-errors/cam-errors.component';

const routes = [
  {
    path: '',
    component: NoctuaGraphComponent
  }
];

/**
 * @deprecated This module is maintained for backward compatibility and routing.
 * Import components directly in standalone components.
 */
@NgModule({
  imports: [
    RouterModule.forChild(routes),
    NoctuaGraphComponent,
    CamGraphComponent,
    RelationPreviewComponent,
    ActivityTableComponent,
    CamErrorsComponent,
    ActivityConnectorTableComponent
  ],
  exports: [
    NoctuaGraphComponent,
    CamGraphComponent,
    RelationPreviewComponent,
    ActivityTableComponent,
    CamErrorsComponent,
    ActivityConnectorTableComponent
  ]
})
export class NoctuaGraphModule {
}
