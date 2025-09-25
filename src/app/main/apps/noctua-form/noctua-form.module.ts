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
import { ActivityConnectorFormComponent } from './cam/activity/activity-connector-form/activity-connector-form.component';
import { NoctuaConfirmDialogModule } from '@noctua/components';
import { NoctuaEditorModule } from '@noctua.editor/noctua-editor.module';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from '@angular/material/legacy-autocomplete';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatLegacyChipsModule as MatChipsModule } from '@angular/material/legacy-chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyPaginatorModule as MatPaginatorModule } from '@angular/material/legacy-paginator';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { MatLegacyRadioModule as MatRadioModule } from '@angular/material/legacy-radio';
import { MatRippleModule } from '@angular/material/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
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
    CamFormComponent,
    CopyModelComponent,
    ActivityConnectorFormComponent,
    ActivityTreeTableComponent,
    ActivityFormTableComponent,
    ActivityFormTableNodeComponent,
    SelectEvidenceComponent,
    NoctuaTermDetailComponent,
    EvidenceFormTableComponent,
    ConfirmCopyModelDialogComponent,
    CamToolbarComponent,
    ChemicalConnectorFormComponent
  ],
})

export class NoctuaFormModule {
}
