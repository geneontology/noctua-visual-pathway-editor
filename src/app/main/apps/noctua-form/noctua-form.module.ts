import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreeModule } from '@ali-hm/angular-tree-component';
import { NoctuaSharedModule } from './../../../../@noctua/shared.module';
import { NoctuaFormDialogService } from './services/dialog.service';
import { ActivityFormComponent } from './cam/activity/activity-form/activity-form.component';
import { EntityFormComponent } from './cam/activity/activity-form/entity-form/entity-form.component';
import { CamFormComponent } from './cam/cam-form/cam-form.component';
import { AddEvidenceDialogComponent } from './dialogs/add-evidence/add-evidence.component';
import { ActivityErrorsDialogComponent } from './dialogs/activity-errors/activity-errors.component';
import { BeforeSaveDialogComponent } from './dialogs/before-save/before-save.component';
import { SelectEvidenceDialogComponent } from './dialogs/select-evidence/select-evidence.component';
import { SearchDatabaseDialogComponent } from './dialogs/search-database/search-database.component';
import { AllowedDatabasesDialogComponent } from './dialogs/allowed-with-databases/allowed-with-databases.component';
import { ActivityConnectorFormComponent } from './cam/activity/activity-connector-form/activity-connector-form.component';
import { NoctuaConfirmDialogModule } from '@noctua/components';
import { NoctuaEditorModule } from '@noctua.editor/noctua-editor.module';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatRippleModule } from '@angular/material/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { SearchEvidenceDialogComponent } from './dialogs/search-evidence/search-evidence.component';
import { SelectEvidenceComponent } from './components/select-evidence/select-evidence.component';
import { CopyModelComponent } from './components/copy-model/copy-model.component';
import { MatTreeModule } from '@angular/material/tree';
import { CamErrorsDialogComponent } from './dialogs/cam-errors/cam-errors.component';
import { CreateActivityDialogComponent } from './dialogs/create-activity/create-activity.component';
import { ActivityTreeTableComponent } from './cam/cam-table/activity-tree-table/activity-tree-table.component';
import { ResizableModule } from 'angular-resizable-element';
import { NoctuaTermDetailComponent } from './components/term-detail/term-detail.component';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { ActivityFormTableNodeComponent } from './cam/cam-table/activity-form-table/activity-form-table-node/activity-form-table-node.component';
import { ActivityFormTableComponent } from './cam/cam-table/activity-form-table/activity-form-table.component';
import { EvidenceFormTableComponent } from './cam/cam-table/activity-form-table/evidence-table/evidence-table.component';
import { ConfirmCopyModelDialogComponent } from './dialogs/confirm-copy-model/confirm-copy-model.component';
import { CamToolbarComponent } from './cam/cam-toolbar/cam-toolbar.component';
import { ChemicalConnectorFormComponent } from './cam/activity/chemical-connector-form/chemical-connector-form.component';

@NgModule({
  imports: [
    NoctuaSharedModule,
    TreeModule,
    CommonModule,
    // NoctuaModule.forRoot(noctuaConfig),
    NoctuaConfirmDialogModule,
    NoctuaEditorModule,
    NgxChartsModule,

    //Material
    MatAutocompleteModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatChipsModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatRippleModule,
    MatSidenavModule,
    MatSnackBarModule,
    MatTableModule,
    MatTooltipModule,
    MatTreeModule,
    ResizableModule,

    // Standalone components (Phase 5)
    ActivityTreeTableComponent,
    ActivityFormTableComponent,
    ActivityFormTableNodeComponent,
    EvidenceFormTableComponent,

    // Standalone components (Phase 6)
    EntityFormComponent,
    CamToolbarComponent,
    CopyModelComponent,
    ChemicalConnectorFormComponent,
    ActivityConnectorFormComponent,
    ActivityFormComponent,
    CamFormComponent,
  ],
  exports: [
    ActivityFormComponent,
    EntityFormComponent,
    AddEvidenceDialogComponent,
    CreateActivityDialogComponent,
    ActivityErrorsDialogComponent,
    CamErrorsDialogComponent,
    BeforeSaveDialogComponent,
    SelectEvidenceDialogComponent,
    SearchDatabaseDialogComponent,
    SearchEvidenceDialogComponent,
    AllowedDatabasesDialogComponent,
    CamFormComponent,
    CopyModelComponent,
    ActivityConnectorFormComponent,
    ActivityTreeTableComponent,
    ActivityFormTableComponent,
    ActivityFormTableNodeComponent,
    EvidenceFormTableComponent,
    ConfirmCopyModelDialogComponent,
    CamToolbarComponent,
    ChemicalConnectorFormComponent
  ],
  providers: [
    NoctuaFormDialogService,
  ],
  declarations: [
    AddEvidenceDialogComponent,
    CreateActivityDialogComponent,
    ActivityErrorsDialogComponent,
    CamErrorsDialogComponent,
    BeforeSaveDialogComponent,
    SelectEvidenceDialogComponent,
    SearchDatabaseDialogComponent,
    SearchEvidenceDialogComponent,
    AllowedDatabasesDialogComponent,
    SelectEvidenceComponent,
    NoctuaTermDetailComponent,
    ConfirmCopyModelDialogComponent,
  ],
})

export class NoctuaFormModule {
}
