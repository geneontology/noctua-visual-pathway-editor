
import { StencilItem, StencilItemNode } from './../data/cam-stencil';
import { StencilNode, NodeCellList } from './../services/shapes.service';
import * as joint from 'jointjs';
import { cloneDeep, each } from "lodash";
import { CamCanvas } from "./cam-canvas";

export class CamStencil {

    stencils: any[] = [];
    camCanvas: CamCanvas;
    stencilEl
    selectedStencilElement;

    onAddElement: (element: joint.shapes.noctua.NodeCellList, x: number, y: number) => NodeCellList;

    constructor(camCanvas: CamCanvas, stencils: StencilItem[]) {
        this.camCanvas = camCanvas;
        this.stencils = stencils;
        this._initializeStencils(stencils);
    }

    private _initializeStencils(stencils: StencilItem[]) {
        this.stencils = [];
        each(stencils, (stencil: StencilItem) => {
            const stencilGraph = new joint.dia.Graph();
            const stencilPaper = this.generateStencilPaper(stencil, stencilGraph);

            this.addStencilGraph(stencilGraph, stencil.nodes);
            stencilPaper.on('cell:pointerdown', this.onMouseDown(stencil.id, this.camCanvas.canvasPaper));

            this.stencils.push({
                id: stencil.id,
                paper: stencilPaper,
                graph: stencilGraph
            });
        });
    }


    addStencilGraph(graph: joint.dia.Graph, stencilNodes: StencilItemNode[]) {
        const nodes = [];

        each(stencilNodes, (stencilItemNode: StencilItemNode) => {
            const el = new StencilNode();
            // .size(120, 80)
            // .setColor(cam.backgroundColor)
            el.setIcon(stencilItemNode.iconUrl);
            el.attr('label/text', stencilItemNode.label);
            el.set({ node: cloneDeep(stencilItemNode) });

            nodes.push(el);
        });

        graph.resetCells(nodes);
        this._layout(graph);
    }

    private generateStencilPaper(stencil: StencilItem, stencilGraph: joint.dia.Graph): joint.dia.Paper {
        const stencilPaper = new joint.dia.Paper({
            el: document.getElementById(stencil.id),
            height: stencil.nodes.length * 120,
            width: '100%',
            model: stencilGraph,
            interactive: false
        });

        return stencilPaper;
    }

    private onMouseDown(name: string, canvasPaper: joint.dia.Paper) {
        return (cellView, e, x, y) => {
            $('#noc-canvas').append('<div id="noc-flypaper" style="position:fixed;z-index:100000;opacity:.7;pointer-event:none;"></div>');
            const flyGraph = new joint.dia.Graph();
            new joint.dia.Paper({
                el: document.getElementById('noc-flypaper'),
                model: flyGraph,
                interactive: false
            });
            const flyShape = cellView.model.clone();
            const pos = cellView.model.position();
            const offset = {
                x: x - pos.x,
                y: y - pos.y
            };

            this.selectedStencilElement = cellView.model;
            flyShape.position(0, 0);
            flyGraph.addCell(flyShape);

            $('#noc-flypaper').offset({
                left: e.pageX - offset.x,
                top: e.pageY - offset.y
            });
            $('#noc-canvas').on('mousemove.fly', (e) => {
                $('#noc-flypaper').offset({
                    left: e.pageX - offset.x,
                    top: e.pageY - offset.y
                });
            });
            $('#noc-canvas').on('mouseup.fly', (e) => {
                const x1 = e.pageX;
                const y1 = e.pageY;
                const target = canvasPaper.$el.offset();

                // Dropped over paper?
                if (x1 > target.left && x1 < target.left + canvasPaper.$el.width() && y1 > target.top && y1 < target.top + canvasPaper.$el.height()) {
                    this.onAddElement(this.selectedStencilElement, x1 - target.left - offset.x, y1 - target.top - offset.y);
                    //  el.position(x1 - target.left - offset.x, y1 - target.top - offset.y);
                }
                $('#noc-canvas').off('mousemove.fly').off('mouseup.fly');
                flyShape.remove();
                $('#noc-flypaper').remove();
            });
        }
    }

    private _layout(graph: joint.dia.Graph) {
        let currentY = 10;
        graph.getElements().forEach((el) => {
            //Sel.getBBox().bottomRight();
            el.position(10, currentY);
            currentY += el.size().height + 10;
        });
    }

    private _layoutGraph(graph: joint.dia.Graph) {
        const autoLayoutElements = [];
        graph.getElements().forEach((el) => {
            if (el.attr('./visibility') !== 'hidden') {
                autoLayoutElements.push(el);
            }
        });
        // Automatic Layout
        joint.layout.DirectedGraph.layout(graph.getSubgraph(autoLayoutElements), {
            align: 'UR',
            setVertices: true,
            setLabels: true,
            marginX: 0,
            marginY: 0,
            rankSep: 0,
            // nodeSep: 2000,
            //edgeSep: 2000,
            rankDir: "LR"
        });
    }

}