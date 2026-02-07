import { Injectable } from '@angular/core';

import { parseContext, CurieUtil } from '@geneontology/curie-util-es5';

import { goContextConfig } from './../data/go-context';

@Injectable({
  providedIn: 'root'
})
export class CurieService {

  private _curie: any;

  constructor() {
    const map = parseContext(goContextConfig);
    this._curie = new CurieUtil(map);
  }

  getCurieUtil() {
    return this._curie;
  }

}
