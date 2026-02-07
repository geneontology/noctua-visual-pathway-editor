import { Injectable, DOCUMENT, inject } from '@angular/core';

import { animate, AnimationBuilder, AnimationPlayer, style } from '@angular/animations';
import { NavigationEnd, Router } from '@angular/router';

@Injectable()
export class NoctuaSplashScreenService {
    private animationBuilder = inject(AnimationBuilder);
    private document = inject(DOCUMENT);
    private router = inject(Router);

    splashScreenEl;
    public player: AnimationPlayer;

    constructor() {
        this.splashScreenEl = this.document.body.querySelector('#noctua-splash-screen');

        if (this.splashScreenEl) {
            const hideOnLoad = this.router.events.subscribe((event) => {
                if (event instanceof NavigationEnd) {
                    setTimeout(() => {
                        this.hide();
                        hideOnLoad.unsubscribe();
                    }, 0);
                }
            }
            );
        }
    }

    show() {
        this.player =
            this.animationBuilder
                .build([
                    style({
                        opacity: '0',
                        zIndex: '99999'
                    }),
                    animate('400ms ease', style({ opacity: '1' }))
                ]).create(this.splashScreenEl);

        setTimeout(() => {
            this.player.play();
        }, 0);
    }

    hide() {
        this.player =
            this.animationBuilder
                .build([
                    style({ opacity: '1' }),
                    animate('400ms ease', style({
                        opacity: '0',
                        zIndex: '-10'
                    }))
                ]).create(this.splashScreenEl);

        setTimeout(() => {
            this.player.play();
        }, 0);
    }
}
