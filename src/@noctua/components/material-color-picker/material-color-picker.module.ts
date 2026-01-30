import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { NoctuaPipesModule } from '../../pipes/pipes.module';
import { NoctuaMaterialColorPickerComponent } from './material-color-picker.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@NgModule({
    declarations: [
        NoctuaMaterialColorPickerComponent
    ],
    imports: [
        CommonModule,
        FlexLayoutModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatRippleModule,
        NoctuaPipesModule,
        FontAwesomeModule
    ],
    exports: [
        NoctuaMaterialColorPickerComponent
    ],
})
export class NoctuaMaterialColorPickerModule {
}
