import { NgModule } from '@angular/core';
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
import { SearchEvidenceDialogComponent } from './dialogs/search-evidence/search-evidence.component';
import { SelectEvidenceComponent } from './components/select-evidence/select-evidence.component';
import { CopyModelComponent } from './components/copy-model/copy-model.component';
import { CamErrorsDialogComponent } from './dialogs/cam-errors/cam-errors.component';
import { CreateActivityDialogComponent } from './dialogs/create-activity/create-activity.component';
import { ActivityTreeTableComponent } from './cam/cam-table/activity-tree-table/activity-tree-table.component';
import { NoctuaTermDetailComponent } from './components/term-detail/term-detail.component';
import { ActivityFormTableNodeComponent } from './cam/cam-table/activity-form-table/activity-form-table-node/activity-form-table-node.component';
import { ActivityFormTableComponent } from './cam/cam-table/activity-form-table/activity-form-table.component';
import { EvidenceFormTableComponent } from './cam/cam-table/activity-form-table/evidence-table/evidence-table.component';
import { ConfirmCopyModelDialogComponent } from './dialogs/confirm-copy-model/confirm-copy-model.component';
import { CamToolbarComponent } from './cam/cam-toolbar/cam-toolbar.component';
import { ChemicalConnectorFormComponent } from './cam/activity/chemical-connector-form/chemical-connector-form.component';

/**
 * @deprecated This module is maintained for backward compatibility only.
 * Import standalone components directly in your components.
 */
@NgModule({
  imports: [
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

    // Standalone components (Phase 7 - Dialogs)
    AddEvidenceDialogComponent,
    ActivityErrorsDialogComponent,
    BeforeSaveDialogComponent,
    SelectEvidenceDialogComponent,
    SearchDatabaseDialogComponent,
    SearchEvidenceDialogComponent,
    AllowedDatabasesDialogComponent,
    CamErrorsDialogComponent,
    CreateActivityDialogComponent,
    ConfirmCopyModelDialogComponent,

    // Standalone components (Phase 8 - Other)
    SelectEvidenceComponent,
    NoctuaTermDetailComponent,
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
    ChemicalConnectorFormComponent,
    SelectEvidenceComponent,
    NoctuaTermDetailComponent,
  ],
  providers: [],
  declarations: [],
})

export class NoctuaFormModule {
}
