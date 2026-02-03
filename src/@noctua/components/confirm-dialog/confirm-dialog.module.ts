import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { NoctuaConfirmDialogComponent } from './confirm-dialog.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@NgModule({
    declarations: [
        NoctuaConfirmDialogComponent
    ],
    imports: [
        CommonModule,
        BrowserModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        FlexLayoutModule,
        FontAwesomeModule
    ]
})

export class NoctuaConfirmDialogModule {
}
