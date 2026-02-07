import { Injectable, Injector, ElementRef, ComponentRef, inject } from '@angular/core';
import {
    Overlay,
    OverlayRef,
    OverlayConfig,
    PositionStrategy
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { EditorDropdownOverlayRef } from './editor-dropdown/editor-dropdown-ref';
import { editorDropdownData } from './editor-dropdown/editor-dropdown.tokens';

import { NoctuaEditorDropdownComponent } from './editor-dropdown/editor-dropdown.component';

import {
    CamService,
    NoctuaActivityEntityService,
    NoctuaActivityFormService
} from '@geneontology/noctua-form-base';

export interface SearchCriiteria {
    gp: string;
    url: string;
}

export interface EditorDropdownDialogConfig {
    panelClass?: string;
    hasBackdrop?: boolean;
    backdropClass?: string;
    positionStrategy?: PositionStrategy;
    width?: string;
    data?: any;
}

const DEFAULT_CONFIG: EditorDropdownDialogConfig = {
    hasBackdrop: true,
    backdropClass: 'dark-backdrop',
    panelClass: 'tm-file-preview-dialog-panel',
    // width: '600px',
    data: null
};

@Injectable({
    providedIn: 'root'
})
export class InlineEditorService {
    private injector = inject(Injector);
    private overlay = inject(Overlay);
    private camService = inject(CamService);
    noctuaActivityFormService = inject(NoctuaActivityFormService);
    private noctuaActivityEntityService = inject(NoctuaActivityEntityService);


    /*     openEditorDropdown(event, config) {
            const data = {
                cam: config.cam,
                activity: config.activity,
                entity: config.entity,
                category: config.category,
                evidenceIndex: config.evidenceIndex
            };
            // this.camService.onCamChanged.next(this.cam);
            this.camService.onCamChanged.next(config.cam);
            this.camService.activity = config.activity;
            this.noctuaActivityEntityService.initializeForm(config.activity, config.entity);
            this.open(event.target, { data });
        } */

    open(elementToConnectTo: ElementRef, config: EditorDropdownDialogConfig = {}) {
        const dialogConfig = { ...DEFAULT_CONFIG, ...config };

        dialogConfig['positionStrategy'] = this._getPosition(elementToConnectTo);
        // dialogConfig['width'] = '420px';
        const overlayRef = this.createOverlay(dialogConfig);
        const dialogRef = new EditorDropdownOverlayRef(overlayRef);
        this.attachDialogContainer(overlayRef, dialogConfig, dialogRef);

        overlayRef.backdropClick().subscribe(_ => dialogRef.close());

        return dialogRef;
    }

    close(_data): void {
        //  this.overlayRef.dispose();
    }

    private createInjector(config: EditorDropdownDialogConfig, dialogRef: EditorDropdownOverlayRef): Injector {
        return Injector.create({
            providers: [
                { provide: EditorDropdownOverlayRef, useValue: dialogRef },
                { provide: editorDropdownData, useValue: config.data }
            ],
            parent: this.injector
        });
    }

    private attachDialogContainer(overlayRef: OverlayRef, config: EditorDropdownDialogConfig, dialogRef: EditorDropdownOverlayRef) {
        const injector = this.createInjector(config, dialogRef);

        const containerPortal = new ComponentPortal(NoctuaEditorDropdownComponent, null, injector);
        const containerRef: ComponentRef<NoctuaEditorDropdownComponent> = overlayRef.attach(containerPortal);

        return containerRef.instance;
    }

    private createOverlay(config: EditorDropdownDialogConfig) {
        const overlayConfig = this.getOverlayConfig(config);

        return this.overlay.create(overlayConfig);
    }

    private getOverlayConfig(config: EditorDropdownDialogConfig): OverlayConfig {
        const overlayConfig = new OverlayConfig({
            hasBackdrop: config.hasBackdrop,
            backdropClass: config.backdropClass,
            width: config.width,
            panelClass: config.panelClass,
            scrollStrategy: this.overlay.scrollStrategies.block(),
            positionStrategy: config.positionStrategy
        });

        return overlayConfig;
    }

    private _getPosition(elementToConnectTo: ElementRef) {
        return this.overlay.position()
            .flexibleConnectedTo(elementToConnectTo)
            .withFlexibleDimensions(true)
            .withPush(true)
            .withPositions([{
                overlayX: 'end',
                overlayY: 'top',
                originX: 'end',
                originY: 'bottom'
            }]);
        //.withOffsetY(1)
        //.withDirection('ltr')
        //.withFallbackPosition(origin.bottomRight, overlay.topRight)
        //.withFallbackPosition(origin.topLeft, overlay.bottomLeft)
        //.withFallbackPosition(origin.topRight, overlay.bottomRight)
        // .withFallbackPosition(origin.topCenter, overlay.bottomCenter)
        // .withFallbackPosition(origin.bottomCenter, overlay.topCenter)
    }
}