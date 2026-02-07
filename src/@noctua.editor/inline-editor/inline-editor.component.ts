import { Component, OnDestroy, OnInit, ElementRef, ViewChild, Input, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { Subject } from 'rxjs';
import { cloneDeep } from 'lodash';

import { InlineEditorService } from './inline-editor.service';

import {
    CamService,
    NoctuaActivityEntityService,
    ActivityNode,
    Activity,
    Cam,
    NoctuaUserService
} from '@geneontology/noctua-form-base';
import { EditorCategory } from './../models/editor-category';
import { NoctuaConfirmDialogService } from '@noctua/components/confirm-dialog/confirm-dialog.service';

@Component({
    selector: 'noctua-inline-editor',
    templateUrl: './inline-editor.component.html',
    styleUrls: ['./inline-editor.component.scss'],
    standalone: true,
    imports: [
        MatButtonModule,
        FontAwesomeModule
    ]
})
export class NoctuaInlineEditorComponent implements OnInit, OnDestroy {
    private inlineEditorService = inject(InlineEditorService);
    private camService = inject(CamService);
    private _noctuaUserService = inject(NoctuaUserService);
    private confirmDialogService = inject(NoctuaConfirmDialogService);
    private noctuaActivityEntityService = inject(NoctuaActivityEntityService);

    collapsed: boolean;
    noctuaConfig: any;

    @Input() cam: Cam;
    @Input() activity: Activity;
    @Input() entity: ActivityNode;
    @Input() category: EditorCategory;
    @Input() evidenceIndex = 0;

    @ViewChild('editorDropdownTrigger', { read: ElementRef })
    private editorDropdownTrigger: ElementRef;
    private _unsubscribeAll: Subject<any>;

    constructor() {
        this._unsubscribeAll = new Subject();
    }

    ngOnInit(): void {

    }

    openEditorDropdown(event) {

        const success = () => {
            const displayEntity = cloneDeep(this.entity);
            const data = {
                cam: this.cam,
                activity: this.activity,
                entity: displayEntity,
                category: this.category,
                evidenceIndex: this.evidenceIndex
            };
            this.camService.onCamChanged.next(this.cam);
            this.camService.activity = this.activity;
            this.noctuaActivityEntityService.initializeForm(this.activity, displayEntity);
            this.inlineEditorService.open(event.target, { data });
        }

        this.camService.checkGroup(success)

    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
