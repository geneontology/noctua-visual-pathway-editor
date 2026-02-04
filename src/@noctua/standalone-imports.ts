/**
 * Standalone Imports - Common imports for standalone components
 * Use these arrays in the `imports` property of standalone components
 */

import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { DragDropModule } from '@angular/cdk/drag-drop';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { NgxGraphModule } from '@swimlane/ngx-graph';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

/**
 * Common Angular imports used by most components
 */
export const COMMON_IMPORTS = [
  CommonModule,
  FormsModule,
  ReactiveFormsModule,
] as const;

/**
 * Routing imports for components that use router features
 */
export const ROUTER_IMPORTS = [
  RouterModule,
] as const;

/**
 * Layout-related imports (drag-drop)
 * Note: FlexLayoutModule removed - using Tailwind CSS for layouts
 */
export const LAYOUT_IMPORTS = [
  DragDropModule,
] as const;

/**
 * Third-party library imports
 */
export const THIRD_PARTY_IMPORTS = [
  NgScrollbarModule,
  NgxGraphModule,
  FontAwesomeModule,
] as const;

/**
 * All shared imports that were previously in NoctuaSharedModule
 * Use this when a component needs all shared functionality
 */
export const SHARED_IMPORTS = [
  ...COMMON_IMPORTS,
  ...LAYOUT_IMPORTS,
  ...THIRD_PARTY_IMPORTS,
] as const;
