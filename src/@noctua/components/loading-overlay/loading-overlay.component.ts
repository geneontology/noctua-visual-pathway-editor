import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { NoctuaLoadingOverlayService } from '@noctua/services/loading-overlay.service';

@Component({
  selector: 'noctua-loading-overlay',
  templateUrl: './loading-overlay.component.html',
  styleUrls: ['./loading-overlay.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class NoctuaLoadingOverlayComponent implements OnInit, OnDestroy {
  visible: boolean;
  message: string;

  private _unsubscribeAll: Subject<any>;

  constructor(
    private _loadingOverlayService: NoctuaLoadingOverlayService
  ) {
    this._unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
    this._loadingOverlayService.visible
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((visible) => {
        this.visible = visible;
      });

    this._loadingOverlayService.message
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((message) => {
        this.message = message;
      });
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }
}
