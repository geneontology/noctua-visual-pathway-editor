import { noctuaFormConfig } from './../../noctua-form-config';
import { Entity } from './../../models/activity/entity';
import * as EntityDefinition from './entity-definition';
import { ActivityNodeDisplay, ActivityNodeType } from './../../models/activity/activity-node';
import { cloneDeep, each, uniqWith } from 'lodash';

import shexJson from './../shapes.json'
import shapeTerms from './../shape-terms.json'
import { ShexShapeAssociation } from '../shape';
import { DataUtils } from './data-utils';

export enum CardinalityType {
    none = 'none',
    oneToOne = 'oneToOne',
    oneToMany = 'oneToMany',
}

export interface ShapeDescription {
    id: string;
    label: string;
    rangeLabel?: string;
    node: ActivityNodeDisplay;
    predicate: Entity;
    cardinality: CardinalityType;
}

export interface PredicateExpression {
    id: string;
    label: string;
    cardinality: number;
}

const addCausalEdges = (edges: Entity[]): ShapeDescription[] => {
    const causalShapeDescriptions: ShapeDescription[] = [];

    each(edges, (edge: Entity) => {
        causalShapeDescriptions.push({
            id: ActivityNodeType.GoBiologicalProcess,
            node: <ActivityNodeDisplay>{
                type: ActivityNodeType.GoBiologicalProcess,
                category: [EntityDefinition.GoBiologicalProcess],
                label: `MF ${edge.label} BP`,
                aspect: 'P',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.bp,
                isKey: true,
                relationEditable: true,
                weight: 10,
            },
            predicate: edge,
            cardinality: CardinalityType.oneToOne
        } as ShapeDescription);
    });

    return causalShapeDescriptions;
};

export function compareRange(a, b) {
    return a.id === b.id;
}

export const getShexJson = (subjectIds: string[]) => {
    const pred = []
    const lookupTable = DataUtils.genTermLookupTable();
    const shapes = shexJson.goshapes as ShexShapeAssociation[];
    subjectIds.forEach((subjectId: string) => {
        const subjectShapes = DataUtils.getSubjectShapes(shapes, subjectId);
        if (subjectShapes) {
            const predicates = DataUtils.getPredicates(shapes);
            const entities = DataUtils.getRangeLabels(subjectShapes, lookupTable)

            pred.push(...entities)
        }
    });

    return uniqWith(pred, compareRange) as any

    // return pred
}


// ORDER MATTERS A LOT
// What can you insert
export const canInsertEntity = {
    [ActivityNodeType.GoMolecularEntity]: [
        <ShapeDescription>{
            label: 'part of',
            rangeLabel: 'Protein Complex',
            id: ActivityNodeType.GoProteinContainingComplex,
            node: <ActivityNodeDisplay>{
                type: ActivityNodeType.GoProteinContainingComplex,
                category: [EntityDefinition.GoProteinContainingComplex],
                label: '(GP) part of (Protein Complex)',
                displaySection: noctuaFormConfig.displaySection.gp,
                displayGroup: noctuaFormConfig.displayGroup.gp,
                weight: 3,
                isKey: false,
                showInMenu: true,
            },
            predicate: noctuaFormConfig.edge.partOf,
            cardinality: CardinalityType.oneToMany
        }
    ],

    [ActivityNodeType.GoProteinContainingComplex]: [
        <ShapeDescription>{
            label: 'has part',
            rangeLabel: 'Gene Product',
            id: ActivityNodeType.GoMolecularEntity,
            node: <ActivityNodeDisplay>{
                type: ActivityNodeType.GoMolecularEntity,
                category: [EntityDefinition.GoMolecularEntity, EntityDefinition.GoProteinContainingComplex],
                label: '(Protein Complex) has part (GP)',
                displaySection: noctuaFormConfig.displaySection.gp,
                displayGroup: noctuaFormConfig.displayGroup.gp,
                weight: 3,
                isKey: false,
                showInMenu: true,
            },
            predicate: noctuaFormConfig.edge.hasPart,
            cardinality: CardinalityType.oneToMany
        },
    ],
    [ActivityNodeType.GoMolecularFunction]: [
        <ShapeDescription>{
            label: 'enabled by Protein Complex',
            id: ActivityNodeType.GoProteinContainingComplex,
            node: <ActivityNodeDisplay>{
                id: EntityDefinition.GoProteinContainingComplex.id,
                type: ActivityNodeType.GoProteinContainingComplex,
                category: [EntityDefinition.GoProteinContainingComplex],
                label: '(MF) enabled by (Protein Complex)',
                displaySection: noctuaFormConfig.displaySection.gp,
                displayGroup: noctuaFormConfig.displayGroup.gp,
                termRequired: true,
                weight: 2,
                isKey: true
            },
            predicate: noctuaFormConfig.edge.enabledBy,
            cardinality: CardinalityType.oneToOne
        },
        <ShapeDescription>{
            label: 'enabled by GP',
            id: ActivityNodeType.GoMolecularEntity,
            node: <ActivityNodeDisplay>{
                id: EntityDefinition.GoMolecularEntity.id,
                type: ActivityNodeType.GoMolecularEntity,
                category: [EntityDefinition.GoMolecularEntity, EntityDefinition.GoProteinContainingComplex],
                label: '(MF) enabled by (GP)',
                displaySection: noctuaFormConfig.displaySection.gp,
                displayGroup: noctuaFormConfig.displayGroup.gp,
                termRequired: true,
                weight: 2,
                isKey: true
            },
            predicate: noctuaFormConfig.edge.enabledBy,
            cardinality: CardinalityType.oneToOne
        },
        <ShapeDescription>{
            label: 'part of',
            rangeLabel: 'Biological Process',
            id: ActivityNodeType.GoBiologicalProcess,
            node: <ActivityNodeDisplay>{
                type: ActivityNodeType.GoBiologicalProcess,
                category: [EntityDefinition.GoBiologicalProcess],
                label: '(MF) part of (BP)',
                aspect: 'P',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.bp,
                weight: 10,
                showInMenu: true,
            },
            predicate: noctuaFormConfig.edge.partOf,
            cardinality: CardinalityType.oneToOne
        },
        <ShapeDescription>{
            label: 'occurs in',
            rangeLabel: 'Cellular Component',
            id: ActivityNodeType.GoCellularComponent,
            node: <ActivityNodeDisplay>{
                type: ActivityNodeType.GoCellularComponent,
                category: [EntityDefinition.GoCellularComponent],
                label: '(MF) occurs in (CC)',
                aspect: 'C',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.cc,
                weight: 20,
                showInMenu: true,
            },
            predicate: noctuaFormConfig.edge.occursIn,
            cardinality: CardinalityType.oneToOne
        },
        <ShapeDescription>{
            label: 'has input',
            rangeLabel: 'Gene Product/Protein Complex',
            id: ActivityNodeType.GoChemicalEntityHasInput,
            node: <ActivityNodeDisplay>{
                category: [EntityDefinition.GoMolecularEntity, EntityDefinition.GoProteinContainingComplex],
                type: ActivityNodeType.GoChemicalEntityHasInput,
                label: 'has input (Chemical/Protein Complex)',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.mf,
                isExtension: true,
                weight: 4,
                showInMenu: true,
            },
            predicate: noctuaFormConfig.edge.hasInput,
            cardinality: CardinalityType.oneToMany
        },
        <ShapeDescription>{
            label: 'happens during',
            rangeLabel: 'Biological Phase/Stage/Plant Stage',
            id: ActivityNodeType.GoBiologicalPhase,
            node: <ActivityNodeDisplay>{
                category: [EntityDefinition.GoBiologicalPhase, EntityDefinition.UberonStage],
                type: ActivityNodeType.GoBiologicalPhase,
                label: 'happens during (Biological Phase/Stage/Plant Stage)',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.mf,
                isExtension: true,
                weight: 3,
                showInMenu: true,
            },
            predicate: noctuaFormConfig.edge.happensDuring,
            cardinality: CardinalityType.oneToOne
        },

        // Causal Edges
        ...addCausalEdges([
            Entity.createEntity(noctuaFormConfig.edge.causallyUpstreamOfOrWithin),
            Entity.createEntity(noctuaFormConfig.edge.causallyUpstreamOf),
            Entity.createEntity(noctuaFormConfig.edge.causallyUpstreamOfNegativeEffect),
            Entity.createEntity(noctuaFormConfig.edge.causallyUpstreamOfPositiveEffect),
            Entity.createEntity(noctuaFormConfig.edge.causallyUpstreamOfOrWithinPositiveEffect),
            Entity.createEntity(noctuaFormConfig.edge.causallyUpstreamOfOrWithinNegativeEffect),
        ])
    ],
    [ActivityNodeType.GoBiologicalProcess]: [
        <ShapeDescription>{
            label: 'part of',
            rangeLabel: 'Biological Process',
            id: ActivityNodeType.GoBiologicalProcess,
            node: <ActivityNodeDisplay>{
                category: [EntityDefinition.GoBiologicalProcess],
                type: ActivityNodeType.GoBiologicalProcess,
                label: 'part of (BP)',
                aspect: 'P',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.bp,
                isExtension: true,
                weight: 10,
                showInMenu: true,
            },
            predicate: noctuaFormConfig.edge.partOf,
            cardinality: CardinalityType.oneToOne
        },
    ],
    [ActivityNodeType.GoCellularComponent]: [

        <ShapeDescription>{
            label: 'part of',
            rangeLabel: 'CC/Cell/Anatomy/Organism',
            id: ActivityNodeType.GoAnatomicalEntity,
            node: <ActivityNodeDisplay>{
                category: [EntityDefinition.GoAnatomicalEntity, EntityDefinition.GoCellTypeEntity, EntityDefinition.GoOrganism],
                type: ActivityNodeType.GoAnatomicalEntity,
                label: 'part of (CC/Cell/Anatomy/Organism)',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.cc,
                isExtension: true,
                weight: 40,
                showInMenu: true,
            },
            predicate: noctuaFormConfig.edge.partOf,
            cardinality: CardinalityType.oneToOne
        },
    ],
    [ActivityNodeType.GoCellTypeEntity]: [
        <ShapeDescription>{
            label: 'part of',
            rangeLabel: 'CC/Cell/Anatomy/Organism',
            id: ActivityNodeType.GoAnatomicalEntity,
            node: <ActivityNodeDisplay>{
                category: [EntityDefinition.GoAnatomicalEntity, EntityDefinition.GoCellTypeEntity, EntityDefinition.GoOrganism],
                type: ActivityNodeType.GoAnatomicalEntity,
                label: 'part of (CC/Cell/Anatomy/Organism)',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.cc,
                isExtension: true,
                weight: 40,
                showInMenu: true,
            },
            predicate: noctuaFormConfig.edge.partOf,
            cardinality: CardinalityType.oneToOne
        }
    ],
    [ActivityNodeType.GoAnatomicalEntity]: [
        <ShapeDescription>{
            label: 'part of',
            rangeLabel: 'CC/Cell/Anatomy/Organism',
            id: ActivityNodeType.GoAnatomicalEntity,
            node: <ActivityNodeDisplay>{
                category: [EntityDefinition.GoAnatomicalEntity, EntityDefinition.GoCellTypeEntity, EntityDefinition.GoOrganism],
                type: ActivityNodeType.GoAnatomicalEntity,
                label: 'part of (CC/Cell/Anatomy/Organism)',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.cc,
                isExtension: true,
                weight: 40,
                showInMenu: true,
            },
            predicate: noctuaFormConfig.edge.partOf,
            cardinality: CardinalityType.oneToOne
        },
    ],
    [ActivityNodeType.GoChemicalEntity]: [
        <ShapeDescription>{
            label: 'located in',
            rangeLabel: 'Cellular Component',
            id: ActivityNodeType.GoCellularComponent,
            node: <ActivityNodeDisplay>{
                category: [EntityDefinition.GoCellularComponent],
                type: ActivityNodeType.GoCellularComponent,
                aspect: 'C',
                label: 'located in (CC)',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.cc,
                isExtension: true,
                weight: 20,
                showInMenu: true,
            },
            predicate: noctuaFormConfig.edge.locatedIn,
            cardinality: CardinalityType.oneToOne
        },
    ]
};



