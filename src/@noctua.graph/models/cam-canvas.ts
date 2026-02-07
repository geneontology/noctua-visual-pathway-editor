import {
    Activity,
    ActivityNode,
    ActivityTreeNode,
    ActivityType,
    Cam,
    Entity,
    noctuaFormConfig,
    NoctuaFormUtils,
    Predicate,
    Triple
} from '@geneontology/noctua-form-base';
import { NodeCellType } from './shapes';
import { NodeCellList, NodeCellMolecule, NodeLink, StencilNode } from './../services/shapes.service';
import * as joint from 'jointjs';
import { each, cloneDeep, find } from 'lodash';
import { getEdgeColor } from './../data/edge-display';

export class CamCanvas {

    canvasPaper: joint.dia.Paper;
    canvasGraph: joint.dia.Graph;
    selectedStencilElement;
    elementOnClick: (element: joint.shapes.noctua.NodeCellList) => void;
    editOnClick: (element: joint.shapes.noctua.NodeCellList) => void;
    deleteOnClick: (element: joint.shapes.noctua.NodeCellList) => void;
    linkOnClick: (element: joint.shapes.noctua.NodeLink) => void;
    onUpdateCamLocations: (cam: Cam) => void
    onLinkCreated: (
        sourceId: string,
        targetId: string,
        link: joint.shapes.noctua.NodeLink) => void;
    cam: Cam;

    constructor() {
        this._initializeCanvas()
    }

    private _initializeCanvas() {
        this.canvasGraph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
        this.canvasPaper = new joint.dia.Paper({
            cellViewNamespace: joint.shapes,
            el: document.getElementById('noc-paper'),
            height: '100%',
            width: '100%',
            model: this.canvasGraph,
            restrictTranslate: true,
            multiLinks: false,
            markAvailable: true,
            // defaultConnectionPoint: { name: 'boundary', args: { extrapolate: true } },
            // defaultConnector: { name: 'rounded' },
            // defaultRouter: { name: 'orthogonal' },
            /*     defaultLink: new joint.dia.Link({
                  attrs: { '.marker-target': { d: 'M 10 0 L 0 5 L 10 10 z' } }
                }), */
            validateConnection: function (cellViewS, magnetS, cellViewT, _magnetT, _end, _linkView) {
                // Prevent linking from input ports.
                // if (magnetS && magnetS.getAttribute('port-group') === 'in') return false;
                // Prevent linking from output ports to input ports within one element.
                if (cellViewS === cellViewT) return false;
                // Prevent linking to input ports.
                /// return magnetT && magnetT.getAttribute('port-group') === 'in';

                return true; // (magnetS !== magnetT);
            },
            validateMagnet: function (_cellView, _magnet) {
                // Note that this is the default behaviour. Just showing it here for reference.
                // Disable linking interaction for magnets marked as passive (see below `.inPorts circle`).
                // return magnet.getAttribute('magnet') !== 'passive';
                return true;
            },

            // connectionStrategy: joint.connectionStrategies.pinAbsolute,
            defaultConnectionPoint: { name: 'boundary', args: { sticky: true } },

            defaultConnector: { name: 'smooth' },
            async: true,
            interactive: { labelMove: false },
            linkPinning: false,
            // frozen: true,
            gridSize: 10,
            drawGrid: {
                name: 'doubleMesh',
                args: [
                    { color: '#DDDDDD', thickness: 1 }, // settings for the primary mesh
                    { color: '#DDDDDD', scaleFactor: 5, thickness: 4 } //settings for the secondary mesh
                ]
            },
            sorting: joint.dia.Paper.sorting.APPROX,
            // markAvailable: true,
            defaultLink: function () {
                return NodeLink.create();
            },
            perpendicularLinks: false,

        });

        this.canvasPaper.on('blank:pointerdblclick', () => {
            // Remove all Highlighters from all cells
            this.unselectAll();
        });

        this.canvasPaper.on('element:pointerup', (_cellView) => {
            if (this.cam.layoutChanged) {
                this.cam.layoutChanged = false;
                this.updateLocation();
            }
        });

        this.canvasPaper.on('element:pointerdblclick', (cellView) => {
            const element = cellView.model;
            this.elementOnClick(element);

            if (element.get('type') !== NodeCellType.link) {
                const cell = element as NodeCellList
                this.selectNode(cell)
            }
        });

        this.canvasPaper.on('element:mouseover', (cellView) => {
            const element = cellView.model;
            if (element.get('type') !== NodeCellType.link) {
                const cell = element as NodeCellList
                cell.hover(true);
                this.highlightSuccessorNodes(cell)
            }
        });

        this.canvasPaper.on('element:mouseleave', (cellView) => {
            cellView.removeTools();
            const element = cellView.model;
            if (element.get('type') !== NodeCellType.link) {
                (element as NodeCellList).hover(false);
                this.unhighlightAllNodes()
            }
        });

        this.canvasPaper.on('link:mouseenter', (cellView) => {
            cellView.removeTools();
            const element = cellView.model;
            if (element.get('type') === NodeCellType.link) {
                (element as NodeLink).hover(true);
            }

        });

        this.canvasPaper.on('link:mouseleave', (cellView) => {
            cellView.removeTools();
            const element = cellView.model;
            if (element.get('type') === NodeCellType.link) {
                (element as NodeLink).hover(false);
            }

        });
        /* 'element:pointerup': function (elementView, evt, x, y) {
            const coordinates = new joint.g.Point(x, y);
            const elementAbove = elementView.model;
            const elementBelow = this.model.findModelsFromPoint(coordinates).find(function (el) {
                return (el.id !== elementAbove.id);
            });

            // If the two elements are connected already, don't
            if (elementBelow && self.canvasGraph.getNeighbors(elementBelow).indexOf(elementAbove) === -1) {

                // Move the element to the position before dragging.
                elementAbove.position(evt.data.x, evt.data.y);
                self.createLinkFromElements(elementAbove, elementBelow)

            }
        },
        'element:gate:click': function (elementView) {
            const element = elementView.model;
            const gateType = element.gate();
            const gateTypes = Object.keys(element.gateTypes);
            const index = gateTypes.indexOf(gateType);
            const newIndex = (index + 1) % gateTypes.length;
            element.gate(gateTypes[newIndex]);
        } */


        this.canvasPaper.on('link:pointerdblclick', (linkView) => {
            const link = linkView.model;

            this.linkOnClick(link);
            this.unselectAll();
        });

        this.canvasPaper.on('element:.edit:pointerdown', (elementView: joint.dia.ElementView, evt) => {
            evt.stopPropagation();

            const element = elementView.model;
            this.editOnClick(element);

        });

        this.canvasPaper.on('element:.delete:pointerdown', (elementView: joint.dia.ElementView, evt) => {
            evt.stopPropagation();

            const element = elementView.model;
            this.deleteOnClick(element);

        });

        this.canvasPaper.on('element:expand:pointerdown', (elementView: joint.dia.ElementView, evt) => {
            evt.stopPropagation();

            const model = elementView.model;
            const activity = model.prop('activity') as Activity;
            this.toggleActivityVisibility(model, activity);
        });


        this.canvasGraph.on('change:position', (_element: joint.dia.Element, _evt) => {
            this.cam.layoutChanged = true;
        });

        this.canvasGraph.on('change:source change:target', (link) => {
            const sourceId = link.get('source').id;
            const targetId = link.get('target').id;

            if (targetId && sourceId) {

                this.onLinkCreated(sourceId, targetId, link)
            }
        });
    }

    addLink(link: NodeLink, predicate: Predicate) {
        link.set({
            activity: predicate,
            id: predicate.uuid
        });

        link.setText(predicate.edge.label);


        // link.findView(this).addTools(tools);

    }

    highlightSuccessorNodes(node: NodeCellList) {
        this.unhighlightAllNodes()

        const predecessors = this.canvasGraph.getPredecessors(node)
        const successors = this.canvasGraph.getSuccessors(node)


        each(this.canvasGraph.getCells(), (cell: NodeCellList) => {
            if (cell.get('type') !== NodeCellType.link) {
                cell.setColor('grey', 200, 300);
            }
        })
        each(successors, (cell: NodeCellList) => {
            if (cell.get('type') !== NodeCellType.link) {
                cell.setColor('amber', 200, 300)
            }
        })

        each(predecessors, (cell: NodeCellList) => {
            if (cell.get('type') !== NodeCellType.link) {
                cell.setColor('yellow', 50, 100)
            }
        })
        node.setColor('yellow', 100, 200)
    }

    selectNode(node: NodeCellList) {
        this.unselectAll()

        node.setBorder('orange', 500,)

    }

    updateLocation() {
        each(this.canvasGraph.getElements(), (element: NodeCellList) => {
            if (element.get('type') !== NodeCellType.link) {
                const activity = element.prop('activity') as Activity
                if (activity) {
                    const position = element.position();

                    activity.position.x = position.x;
                    activity.position.y = position.y;
                }
            }
        })

        this.onUpdateCamLocations(this.cam)
    }

    unhighlightAllNodes() {
        each(this.canvasGraph.getCells(), (cell: NodeCellList) => {
            if (cell.get('type') !== NodeCellType.link) {
                const activity = cell.prop('activity') as Activity
                cell.setColor(activity.backgroundColor);
            }
        })
    }

    unselectAll() {
        each(this.canvasGraph.getCells(), (cell: NodeCellList) => {
            if (cell.get('type') !== NodeCellType.link) {
                cell.unsetBorder();
            }
        })
    }

    createLinkFromElements(source: joint.shapes.noctua.NodeCellList, target: joint.shapes.noctua.NodeCellList) {
        const subject = source.get('activity') as Activity;
        const object = target.get('activity') as Activity;

        this.createLink(subject, new Predicate(Entity.createEntity(noctuaFormConfig.edge.causallyUpstreamOf)), object)
    }

    createLink(subject: Activity, predicate: Predicate, object: Activity) {
        const triple = new Triple(subject, object, predicate);

        ///this.cam.addNode(predicate);
        //this.cam.addTriple(triple);
        this.createLinkFromTriple(triple, true);
    }

    createLinkFromTriple(triple: Triple<Activity>, autoLayout?: boolean) {
        const link = NodeLink.create();
        link.setText(triple.predicate.edge.label);
        link.set({
            activity: triple.predicate,
            id: triple.predicate.edge.id,
            source: {
                id: triple.subject.id,
                port: 'right'
            },
            target: {
                id: triple.object.id,
                port: 'left'
            }
        });

        link.addTo(this.canvasGraph);
        if (autoLayout) {
            this.autoLayoutGraph(this.canvasGraph, 'compact');
            // this.addCanvasGraph(this.activity);
        }
    }

    paperScale(delta: number, e) {
        const el = this.canvasPaper.$el;
        const newScale = this.canvasPaper.scale().sx + delta;

        if (newScale > 0.1 && delta < 10) {
            const offsetX = (e.offsetX || e.clientX - el.offset().left);
            const offsetY = (e.offsetY || e.clientY - el.offset().top);
            const localPoint = this._offsetToLocalPoint(offsetX, offsetY);

            this.canvasPaper.translate(0, 0);
            this.canvasPaper.scale(newScale, newScale, localPoint.x, localPoint.y);
        }
    };

    zoom(delta: number, e?) {
        if (e) {
            this.paperScale(delta, e);
        } else {
            this.canvasPaper.translate(0, 0);
            this.canvasPaper.scale(this.canvasPaper.scale().sx + delta, this.canvasPaper.scale().sx + delta)
        }
    }

    resetZoom() {
        this.canvasPaper.scale(1, 1)
    };

    toggleActivityVisibility(cell: joint.dia.Element, activity: Activity) {
        //this.activity.subgraphVisibility(activity, !activity.expanded);
        const elements = this.canvasGraph.getSuccessors(cell).concat(cell);
        // find all the links between successors and the element
        const subgraph = this.canvasGraph.getSubgraph(elements);

        if (activity.expanded) {
            subgraph.forEach((element) => {
                element.attr('./visibility', 'hidden');
            });
        } else {
            subgraph.forEach((element) => {
                element.attr('./visibility', 'visible');
            });
        }

        cell.attr('./visibility', 'visible');
        activity.expanded = !activity.expanded;

        this.autoLayoutGraph(this.canvasGraph, 'compact');

        this.canvasPaper.translate(0, 0);

        //  this.canvasPaper.
    }

    private _addGPEntity(treeNode: ActivityTreeNode, el: NodeCellList) {
        if (treeNode?.node?.displaySection.id === noctuaFormConfig.displaySection.gp.id) {
            if (treeNode.node?.term && treeNode.node.predicate.edge?.id !== noctuaFormConfig.edge.enabledBy.id) {
                el.addEntity(NoctuaFormUtils.pad('—', treeNode.node.treeLevel - 2)
                    + treeNode.node.predicate.edge?.label, treeNode.node.term.label,
                    treeNode.node.predicate.hasEvidence());
            }

            treeNode.children.forEach((child) => {
                this._addGPEntity(child, el)
            })
        }
    }

    private _addFDEntity(treeNode: ActivityTreeNode, el: NodeCellList) {
        if (treeNode.node?.displaySection.id === noctuaFormConfig.displaySection.fd.id) {
            if (treeNode.node?.term) {
                el.addEntity(NoctuaFormUtils.pad('—', treeNode.node.treeLevel - 2)
                    + treeNode.node.predicate.edge?.label, treeNode.node.term.label, treeNode.node.predicate.hasEvidence());
            }

            treeNode.children.forEach((child) => {
                this._addFDEntity(child, el)
            })
        }
    }

    createNode(activity: Activity, graphLayoutDetail: string): NodeCellList {
        const el = new NodeCellList()

        el.addIcon(`./assets/images/activity/coverage-${activity.summary.coverage}.png`)
        //.setSuccessorCount(activity.successorCount)

        if (graphLayoutDetail === noctuaFormConfig.graphLayoutDetail.options.detailed.id) {
            //if (activity.activityType === ActivityType.proteinComplex) {
            const gpNodes = activity.buildGPTrees();
            gpNodes.forEach(gpNode => this._addGPEntity(gpNode, el));
            // }

            const fdNodes = activity.buildTrees();

            fdNodes.forEach(fdNode => this._addFDEntity(fdNode, el));
        } else if (graphLayoutDetail === noctuaFormConfig.graphLayoutDetail.options.activity.id) {

            if (activity.mfNode) {
                const activityNodes = activity.getEdges(activity.mfNode.id)
                el.addEntity('', activity.mfNode?.term.label, activity.mfNode.predicate.hasEvidence());

                activityNodes.forEach((activityNode: Triple<ActivityNode>) => {
                    const canAdd = find(noctuaFormConfig.defaultGraphDisplayEdges, (edge: Entity) => edge.id === activityNode.predicate.edge?.id);

                    if (activityNode.object?.term.hasValue() && canAdd) {
                        el.addEntity(activityNode.object.predicate.edge.label, activityNode.object?.term.label,
                            activityNode.object.predicate.hasEvidence());
                    }
                })
            }
        }

        if (activity.gpNode) {
            el.addHeader(activity.gpNode?.term.label);
        } else {
            el.prop('GP info unavailable');
        }

        el.setColor(activity.backgroundColor);

        el.attr({
            expand: {
                event: 'element:expand:pointerdown',
                stroke: 'black',
                strokeWidth: 2
            },
        })
        el.set({
            activity: activity,
            id: activity.id,
            position: activity.position,
            //  size: activity.size,
        });

        return el
    }

    createMolecule(activity: Activity) {
        const el = new NodeCellMolecule()
        activity.size.width = 120;
        activity.size.height = 120;
        //.addActivityPorts()
        el.setColor(activity.backgroundColor)
        //.setSuccessorCount(activity.successorCount)  
        const activityType = activity.getActivityTypeDetail();
        const moleculeNode = activity.rootNode;

        el.prop({ 'name': [activityType ? activityType.label : 'Activity Unity'] });

        if (moleculeNode) {
            let label = moleculeNode.term.label

            if (activity.ccNode) {
                label += `\nlocated in: ${activity.ccNode.term.label}`;
            }
            el.setText(label);
        }

        el.attr({
            expand: {
                event: 'element:expand:pointerdown',
                stroke: 'black',
                strokeWidth: 2
            },
        })
        el.set({
            activity: activity,
            id: activity.id,
            position: activity.position,
            size: activity.size,
        });

        return el
    }

    addCanvasGraph(cam: Cam, graphLayoutDetail: string) {
        const nodes = [];

        this.cam = cam;
        this.canvasGraph.resetCells(nodes);

        each(cam.activities, (activity: Activity) => {
            if (activity.visible) {
                let el
                if (activity.activityType === ActivityType.molecule) {
                    el = this.createMolecule(activity);
                } else {
                    el = this.createNode(activity, graphLayoutDetail);
                }
                nodes.push(el);
            }
        });

        each(cam.causalRelations, (triple: Triple<Activity>) => {
            if (triple.predicate.visible && triple.isTripleComplete()) {
                const color = getEdgeColor(triple.predicate.edge.id);
                const link = NodeLink.create();
                if (triple.predicate.isReverseLink) {
                    this.reverseLink(triple, link)
                } else {
                    // link.set('connector', { name: 'jumpover', args: { type: 'gap' } })
                    link.setText(triple.predicate.edge.label);
                    link.set({
                        activity: triple.predicate,
                        source: {
                            id: triple.subject.id,
                        },
                        target: {
                            id: triple.object.id,
                        }
                    });
                }

                link.setColor(color)
                nodes.push(link);
            }
        });
        this.canvasPaper.setDimensions('30000px', '30000px')
        this.canvasPaper.scaleContentToFit({ minScaleX: 0.3, minScaleY: 0.3, maxScaleX: 1, maxScaleY: 1 });
        this.canvasGraph.resetCells(nodes);

        if (!cam.manualLayout) {
            this.autoLayoutGraph(this.canvasGraph, 'compact');
        }

        this.canvasPaper.unfreeze();
        this.canvasPaper.render();


        /*    each(self.canvasGraph.getCells(), (cell: any) => {
   
               self.mask.add(
                   cell.findView(self.canvasPaper),
                   { selector: 'body' },
                   'example-id',
                   {
                       layer: 'back',
                       attrs: {
                           'stroke': '#4666E5',
                           'stroke-width': 3,
                           'stroke-linejoin': 'round'
                       }
                   });
           }); */
    }

    reverseLink(triple: Triple<Activity>, link: NodeLink) {
        link.setText(triple.predicate.reverseLinkTitle);
        link.set({
            activity: triple.predicate,
            source: {
                id: triple.object.id,
            },
            target: {
                id: triple.subject.id,
            }
        });
    }

    addStencilGraph(graph: joint.dia.Graph, activities: Activity[]) {
        const nodes = [];

        each(activities, (activity: Activity) => {
            const el = new StencilNode()
            // .size(120, 80)
            // .setColor(activity.backgroundColor)
            //.setIcon(activity.iconUrl);
            el.attr('label/text', activity.title);
            el.set({ activity: cloneDeep(activity) });

            nodes.push(el);
        });

        graph.resetCells(nodes);
        this._layout(graph);
    }

    private _layout(graph: joint.dia.Graph) {
        let currentY = 10;
        graph.getElements().forEach((el) => {
            //Sel.getBBox().bottomRight();
            el.position(10, currentY);
            currentY += el.size().height + 10;
        });
    }

    autoLayoutGraph(graph, spacingId: string) {
        const autoLayoutElements = [];
        const manualLayoutElements = [];
        graph.getElements().forEach((el) => {
            if (el.attr('./visibility') !== 'hidden') {
                autoLayoutElements.push(el);
            }
        });

        if (spacingId === 'compact') {
            // Automatic Layout
            joint.layout.DirectedGraph.layout(graph.getSubgraph(autoLayoutElements), {
                align: 'UL',
                setLabels: true,
                rankSep: 50,
                marginX: 10,
                marginY: 10,
                ranker: 'network-simplex',
                // nodeSep: 2000,
                //edgeSep: 2000,
                rankDir: "TB"
            });
        } else {
            joint.layout.DirectedGraph.layout(graph.getSubgraph(autoLayoutElements), {
                align: 'UL',
                setLabels: true,
                marginX: 50,
                marginY: 50,
                rankSep: 200,
                ranker: 'network-simplex',
                // nodeSep: 2000,
                //edgeSep: 2000,
                rankDir: "TB"
            });
        }
        // Manual Layout
        manualLayoutElements.forEach(function (el) {
            const neighbor = graph.getNeighbors(el, { inbound: true })[0];
            if (!neighbor) return;
            const neighborPosition = neighbor.getBBox().bottomRight();
            el.position(neighborPosition.x + 20, neighborPosition.y - el.size().height / 2 - 20);
        });
    }

    private _offsetToLocalPoint(x, y) {
        const svgPoint = joint.Vectorizer.createSVGPoint(x, y);
        // Transform point into the viewport coordinate system.
        const pointTransformed = svgPoint.matrixTransform(this.canvasPaper.viewport.getCTM().inverse());
        return pointTransformed;
    }

}