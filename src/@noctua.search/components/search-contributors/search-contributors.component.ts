import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import {
  NoctuaFormConfigService,
  NoctuaUserService
} from '@geneontology/noctua-form-base';
import { NoctuaSearchService } from './../../services/noctua-search.service';
import { NoctuaSearchMenuService } from '../../services/search-menu.service';

@Component({
  selector: 'noc-search-contributors',
  templateUrl: './search-contributors.component.html',
  styleUrls: ['./search-contributors.component.scss'],
})

export class SearchContributorsComponent implements OnInit, OnDestroy {
  searchCriteria: any = {};
  searchForm: FormGroup;
  groupsForm: FormGroup;

  private unsubscribeAll: Subject<any>;

  constructor(public noctuaUserService: NoctuaUserService,
    public noctuaSearchMenuService: NoctuaSearchMenuService,
    private noctuaSearchService: NoctuaSearchService,
    private formBuilder: FormBuilder,
    public noctuaFormConfigService: NoctuaFormConfigService,) {
    // this.contributors = this.noctuaSearchService.contributors;

    this.unsubscribeAll = new Subject();

    this.groupsForm = this.formBuilder.group({
      groups: []
    })
  }

  ngOnInit(): void {

  }

  selectContributor(contributor) {
    this.searchCriteria.contributor = contributor;
    this.noctuaSearchService.search(this.searchCriteria);
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
