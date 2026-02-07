import { Component, OnInit, OnDestroy, AfterViewInit, ViewChildren, QueryList, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CamGraphService } from './services/cam-graph.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NoctuaCommonMenuService } from '@noctua.common/services/noctua-common-menu.service';
import { NoctuaDataService } from '@noctua.common/services/noctua-data.service';
import { Activity, Cam, CamOperation, CamService, NoctuaFormConfigService, NoctuaGraphService } from '@geneontology/noctua-form-base';
import { NoctuaShapesService } from '@noctua.graph/services/shapes.service';
import { noctuaStencil } from '@noctua.graph/data/cam-stencil';
import { NoctuaGraphEditorService } from '@noctua.graph/services/graph-editor-service';

@Component({
  selector: 'noc-cam-graph',
  templateUrl: './cam-graph.component.html',
  styleUrls: ['./cam-graph.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    FontAwesomeModule
  ]
})
export class CamGraphComponent implements OnInit, AfterViewInit, OnDestroy {
  noctuaDataService = inject(NoctuaDataService);
  noctuaFormConfigService = inject(NoctuaFormConfigService);
  noctuaGraphEditorService = inject(NoctuaGraphEditorService);
  private camService = inject(CamService);
  private _noctuaGraphService = inject(NoctuaGraphService);
  noctuaCommonMenuService = inject(NoctuaCommonMenuService);
  noctuaCamGraphService = inject(CamGraphService);
  private noctuaCamShapesService = inject(NoctuaShapesService);


  @ViewChildren('stencils') stencilContainers: QueryList<any>;

  @Input()
  public cam: Cam;

  private _unsubscribeAll: Subject<any>;
  stencils = [];

  selectedLayoutDetail;

  constructor() {

    this._unsubscribeAll = new Subject();

    this.stencils = noctuaStencil.camStencil

    this.noctuaGraphEditorService.onGraphLayoutDetailChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((layoutDetail) => {
        if (!layoutDetail) {
          return;
        }

        this.noctuaCamGraphService.addToCanvas(this.cam, this.noctuaGraphEditorService.selectedGraphLayoutDetail.id);

      });

  }

  ngAfterViewInit() {
    this.noctuaCamGraphService.initializeGraph();
    this.noctuaCamGraphService.initializeStencils();

    this._noctuaGraphService.onCamGraphChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((cam: Cam) => {
        if (!cam || cam.id !== this.cam.id) {
          return;
        }
        this.cam = cam;
        this.noctuaCamGraphService.cam = this.cam;

        this.camService.updateMFProperties(cam);
        if (cam.operation !== CamOperation.ADD_ACTIVITY) {
          this.noctuaCamGraphService.addToCanvas(this.cam, this.noctuaGraphEditorService.selectedGraphLayoutDetail.id);
        }

      });
  }

  ngOnInit() {
    this._noctuaGraphService.onActivityAdded
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((activity: Activity) => {
        if (!activity) {
          return;
        }
        //this.noctuaCamGraphService.cam.activities.push(activity)
        this.noctuaCamGraphService.addActivity(activity, this.noctuaGraphEditorService.selectedGraphLayoutDetail.id);

      });
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  selectLayoutDetail(selected) {
    this.noctuaGraphEditorService.selectedGraphLayoutDetail = selected;
    this.noctuaGraphEditorService.onGraphLayoutDetailChanged.next(selected)
  }

  selectLayoutSpacing(selected) {
    this.noctuaGraphEditorService.selectedGraphLayoutSpacing = selected;
    this.noctuaGraphEditorService.onGraphLayoutSpacingChanged.next(selected)
  }

  canMove(e: any): boolean {
    return e.indexOf('Disabled') === -1;
  }

  automaticLayout() {
    this.noctuaCamGraphService.autoLayoutGraph(this.noctuaGraphEditorService.selectedGraphLayoutSpacing.id);
  }

  zoomIn() {
    const delta = 0.1;
    this.noctuaCamGraphService.zoom(delta);
  }

  zoomOut() {
    const delta = -0.1;
    this.noctuaCamGraphService.zoom(delta);
  }

  onCtrlScroll($event) {
    const delta = Math.max(-1, Math.min(1, ($event.wheelDelta || $event.detail))) / 10;

    if ($event.ctrlKey) {
      this.noctuaCamGraphService.zoom(delta, $event);
      $event.returnValue = false;
      // for Chrome and Firefox
      if ($event.preventDefault) {
        $event.preventDefault();
      }
    }
  }

}
