import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import {
  NoctuaFormConfigService,
  NoctuaUserService
} from '@geneontology/noctua-form-base';
import { NoctuaSearchService } from './../..//services/noctua-search.service';
import { NoctuaSearchMenuService } from '../../services/search-menu.service';

@Component({
  selector: 'noc-search-organisms',
  templateUrl: './search-organisms.component.html',
  styleUrls: ['./search-organisms.component.scss'],
})

export class SearchOrganismsComponent implements OnInit, OnDestroy {
  searchCriteria: any = {};
  searchForm: FormGroup;
  groupsForm: FormGroup;
  searchFormData: any = []

  private unsubscribeAll: Subject<any>;

  constructor(public noctuaUserService: NoctuaUserService,
    public noctuaSearchMenuService: NoctuaSearchMenuService,
    private formBuilder: FormBuilder,
    public noctuaFormConfigService: NoctuaFormConfigService,
    public noctuaSearchService: NoctuaSearchService) {
    // this.organisms = this.noctuaSearchService.organisms;

    this.unsubscribeAll = new Subject();
    this.groupsForm = this.formBuilder.group({
      groups: []
    });
  }

  ngOnInit(): void {
  }

  selectOrganism(organism) {
    this.searchCriteria.organism = organism;
    this.noctuaSearchService.search(this.searchCriteria)
  }

  search() {
    let searchCriteria = this.searchForm.value;

    this.noctuaSearchService.search(searchCriteria);
  }

  close() {
    this.noctuaSearchMenuService.closeLeftDrawer();
  }

  createSearchForm() {
    return new FormGroup({
      term: new FormControl(),
      groups: this.groupsForm,
    });
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next(null);
    this.unsubscribeAll.complete();
  }
}
