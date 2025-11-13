import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NoctuaSharedModule } from '@noctua/shared.module';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { NoctuaFooterModule } from 'app/layout/components/footer/footer.module';
import { NoctuaFormModule } from '../noctua-form';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CamGraphComponent } from './cam-graph/cam-graph.component';
import { NoctuaGraphComponent } from './noctua-graph.component';
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

@NgModule({
  imports: [
    NoctuaSharedModule,
    ScrollingModule,
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    NoctuaFooterModule,
    NoctuaFormModule,
  ],
  declarations: [
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
