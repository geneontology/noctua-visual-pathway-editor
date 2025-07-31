import { cloneDeep } from "lodash";
import { ShexShapeAssociation } from "../shape";
import shapeTerms from './../shape-terms.json'
import allowedDBs from './../with-form-prefix.json'
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

      if (result) {
        result['rangeLabel'] = range.join('/');
      } else {
        result['rangeLabel'] = '';
      }

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


  public static validateDatabaseIdentifiers(input: string): string | null {

    const identifiers = input.split(/[,|]/);
    const allowedLowerCase = new Set(allowedDBs.map(db => db.toLowerCase()));

    for (const identifier of identifiers) {
      const trimmed = identifier.trim();
      if (!trimmed) continue; // Skip empty entries

      const colonIndex = trimmed.indexOf(':');
      if (colonIndex === -1) {
        return `Invalid format: "${trimmed}" - expected format is "DATABASE:accession"`;
      }

      const dbPrefix = trimmed.substring(0, colonIndex);
      const dbPrefixLower = dbPrefix.toLowerCase();

      if (!allowedLowerCase.has(dbPrefixLower)) {
        return `Invalid database prefix: "${dbPrefix}" is not part of allowed entities`;
      }
    }

    return null; // All identifiers are valid
  }

  public static correctDatabaseIdentifierCase(input: string): string {
    const parts = input.split(/([,|])/);

    const caseMap = new Map<string, string>();
    allowedDBs.forEach(db => {
      caseMap.set(db.toLowerCase(), db);
    });

    const correctedParts = parts.map(part => {
      if (part === ',' || part === '|') {
        return part;
      }

      const trimmed = part.trim();
      if (!trimmed) return part;

      // Extract database prefix and accession
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex === -1) {
        return part; // Return original if invalid format
      }

      const dbPrefix = trimmed.substring(0, colonIndex);
      const accession = trimmed.substring(colonIndex);
      const dbPrefixLower = dbPrefix.toLowerCase();

      // Get the correct case from our map
      const correctCase = caseMap.get(dbPrefixLower);
      if (correctCase) {
        // Preserve any leading/trailing whitespace from original part
        const leadingSpace = part.match(/^\s*/)?.[0] || '';
        const trailingSpace = part.match(/\s*$/)?.[0] || '';
        return leadingSpace + correctCase + accession + trailingSpace;
      }

      return part; // Return original if not found in allowed list
    });

    return correctedParts.join('');
  }
}