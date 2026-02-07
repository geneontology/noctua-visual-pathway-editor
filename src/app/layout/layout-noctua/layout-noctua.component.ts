import { Component, OnDestroy, OnInit, ViewEncapsulation, ViewChild, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';

import { NoctuaConfigService } from '@noctua/services/config.service';
import { NoctuaCommonMenuService } from '@noctua.common/services/noctua-common-menu.service';
import { LeftPanel } from '@noctua.common/models/menu-panels';
import { NoctuaToolbarComponent } from 'app/layout/components/toolbar/toolbar.component';
import { ContentComponent } from 'app/layout/components/content/content.component';

@Component({
    selector: 'layout-noctua',
    templateUrl: './layout-noctua.component.html',
    styleUrls: ['./layout-noctua.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        MatSidenavModule,
        NoctuaToolbarComponent,
        ContentComponent
    ]
})
export class LayoutNoctuaComponent implements OnInit, OnDestroy {
    private _noctuaConfigService = inject(NoctuaConfigService);
    noctuaCommonMenuService = inject(NoctuaCommonMenuService);

    LeftPanel = LeftPanel;
    noctuaConfig: any;
    navigation: any;
    @ViewChild('leftSidenav', { static: true })
    leftSidenav: MatSidenav;
    private _unsubscribeAll: Subject<any>;

    constructor() {
        this._unsubscribeAll = new Subject();
    }

    ngOnInit(): void {
        this._noctuaConfigService.config
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config) => {
                this.noctuaConfig = config;
            });
        this.noctuaCommonMenuService.setLeftSidenav(this.leftSidenav);
    }
    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}