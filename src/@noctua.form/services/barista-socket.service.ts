import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { environment } from './../../environments/environment';
import { NoctuaConfirmDialogService } from '@noctua/components/confirm-dialog/confirm-dialog.service';
import { Cam } from './../models/activity/cam';

declare const require: any;
const io = require('socket.io-client');

const DEDUP_DELAY_MS = 500;

@Injectable({
  providedIn: 'root'
})
export class BaristaSocketService implements OnDestroy {
  private socket: any;
  private modelSubscription: Subscription;
  private dialogOpen = false;
  private relayEvent$ = new Subject<any>();

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

  watchModel(modelId: string, getCam: () => Cam, reloadFn: (modelId: string) => void): void {
    if (this.modelSubscription) {
      this.modelSubscription.unsubscribe();
    }

    this.dialogOpen = false;

    this.modelSubscription = this.relayEvent$.pipe(
      filter((event) => event.model_id === modelId)
    ).subscribe((event) => {
      console.log('[BaristaSocket] Relay event:', event.class, event.packet_id);

      if (this.dialogOpen) return;

      const packetId = event.packet_id;
      if (!packetId || packetId === 'unknown') {
        this.showUpdateDialog(modelId, reloadFn);
        return;
      }

      // Check immediately — covers the common case where HTTP arrived first
      const cam = getCam();
      if (cam?.processedPacketIds.has(packetId)) {
        cam.processedPacketIds.delete(packetId);
        console.log('[BaristaSocket] Skipping own change:', packetId);
        return;
      }

      // Defer to allow the rebuild callback to register the packet_id
      // (handles the rare case where socket arrives before HTTP response)
      setTimeout(() => {
        if (this.dialogOpen) return;

        const cam = getCam();
        if (cam?.processedPacketIds.has(packetId)) {
          cam.processedPacketIds.delete(packetId);
          console.log('[BaristaSocket] Skipping own change (deferred):', packetId);
          return;
        }

        // External change
        this.showUpdateDialog(modelId, reloadFn);
      }, DEDUP_DELAY_MS);
    });
  }

  private showUpdateDialog(modelId: string, reloadFn: (modelId: string) => void): void {
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
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.relayEvent$.complete();
  }
}
