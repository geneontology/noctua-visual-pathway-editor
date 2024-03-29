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
    const self = this;

    if (cam) {
      self.title.setValue(cam.title);
      self.state.setValue(cam.state);
      self.group.setValue(user ? user.group : '');

      cam.comments.forEach((comment: string) => {
        self.commentFormArray.push(new FormControl(comment));
      });
    }
  }

  getError() {

  }

  populateConnectorForm(cam: Cam) {
    const self = this;

    cam.title = self.title.value;
    cam.state = self.state.value;
  }
}
