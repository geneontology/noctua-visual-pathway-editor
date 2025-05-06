import { cloneDeep } from "lodash";
import { ShexShapeAssociation } from "../shape";
import shapeTerms from './../shape-terms.json'
import { Entity } from "./../../models/activity/entity";

export class DataUtils {

  public static toTitleCase(str) {
    str = str.toLowerCase().split(' ');
    for (var i = 0; i < str.length; i++) {
      str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
    }
    return str.join(' ');
  }

  public static genTermLookupTable() {
    const result = {};
    shapeTerms.forEach((term) => {
      result[term.id] = term
    })

    return result;
  }

  public static getSubjectShapes(shapes: ShexShapeAssociation[], subjectId): ShexShapeAssociation[] {
    return shapes.filter(shape => {
      return shape.subject === subjectId && !shape.exclude_from_extensions;
    });
  }

  public static getPredicates(shapes: ShexShapeAssociation[]): string[] {
    const predicates = shapes.map((shape) => {
      return shape.predicate
    });

    return [...new Set(predicates)]

  }

  public static getRangeBySubject(shapes: ShexShapeAssociation[], subjectId: string, predicateId: string): ShexShapeAssociation {
    return shapes.find(shape => {
      return shape.subject === subjectId &&
        shape.predicate === predicateId &&
        !shape.exclude_from_extensions;
    });
  }

  public static getRangeLabels(shapes: ShexShapeAssociation[], lookupTable): string[] {
    const predicates = shapes.map((shape) => {
      const range = shape.object.map((term) => {
        return lookupTable[term]?.label;
      })

      const result = cloneDeep(lookupTable[shape.predicate])
      result['rangeLabel'] = range.join(', ');

      return result;

    });

    return predicates;

  }


  public static processHasParticipants(data): any[] {
    const nodeMap = new Map(data.nodes.map(node => [node.id, node.lbl]));

    return data.edges
      .filter(edge => edge.pred === "RO:0000057")
      .map(edge => ({
        id: edge.obj,
        label: nodeMap.get(edge.obj) || ''
      }));
  }

  public static findCommonItems(itemsA, itemsB) {
    const idSetB = new Set(itemsB.map(item => item.id));

    return itemsA.filter(item => idSetB.has(item.id));
  }

  public static findItemsNotInB(listA, listB) {
    const idSetB = new Set(listB.map(item => item.id));

    return listA.filter(item => !idSetB.has(item.id));
  }

  public static mergeUniqueLists(...lists: Entity[][]): Entity[] {
    const uniqueMap = new Map<string, Entity>();

    for (const list of lists) {
      for (const item of list) {
        if (!uniqueMap.has(item.id)) {
          uniqueMap.set(item.id, item);
        }
      }
    }

    return Array.from(uniqueMap.values());
  }
}