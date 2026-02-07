import { Injectable, inject } from '@angular/core';
import 'jqueryui';
import * as joint from 'jointjs';
import { each } from 'lodash';
import { NoctuaCommonMenuService } from '@noctua.common/services/noctua-common-menu.service';
import { Activity, Cam, CamService, FormType, NoctuaActivityConnectorService, NoctuaActivityFormService, NoctuaGraphService, NoctuaUserService } from '@geneontology/noctua-form-base';
import { NodeCellList, NoctuaShapesService } from '@noctua.graph/services/shapes.service';
import { NodeCellType } from '@noctua.graph/models/shapes';
import { noctuaStencil, StencilItemNode } from '@noctua.graph/data/cam-stencil';
import { RightPanel } from '@noctua.common/models/menu-panels';
import { NoctuaFormDialogService } from 'app/main/apps/noctua-form';
import { NoctuaConfirmDialogService } from '@noctua/components/confirm-dialog/confirm-dialog.service';
import { CamCanvas } from '@noctua.graph/models/cam-canvas';
import { CamStencil } from '@noctua.graph/models/cam-stencil';
import { NoctuaGraphEditorService } from '@noctua.graph/services/graph-editor-service';

@Injectable({
  providedIn: 'root'
})
export class CamGraphService {
  private _camService = inject(CamService);
  private noctuaGraphEditorService = inject(NoctuaGraphEditorService);
  private _noctuaGraphService = inject(NoctuaGraphService);
  private _noctuaFormDialogService = inject(NoctuaFormDialogService);
  private _noctuaUserService = inject(NoctuaUserService);
  private confirmDialogService = inject(NoctuaConfirmDialogService);
  private _activityFormService = inject(NoctuaActivityFormService);
  private _activityConnectorService = inject(NoctuaActivityConnectorService);
  noctuaCommonMenuService = inject(NoctuaCommonMenuService);
  private noctuaShapesService = inject(NoctuaShapesService);

  cam: Cam;
  stencils: {
    id: string,
    paper: joint.dia.Paper;
    graph: joint.dia.Graph;
  }[] = [];


  selectedElement: joint.shapes.noctua.NodeCellList | joint.shapes.noctua.NodeLink;
  selectedStencilElement: joint.shapes.noctua.NodeCellList;
  placeholderElement: joint.shapes.noctua.NodeCellList = new NodeCellList();

  camCanvas: CamCanvas;
  camStencil: CamStencil;

  initializeGraph() {
    this.camCanvas = new CamCanvas();
    this.camCanvas.elementOnClick = this.openTable.bind(this);
    this.camCanvas.editOnClick = this.openTable.bind(this);
    this.camCanvas.deleteOnClick = this.deleteActivity.bind(this);
    this.camCanvas.linkOnClick = this.openConnector.bind(this);
    this.camCanvas.onLinkCreated = this.createActivityConnector.bind(this);
    this.camCanvas.onUpdateCamLocations = this.updateCamLocations.bind(this);

  }

  initializeStencils() {
    this.camStencil = new CamStencil(this.camCanvas, noctuaStencil.camStencil);
    this.camStencil.onAddElement = this.createActivity.bind(this);
  }

  addToCanvas(cam: Cam, graphLayoutDetail: string) {
    this.cam = cam;
    this.camCanvas.addCanvasGraph(cam, graphLayoutDetail);
  }

  zoom(delta: number, e?) {
    this.camCanvas.zoom(delta, e);
  }

  reset() {
    this.camCanvas.resetZoom();
  }

  updateCamLocations(cam: Cam) {
    this._noctuaGraphService.setActivityLocations(cam);
  }

  createActivity(element: joint.shapes.noctua.NodeCellList, x: number, y: number) {

    const success = () => {
      const node = element.get('node') as StencilItemNode;

      this.placeholderElement.position(x, y);
      this._activityFormService.setActivityType(node.type)
      this._activityFormService.activity.validateEvidence = true;
      this._noctuaFormDialogService.openCreateActivityDialog(FormType.ACTIVITY);
    };

    this._camService.checkGroup(success)

  }

  createActivityConnector(
    sourceId: string,
    targetId: string,
    _link: joint.shapes.noctua.NodeLink) {

    const success = () => {
      this._activityConnectorService.initializeForm(sourceId, targetId);
      this._noctuaFormDialogService.openCreateActivityDialog(FormType.ACTIVITY_CONNECTOR);
    }

    this._camService.checkGroup(success)

  }

  addActivity(activity: Activity, graphLayoutDetail: string) {
    const position = this.placeholderElement.prop('position') as joint.dia.Point

    activity.position.x = position.x
    activity.position.y = position.y

    const el = this.camCanvas.createNode(activity, graphLayoutDetail)

    this.camCanvas.canvasGraph.addCell(el);

    this._noctuaGraphService.addActivityLocation(this.cam, activity);
  }

  deleteActivity(element: joint.shapes.noctua.NodeCellList) {
    const activity = element.get('activity') as Activity;

    const success = () => {
      this._camService.deleteActivity(activity).then(() => {
        this._camService.onSelectedActivityChanged.next(null);
        this.noctuaCommonMenuService.closeRightDrawer();
        this._camService.getCam(this.cam.id);
        this._noctuaFormDialogService.openInfoToast('Successfully deleted.', 'OK');
      });
    };

    if (!this._noctuaUserService.user) {
      this.confirmDialogService.openConfirmDialog('Not Logged In',
        'Please log in to continue.',
        null);
    } else {
      this.confirmDialogService.openConfirmDialog('Confirm Delete?',
        'Deleting this cannot be undone. Continue?',
        success);
    }
  }


  openTable(element: joint.shapes.noctua.NodeCellList) {
    const activity = element.prop('activity') as Activity
    this.selectedElement = element;
    this._camService.onSelectedActivityChanged.next(activity);
    // activity.type = element.get('type');
    this.noctuaCommonMenuService.selectRightPanel(RightPanel.activityTable);
    this.noctuaCommonMenuService.closeLeftDrawer();
    this.noctuaCommonMenuService.openRightDrawer();


    activity.expanded = true;
    this._camService.currentMatch.activityDisplayId = activity.displayId;
    const q = `#${activity.displayId}`;

    this.noctuaCommonMenuService.scrollTo(q);
  }

  openConnector(element: joint.shapes.noctua.NodeLink) {
    this.selectedElement = element;
    const source = element.get('source');
    const target = element.get('target');

    if (!source || !target) return;

    this._activityConnectorService.initializeForm(source.id, target.id);
    this.noctuaCommonMenuService.selectRightPanel(RightPanel.activityConnectorTable);
    this.noctuaCommonMenuService.closeLeftDrawer();
    this.noctuaCommonMenuService.openRightDrawer();

  }

  autoLayoutGraph(spacingId: string) {
    this.camCanvas.autoLayoutGraph(this.camCanvas.canvasGraph, spacingId);
  }

  save() {
    const cells: joint.dia.Cell[] = this.camCanvas.canvasGraph.getCells();
    const cams = [];
    const triples = [];

    each(cells, (cell: joint.dia.Cell) => {
      const type = cell.get('type');

      if (type === NodeCellType.link) {
        const subject = cell.get('source');
        const object = cell.get('target');

        triples.push({
          subject: {
            uuid: subject.id,
          },
          predicate: {
            id: cell.get('id'),
          },
          object: {
            uuid: object.id
          }
        });
      } else {
        cams.push({
          uuid: cell.get('id'),
          id: cell.get('id'),
          position: cell.get('position'),
          size: cell.get('size'),
        });
      }
    });

    // Prepared for future use
    const _cam = {
      cams,
      triples
    };

  }
}
