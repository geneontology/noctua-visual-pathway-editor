import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    loadChildren: () => import('./main/apps/noctua-graph/noctua-graph.module').then(m => m.NoctuaGraphModule)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
