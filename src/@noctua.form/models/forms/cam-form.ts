import { FormArray, FormControl } from '@angular/forms';
import { Cam } from './../activity/cam';
import { Contributor } from './../contributor';
import { ActivityFormMetadata } from './../forms/activity-form-metadata';

export class CamForm {
  title = new FormControl();
  state = new FormControl();
  group = new FormControl();

  commentFormArray = new FormArray([]);

  _metadata: ActivityFormMetadata;

  constructor(metadata) {
    this._metadata = metadata;
  }

  createCamForm(cam: Cam, user: Contributor) {
    if (cam) {
      this.title.setValue(cam.title);
      this.state.setValue(cam.state);
      this.group.setValue(user ? user.group : '');

      cam.comments.forEach((comment: string) => {
        this.commentFormArray.push(new FormControl(comment));
      });
    }
  }

  getError() {

  }

  populateConnectorForm(cam: Cam) {
    cam.title = this.title.value;
    cam.state = this.state.value;
  }
}
