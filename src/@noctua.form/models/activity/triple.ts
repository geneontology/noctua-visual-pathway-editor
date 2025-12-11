
import { CardTriple } from 'scard-graph-ts';
import { v4 as uuid } from 'uuid';
import { Activity } from './activity';

import { ActivityNode } from './activity-node';
import { Predicate } from './predicate';
import { NoctuaFormUtils } from '../../utils/noctua-form-utils';

export class Triple<T extends ActivityNode | Activity> {

  object: T;
  predicate: Predicate;
  subject: T;

  constructor(subject: T, object: T, predicate: Predicate) {
    this.subject = subject;
    this.object = object;
    this.predicate = predicate;
  }

  get id(): string {
    return NoctuaFormUtils.generateTripleId(this.subject, this.predicate, this.object);
  }

  isTripleComplete() {
    return this.subject && this.object && this.predicate;
  }
}

export class ActivityTriple<T extends Activity> {
  objectId: string;
  predicateId: string;
  subjectId: string;
  title: string;
  triples: ActivityTriple<T>[];
  object: T;
  predicate: T;
  subject: T;

  constructor(subject: T, object: T, predicate: T) {
    this.subject = subject;
    this.object = object;
    this.predicate = predicate;
  }

  get id(): string {
    return NoctuaFormUtils.generateTripleId(this.subject, this.predicate, this.object);
  }



  getTripleIds() {
    return {
      subjectId: this.subject.id,
      predicateId: this.predicate.id,
      objectId: this.object.id
    }
  }

}

export function compareTripleWeight(a: Triple<ActivityNode>, b: Triple<ActivityNode>): number {
  if (a.object.weight < b.object.weight) {
    return -1;
  } else {
    return 1;
  }
}
