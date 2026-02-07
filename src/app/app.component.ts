import { Component, ElementRef, HostBinding, OnInit, OnDestroy, Renderer2, ViewEncapsulation, HostListener, DOCUMENT, inject } from '@angular/core';

import { Platform } from '@angular/cdk/platform';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { NoctuaConfigService } from '@noctua/services/config.service';
import { NoctuaSplashScreenService } from '@noctua/services/splash-screen.service';
import { NoctuaUserService } from '@geneontology/noctua-form-base';
import { LayoutNoctuaComponent } from './layout/layout-noctua/layout-noctua.component';


@Component({
    selector: 'noctua-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [LayoutNoctuaComponent]
})
export class AppComponent implements OnInit, OnDestroy {
    private noctuaSplashScreen = inject(NoctuaSplashScreenService);
    private _renderer = inject(Renderer2);
    private _elementRef = inject(ElementRef);
    private noctuaConfigService = inject(NoctuaConfigService);
    noctuaUserService = inject(NoctuaUserService);
    private platform = inject(Platform);
    private document = inject(DOCUMENT);

    noctuaConfig: any;
    navigation: any;

    private _unsubscribeAll: Subject<any>;
    @HostListener('window:focus', ['$event'])
    onFocus(event: FocusEvent): void {
        this.noctuaUserService.getUser();
    }

    constructor() {
        if (this.platform.ANDROID || this.platform.IOS) {
            this.document.body.className += ' is-mobile';
        }

        this._unsubscribeAll = new Subject();
    }

    ngOnInit(): void {
        this.noctuaConfigService.config
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config) => {
                this.noctuaConfig = config;
            });
    }

    ngOnDestroy() {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    addClass(className: string) {
        this._renderer.addClass(this._elementRef.nativeElement, className);
    }

    removeClass(className: string) {
        this._renderer.removeClass(this._elementRef.nativeElement, className);
    }
}
