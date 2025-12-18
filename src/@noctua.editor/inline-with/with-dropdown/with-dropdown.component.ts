import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators, FormBuilder, FormArray } from '@angular/forms';
import { Subject, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil, startWith, map } from 'rxjs/operators';

import {
  NoctuaFormConfigService,
  NoctuaActivityFormService,
  ActivityError,
  ErrorLevel,
  ErrorType,
  withFromAllowedDBs
} from '@geneontology/noctua-form-base';

import { withDropdownData } from './with-dropdown.tokens';
import { WithDropdownOverlayRef } from './with-dropdown-ref';
import { NoctuaFormDialogService } from 'app/main/apps/noctua-form';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

@Component({
  selector: 'noc-with-dropdown',
  templateUrl: './with-dropdown.component.html',
  styleUrls: ['./with-dropdown.component.scss']
})

export class NoctuaWithDropdownComponent implements OnInit, OnDestroy {
  evidenceDBForm: FormGroup;
  formControl: FormControl;

  connectedTo = [];

  myForm: FormGroup;

  private _unsubscribeAll: Subject<any>;

  indata = {
    databaseGroups: [
      {
        projects: [
          {
            projectName: "WB:145787",
          }
        ]
      }
    ]
  }


  options: string[] = withFromAllowedDBs;
  filteredOptions: Observable<string[]>;



  constructor(private fb: FormBuilder, public dialogRef: WithDropdownOverlayRef,
    @Inject(withDropdownData) public data: any,
    private noctuaFormDialogService: NoctuaFormDialogService,
    public noctuaFormConfigService: NoctuaFormConfigService,
    public noctuaActivityFormService: NoctuaActivityFormService,
  ) {
    this._unsubscribeAll = new Subject();
    this.formControl = data.formControl;

    this.myForm = this.fb.group({
      databaseGroups: this.fb.array([])
    });
    const withfroms = this.formControl.value;
    if (withfroms) {
      const groups = withfroms.split(',');
      const items = groups.map((group) => {
        return group.split('|');
      })

    }

  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.options.filter(option => option.toLowerCase().includes(filterValue));
  }

  ngOnInit(): void {
    this.evidenceDBForm = this._createEvidenceDBForm();
  }

  clearValues() {

  }

  addNewCompany() {
    let control = <FormArray>this.myForm.controls['databaseGroups'];
    control.push(
      this.fb.group({
        company: [''],
        projects: this.fb.array([])
      })
    )
  }

  deleteCompany(index) {
    let control = <FormArray>this.myForm.controls['databaseGroups'];
    control.removeAt(index)
  }

  addNewProject(control, value?) {
    const projectName = new FormControl(value);
    control.push(this.fb.group({ projectName: projectName }));

    this._onValueChange(projectName)
  }

  deleteProject(control, index) {
    control.removeAt(index)
  }

  setdatabaseGroups() {
    let control = <FormArray>this.myForm.controls['databaseGroups'];
    this.indata.databaseGroups.forEach(x => {
      control.push(this.fb.group({
        projects: this.setProjects(x)
      }));
    })
  }

  setProjects(x) {
    let arr = new FormArray([]);
    x.projects.forEach(y => {
      this.addNewProject(arr, y.projectName);
    });
    return arr;
  }

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex);
    }
  }

  save() {
    const self = this;
    const errors = [];
    let canSave = true;

    const withs = this.myForm.value.databaseGroups.map((project) => {
      return project.projects.map((item) => {
        if (!item.projectName.includes(':')) {
          const error = new ActivityError(ErrorLevel.error, ErrorType.general, `${item.projectName} wrong format, Did you forget ':'`);
          errors.push(error);
          canSave = false;
        }
        return item.projectName;
      }).join('|');
    }).join(',');

    if (canSave) {
      this.formControl.setValue(withs);
      this.close();
    } else {
      self.noctuaFormDialogService.openActivityErrorsDialog(errors);
    }
  }

  cancelEvidenceDb() {
    this.evidenceDBForm.controls['accession'].setValue('');
  }

  private _createEvidenceDBForm() {
    return new FormGroup({
      db: new FormControl(this.noctuaFormConfigService.evidenceDBs.selected),
      accession: new FormControl('',
        [
          Validators.required,
        ])
    });
  }

  private _onValueChange(formControl: FormControl) {
    const self = this;

    this.filteredOptions = formControl.valueChanges
      .pipe(
        takeUntil(this._unsubscribeAll),
        distinctUntilChanged(),
        debounceTime(400),
        startWith(''),
        map(value => this._filter(value))
      );
  }

  close() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }
}
