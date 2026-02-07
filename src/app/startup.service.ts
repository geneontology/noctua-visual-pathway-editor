import { Injectable, inject } from '@angular/core';
import { NoctuaDataService } from '@noctua.common/services/noctua-data.service';


@Injectable()
export class StartupService {
  private dataService = inject(NoctuaDataService);


  constructor() {
  }

  loadData() {
    return this.dataService.setup();
  }

}




