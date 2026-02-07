import { Injectable, inject } from '@angular/core';
import { NoctuaDataService } from '@noctua.common/services/noctua-data.service';
import { BehaviorSubject } from 'rxjs';


@Injectable()
export class StartupService {
  private dataService = inject(NoctuaDataService);


  constructor() {
    const self = this;

  }

  loadData() {
    return this.dataService.setup();
  }

}




