import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import '@fontsource-variable/manrope'
import '@fontsource-variable/space-grotesk'
import './i18n'
import './styles/global.css'
import { router } from './app/router'

createRoot(document.getElementById('root')!).render(<StrictMode><RouterProvider router={router} /></StrictMode>)
