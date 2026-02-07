import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NoctuaFormConfigService } from '@geneontology/noctua-form-base';

@Injectable({
  providedIn: 'root'
})
export class NoctuaGraphEditorService {
  private noctuaFormConfigService = inject(NoctuaFormConfigService);

  selectedGraphLayoutDetail
  selectedGraphLayoutSpacing: any;

  onGraphLayoutDetailChanged: BehaviorSubject<any>;
  onGraphLayoutSpacingChanged: BehaviorSubject<any>;
  constructor() {
    this.selectedGraphLayoutDetail = this.noctuaFormConfigService.graphLayoutDetail.selected;
    this.selectedGraphLayoutSpacing = this.noctuaFormConfigService.graphLayoutSpacing.selected;
    this.onGraphLayoutDetailChanged = new BehaviorSubject(null);
    this.onGraphLayoutSpacingChanged = new BehaviorSubject(null);
  }

}
