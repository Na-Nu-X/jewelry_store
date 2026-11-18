import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Zlatníctvo a šperkárstvo',
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'kolekcia',
    title: 'Kolekcia šperkov',
    loadComponent: () =>
      import('./pages/collection/collection.page').then((m) => m.CollectionPage),
  },
  {
    path: 'kolekcia/:slug',
    title: 'Detail šperku',
    loadComponent: () =>
      import('./pages/jewelry-detail/jewelry-detail.page').then((m) => m.JewelryDetailPage),
  },
  {
    path: 'na-mieru',
    title: 'Šperky na mieru & obrúčky',
    loadComponent: () => import('./pages/bespoke/bespoke.page').then((m) => m.BespokePage),
  },
  {
    path: 'vykup-a-servis',
    title: 'Výkup zlata & zlatnícky servis',
    loadComponent: () =>
      import('./pages/buyback-service/buyback-service.page').then((m) => m.BuybackServicePage),
  },
  {
    path: 'atelier',
    title: 'Náš ateliér & kontakt',
    loadComponent: () => import('./pages/atelier/atelier.page').then((m) => m.AtelierPage),
  },
  {
    path: '**',
    title: 'Stránka sa nenašla',
    loadComponent: () => import('./pages/not-found/not-found.page').then((m) => m.NotFoundPage),
  },
];
