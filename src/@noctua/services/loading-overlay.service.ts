import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NoctuaLoadingOverlayService {
  private _counter = 0;
  private _visible: BehaviorSubject<boolean> = new BehaviorSubject(false);
  private _message: BehaviorSubject<string> = new BehaviorSubject('');

  get visible(): Observable<boolean> {
    return this._visible.asObservable();
  }

  get message(): Observable<string> {
    return this._message.asObservable();
  }

  show(message = 'Loading...'): void {
    this._counter++;
    this._message.next(message);
    this._visible.next(true);
  }

  hide(): void {
    this._counter = Math.max(0, this._counter - 1);
    if (this._counter === 0) {
      this._visible.next(false);
      this._message.next('');
    }
  }

  forceHide(): void {
    this._counter = 0;
    this._visible.next(false);
    this._message.next('');
  }
}
