import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { Subscription, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import {
  Cam,
  NoctuaUserService,
  NoctuaFormConfigService,
  NoctuaGraphService,
  CamService,
  Entity,
} from '@geneontology/noctua-form-base';

@Component({
    selector: 'noc-cam-form',
    templateUrl: './cam-form.component.html',
    styleUrls: ['./cam-form.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatSidenavModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatAutocompleteModule,
        FontAwesomeModule
    ]
})

export class CamFormComponent implements OnInit, OnDestroy {
  noctuaUserService = inject(NoctuaUserService);
  private camService = inject(CamService);
  private noctuaGraphService = inject(NoctuaGraphService);
  noctuaFormConfigService = inject(NoctuaFormConfigService);


  @Input()
  panelDrawer: MatDrawer;
  cam: Cam;
  camFormGroup: FormGroup;
  camFormSub: Subscription;
  commentFormArray: FormArray

  private _unsubscribeAll: Subject<any>;

  constructor() {
    this._unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
    this.camFormSub = this.camService.camFormGroup$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(camFormGroup => {
        if (!camFormGroup) {
          return;
        }
        this.camFormGroup = camFormGroup;
        this.commentFormArray = camFormGroup.get('commentFormArray') as FormArray
      });

    this.camService.onCamChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((cam) => {
        if (!cam) {
          return;
        }

        this.cam = cam;
      });
  }

  addComment() {
    this.commentFormArray.push(new FormControl())
  }

  deleteComment(index) {
    this.commentFormArray.removeAt(index)
    this.save()
  }

  save() {

    const success = () => {

      const value = this.camFormGroup.value;

      const annotations = {
        title: value.title,
        state: value.state.name,
        comments: value.commentFormArray,
      };


      this.noctuaGraphService.saveModelGroup(this.cam, value.group.id);
      this.noctuaGraphService.saveCamAnnotations(this.cam, annotations);
    }


    this.camService.checkGroup(success)
  }

  termDisplayFn(term): string | undefined {
    return term ? term.label : undefined;
  }

  close() {
    this.panelDrawer.close();
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }
}
