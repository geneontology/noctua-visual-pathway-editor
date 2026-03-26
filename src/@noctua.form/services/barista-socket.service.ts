import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { environment } from './../../environments/environment';
import { NoctuaConfirmDialogService } from '@noctua/components/confirm-dialog/confirm-dialog.service';

declare const require: any;
const io = require('socket.io-client');

@Injectable({
  providedIn: 'root'
})
export class BaristaSocketService implements OnDestroy {
  private socket: any;
  private modelSubscription: Subscription;
  private dialogOpen = false;
  private relayEvent$ = new Subject<{ class: string; model_id: string }>();

  constructor(
    private zone: NgZone,
    private confirmDialogService: NoctuaConfirmDialogService
  ) { }

  connect(): void {
    if (this.socket && this.socket.connected) {
      return;
    }

    this.socket = io.connect(environment.globalBaristaLocation);

    this.socket.on('connect', () => {
      this.zone.run(() => {
        console.log('[BaristaSocket] Connected');
      });
    });

    this.socket.on('relay', (data: any) => {
      this.zone.run(() => {
        if (data && (data.class === 'merge' || data.class === 'rebuild')) {
          this.relayEvent$.next(data);
        }
      });
    });

    this.socket.on('disconnect', () => {
      this.zone.run(() => {
        console.log('[BaristaSocket] Disconnected');
      });
    });
  }

  disconnect(): void {
    if (this.modelSubscription) {
      this.modelSubscription.unsubscribe();
      this.modelSubscription = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  watchModel(modelId: string, reloadFn: (modelId: string) => void): void {
    if (this.modelSubscription) {
      this.modelSubscription.unsubscribe();
    }

    this.modelSubscription = this.relayEvent$.pipe(
      filter(event => event.model_id === modelId)
    ).subscribe(() => {
      if (this.dialogOpen) {
        return;
      }

      this.dialogOpen = true;
      this.confirmDialogService.openConfirmDialog(
        'Model Updated',
        'This model has been modified. Please refresh to get the latest version.',
        () => {
          this.dialogOpen = false;
          reloadFn(modelId);
        },
        {
          disableClose: true,
          confirmLabel: 'Refresh',
          hideCancel: true
        }
      );
    });
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.relayEvent$.complete();
  }
}
