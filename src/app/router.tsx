import { createBrowserRouter } from 'react-router'
import { App } from './App'
import { LandingPage } from '../features/landing/LandingPage'
import { DesignPreviewPage } from '../features/preview/DesignPreviewPage'
import { NotFoundPage } from '../features/not-found/NotFoundPage'

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/diseno', element: <DesignPreviewPage /> },
      {
        path: '/catalogo',
        lazy: async () => ({
          Component: (await import('../features/catalog/CatalogPage')).CatalogPage,
        }),
      },
      {
        path: '/catalogo/:id',
        lazy: async () => ({
          Component: (await import('../features/catalog/SpeciesDetails')).SpeciesDetails,
        }),
      },
      {
        path: '/equipo',
        lazy: async () => ({ Component: (await import('../features/team/TeamPage')).TeamPage }),
      },
      {
        path: '/practica',
        lazy: async () => ({
          Component: (await import('../features/practice/PracticePage')).PracticePage,
        }),
      },
      {
        path: '/cuenta',
        lazy: async () => ({
          Component: (await import('../features/account/AccountPage')).AccountPage,
        }),
      },
      {
        path: '/cuenta/recuperar',
        lazy: async () => ({
          Component: (await import('../features/account/AccountPage')).AccountPage,
        }),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
