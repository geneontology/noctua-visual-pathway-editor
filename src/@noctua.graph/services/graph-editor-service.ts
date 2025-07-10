import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NoctuaFormConfigService } from '@geneontology/noctua-form-base';

@Injectable({
  providedIn: 'root'
})
export class NoctuaGraphEditorService {
  selectedGraphLayoutDetail
  selectedGraphLayoutSpacing: any;

  onGraphLayoutDetailChanged: BehaviorSubject<any>;
  onGraphLayoutSpacingChanged: BehaviorSubject<any>;
  constructor(
    private noctuaFormConfigService: NoctuaFormConfigService) {
    this.selectedGraphLayoutDetail = this.noctuaFormConfigService.graphLayoutDetail.selected;
    this.selectedGraphLayoutSpacing = this.noctuaFormConfigService.graphLayoutSpacing.selected;
    this.onGraphLayoutDetailChanged = new BehaviorSubject(null);
    this.onGraphLayoutSpacingChanged = new BehaviorSubject(null);
  }

}
