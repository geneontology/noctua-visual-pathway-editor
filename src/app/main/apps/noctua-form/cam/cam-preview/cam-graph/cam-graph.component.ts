import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import * as shape from 'd3-shape';
import { Edge, Node, Layout } from '@swimlane/ngx-graph';
import { noctuaAnimations } from './../../../../../../../@noctua/animations';


import { NoctuaFormDialogService } from './../../../services/dialog.service';
import {
  noctuaFormConfig,
  NoctuaActivityConnectorService,
  NoctuaFormConfigService,
  NoctuaActivityFormService,
  CamService,
  Cam,
  Activity,
  ConnectorActivity,
  NoctuaFormMenuService,
  LeftPanel
} from '@geneontology/noctua-form-base';
import { NoctuaConfirmDialogService } from '@noctua/components/confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'noc-cam-graph',
  templateUrl: './cam-graph.component.html',
  styleUrls: ['./cam-graph.component.scss'],
  animations: noctuaAnimations
})
export class CamGraphComponent implements OnInit, OnDestroy {
  _nodes: Node[];
  _edges: Edge[];
  searchCriteria: any = {};
  searchFormData: any = [];
  searchForm: FormGroup;

  @Input('cam')
  public cam: Cam;

  // @Input('nodes')
  // nodes: Node[];  

  //@Input('edges')
  //edges: Edge[];

  @Input() set nodes(value: Node[]) {
    this._nodes = [...value];
    this.update$.next(true);
  }

  get nodes(): Node[] {
    return this._nodes;
  }

  @Input() set edges(value: Edge[]) {
    this._edges = [...value];
    this.update$.next(true);
  }

  get edges(): Edge[] {
    return this._edges;
  }

  layout: String | Layout = 'dagreCluster';
  layouts: any[] = [
    {
      label: 'Dagre',
      value: 'dagre',
    },
    {
      label: 'Dagre Cluster',
      value: 'dagreCluster',
      isClustered: true,
    },
    {
      label: 'Cola Force Directed',
      value: 'colaForceDirected',
      isClustered: true,
    },
    {
      label: 'D3 Force Directed',
      value: 'd3ForceDirected',
    },
  ];


  // line interpolation
  curveType = 'Bundle';
  curve: any = shape.curveLinear;
  interpolationTypes = [
    'Bundle',
    'Cardinal',
    'Catmull Rom',
    'Linear',
    'Monotone X',
    'Monotone Y',
    'Natural',
    'Step',
    'Step After',
    'Step Before'
  ];

  draggingEnabled = false;
  panningEnabled = true;
  zoomEnabled = false;

  zoomSpeed = 0.1;
  minZoomLevel = 0.1;
  maxZoomLevel = 4.0;
  panOnZoom = false;

  autoZoom = false;
  autoCenter = true;

  update$: Subject<boolean> = new Subject();
  center$: Subject<boolean> = new Subject();
  zoomToFit$: Subject<boolean> = new Subject();

  modelId = '';

  private unsubscribeAll: Subject<any>;

  constructor(public camService: CamService,
    public noctuaFormMenuService: NoctuaFormMenuService,
    public noctuaFormConfigService: NoctuaFormConfigService,
    private confirmDialogService: NoctuaConfirmDialogService,
    private noctuaActivityConnectorService: NoctuaActivityConnectorService,
    public noctuaActivityFormService: NoctuaActivityFormService,
    private noctuaFormDialogService: NoctuaFormDialogService,
  ) {

    this.unsubscribeAll = new Subject();
  }


  public layoutSettings = {
    orientation: 'TB'
  };
  //  public curve: any = shape.curveLinear;
  // public layout: Layout = new DagreNodesOnlyLayout();

  ngOnInit() {
    this.setInterpolationType(this.curveType);
  }

  setInterpolationType(curveType) {
    this.curveType = curveType;
    if (curveType === 'Bundle') {
      this.curve = shape.curveBundle.beta(1);
    }
    if (curveType === 'Cardinal') {
      this.curve = shape.curveCardinal;
    }
    if (curveType === 'Catmull Rom') {
      this.curve = shape.curveCatmullRom;
    }
    if (curveType === 'Linear') {
      this.curve = shape.curveLinear;
    }
    if (curveType === 'Monotone X') {
      this.curve = shape.curveMonotoneX;
    }
    if (curveType === 'Monotone Y') {
      this.curve = shape.curveMonotoneY;
    }
    if (curveType === 'Natural') {
      this.curve = shape.curveNatural;
    }
    if (curveType === 'Step') {
      this.curve = shape.curveStep;
    }
    if (curveType === 'Step After') {
      this.curve = shape.curveStepAfter;
    }
    if (curveType === 'Step Before') {
      this.curve = shape.curveStepBefore;
    }
  }

  setLayout(): void {
    // this.layout = layoutName;
  }

  addActivity() {
    this.openForm(location);
  }

  openForm(location?) {
    this.noctuaActivityFormService.mfLocation = location;
    this.noctuaActivityFormService.initializeForm();
    //this.noctuaFormMenuService.openRightDrawer(LeftPanel.activityForm);
  }

  openActivityConnectorList(activity: Activity) {
    this.camService.onCamChanged.next(this.cam);
    this.camService.activity = activity;
    this.noctuaActivityConnectorService.subjectActivity = activity;
    this.noctuaActivityConnectorService.onActivityChanged.next(activity);
    // this.noctuaFormMenuService.openRightDrawer(LeftPanel.connectorForm);
  }

  public getStyles(node: Node): any {
    return {
      "background-color": node.data.backgroundColor,
    }
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next(null);
    this.unsubscribeAll.complete();
  }
}
