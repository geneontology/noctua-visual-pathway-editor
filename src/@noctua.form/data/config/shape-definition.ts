import { noctuaFormConfig } from './../../noctua-form-config';
import { Entity } from './../../models/activity/entity';
import * as EntityDefinition from './entity-definition';
import { ActivityNodeDisplay, ActivityNodeType } from './../../models/activity/activity-node';
import { each, uniqWith } from 'lodash';

import shexJson from './../shapes.json'
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
            node: {
                type: ActivityNodeType.GoBiologicalProcess,
                category: [EntityDefinition.GoBiologicalProcess],
                label: `MF ${edge.label} BP`,
                aspect: 'P',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.bp,
                isKey: true,
                relationEditable: true,
                weight: 10,
            } as ActivityNodeDisplay,
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
        ({
            label: 'part of',
            rangeLabel: 'Protein Complex',
            id: ActivityNodeType.GoProteinContainingComplex,
            node: {
                type: ActivityNodeType.GoProteinContainingComplex,
                category: [EntityDefinition.GoProteinContainingComplex],
                label: '(GP) part of (Protein Complex)',
                displaySection: noctuaFormConfig.displaySection.gp,
                displayGroup: noctuaFormConfig.displayGroup.gp,
                weight: 3,
                isKey: false,
                showInMenu: true,
            } as ActivityNodeDisplay,
            predicate: noctuaFormConfig.edge.partOf,
            cardinality: CardinalityType.oneToMany
        } as ShapeDescription)
    ],

    [ActivityNodeType.GoProteinContainingComplex]: [
        ({
            label: 'has part',
            rangeLabel: 'Gene Product',
            id: ActivityNodeType.GoMolecularEntity,
            node: {
                type: ActivityNodeType.GoMolecularEntity,
                category: [EntityDefinition.GoMolecularEntity, EntityDefinition.GoProteinContainingComplex],
                label: '(Protein Complex) has part (GP)',
                displaySection: noctuaFormConfig.displaySection.gp,
                displayGroup: noctuaFormConfig.displayGroup.gp,
                weight: 3,
                isKey: false,
                showInMenu: true,
            } as ActivityNodeDisplay,
            predicate: noctuaFormConfig.edge.hasPart,
            cardinality: CardinalityType.oneToMany
        } as ShapeDescription),
    ],
    [ActivityNodeType.GoMolecularFunction]: [
        ({
            label: 'enabled by Protein Complex',
            id: ActivityNodeType.GoProteinContainingComplex,
            node: {
                id: EntityDefinition.GoProteinContainingComplex.id,
                type: ActivityNodeType.GoProteinContainingComplex,
                category: [EntityDefinition.GoProteinContainingComplex],
                label: '(MF) enabled by (Protein Complex)',
                displaySection: noctuaFormConfig.displaySection.gp,
                displayGroup: noctuaFormConfig.displayGroup.gp,
                termRequired: true,
                weight: 2,
                isKey: true
            } as ActivityNodeDisplay,
            predicate: noctuaFormConfig.edge.enabledBy,
            cardinality: CardinalityType.oneToOne
        } as ShapeDescription),
        ({
            label: 'enabled by GP',
            id: ActivityNodeType.GoMolecularEntity,
            node: {
                id: EntityDefinition.GoMolecularEntity.id,
                type: ActivityNodeType.GoMolecularEntity,
                category: [EntityDefinition.GoMolecularEntity, EntityDefinition.GoProteinContainingComplex],
                label: '(MF) enabled by (GP)',
                displaySection: noctuaFormConfig.displaySection.gp,
                displayGroup: noctuaFormConfig.displayGroup.gp,
                termRequired: true,
                weight: 2,
                isKey: true
            } as ActivityNodeDisplay,
            predicate: noctuaFormConfig.edge.enabledBy,
            cardinality: CardinalityType.oneToOne
        } as ShapeDescription),
        ({
            label: 'part of',
            rangeLabel: 'Biological Process',
            id: ActivityNodeType.GoBiologicalProcess,
            node: {
                type: ActivityNodeType.GoBiologicalProcess,
                category: [EntityDefinition.GoBiologicalProcess],
                label: '(MF) part of (BP)',
                aspect: 'P',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.bp,
                weight: 10,
                showInMenu: true,
            } as ActivityNodeDisplay,
            predicate: noctuaFormConfig.edge.partOf,
            cardinality: CardinalityType.oneToOne
        } as ShapeDescription),
        ({
            label: 'occurs in',
            rangeLabel: 'Cellular Component',
            id: ActivityNodeType.GoCellularComponent,
            node: {
                type: ActivityNodeType.GoCellularComponent,
                category: [EntityDefinition.GoCellularComponent],
                label: '(MF) occurs in (CC)',
                aspect: 'C',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.cc,
                weight: 20,
                showInMenu: true,
            } as ActivityNodeDisplay,
            predicate: noctuaFormConfig.edge.occursIn,
            cardinality: CardinalityType.oneToOne
        } as ShapeDescription),
        ({
            label: 'has input',
            rangeLabel: 'Gene Product/Protein Complex',
            id: ActivityNodeType.GoChemicalEntityHasInput,
            node: {
                category: [EntityDefinition.GoMolecularEntity, EntityDefinition.GoProteinContainingComplex],
                type: ActivityNodeType.GoChemicalEntityHasInput,
                label: 'has input (Gene Product/Protein Complex)',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.mf,
                isExtension: true,
                weight: 4,
                showInMenu: true,
            } as ActivityNodeDisplay,
            predicate: noctuaFormConfig.edge.hasInput,
            cardinality: CardinalityType.oneToMany
        } as ShapeDescription),
        ({
            label: 'happens during',
            rangeLabel: 'Biological Phase/Stage/Plant Stage',
            id: ActivityNodeType.GoBiologicalPhase,
            node: {
                category: [EntityDefinition.GoBiologicalPhase, EntityDefinition.UberonStage],
                type: ActivityNodeType.GoBiologicalPhase,
                label: 'happens during (Biological Phase/Stage/Plant Stage)',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.mf,
                isExtension: true,
                weight: 3,
                showInMenu: true,
            } as ActivityNodeDisplay,
            predicate: noctuaFormConfig.edge.happensDuring,
            cardinality: CardinalityType.oneToOne
        } as ShapeDescription),

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
        ({
            label: 'part of',
            rangeLabel: 'Biological Process',
            id: ActivityNodeType.GoBiologicalProcess,
            node: {
                category: [EntityDefinition.GoBiologicalProcess],
                type: ActivityNodeType.GoBiologicalProcess,
                label: 'part of (BP)',
                aspect: 'P',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.bp,
                isExtension: true,
                weight: 10,
                showInMenu: true,
            } as ActivityNodeDisplay,
            predicate: noctuaFormConfig.edge.partOf,
            cardinality: CardinalityType.oneToOne
        } as ShapeDescription),
    ],
    [ActivityNodeType.GoCellularComponent]: [

        ({
            label: 'part of',
            rangeLabel: 'CC/Cell/Anatomy/Organism',
            id: ActivityNodeType.GoAnatomicalEntity,
            node: {
                category: [EntityDefinition.GoAnatomicalEntity, EntityDefinition.GoCellTypeEntity, EntityDefinition.GoOrganism],
                type: ActivityNodeType.GoAnatomicalEntity,
                label: 'part of (CC/Cell/Anatomy/Organism)',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.cc,
                isExtension: true,
                weight: 40,
                showInMenu: true,
            } as ActivityNodeDisplay,
            predicate: noctuaFormConfig.edge.partOf,
            cardinality: CardinalityType.oneToOne
        } as ShapeDescription),
    ],
    [ActivityNodeType.GoCellTypeEntity]: [
        ({
            label: 'part of',
            rangeLabel: 'CC/Cell/Anatomy/Organism',
            id: ActivityNodeType.GoAnatomicalEntity,
            node: {
                category: [EntityDefinition.GoAnatomicalEntity, EntityDefinition.GoCellTypeEntity, EntityDefinition.GoOrganism],
                type: ActivityNodeType.GoAnatomicalEntity,
                label: 'part of (CC/Cell/Anatomy/Organism)',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.cc,
                isExtension: true,
                weight: 40,
                showInMenu: true,
            } as ActivityNodeDisplay,
            predicate: noctuaFormConfig.edge.partOf,
            cardinality: CardinalityType.oneToOne
        } as ShapeDescription)
    ],
    [ActivityNodeType.GoAnatomicalEntity]: [
        ({
            label: 'part of',
            rangeLabel: 'CC/Cell/Anatomy/Organism',
            id: ActivityNodeType.GoAnatomicalEntity,
            node: {
                category: [EntityDefinition.GoAnatomicalEntity, EntityDefinition.GoCellTypeEntity, EntityDefinition.GoOrganism],
                type: ActivityNodeType.GoAnatomicalEntity,
                label: 'part of (CC/Cell/Anatomy/Organism)',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.cc,
                isExtension: true,
                weight: 40,
                showInMenu: true,
            } as ActivityNodeDisplay,
            predicate: noctuaFormConfig.edge.partOf,
            cardinality: CardinalityType.oneToOne
        } as ShapeDescription),
    ],
    [ActivityNodeType.GoChemicalEntity]: [
        ({
            label: 'located in',
            rangeLabel: 'Cellular Component',
            id: ActivityNodeType.GoCellularComponent,
            node: {
                category: [EntityDefinition.GoCellularComponent],
                type: ActivityNodeType.GoCellularComponent,
                aspect: 'C',
                label: 'located in (CC)',
                displaySection: noctuaFormConfig.displaySection.fd,
                displayGroup: noctuaFormConfig.displayGroup.cc,
                isExtension: true,
                weight: 20,
                showInMenu: true,
            } as ActivityNodeDisplay,
            predicate: noctuaFormConfig.edge.locatedIn,
            cardinality: CardinalityType.oneToOne
        } as ShapeDescription),
    ]
};



