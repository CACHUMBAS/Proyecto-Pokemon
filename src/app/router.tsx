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
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
