import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { getRouter } from './router'
import './styles.css'
import { registerPWA } from './lib/pwa-register'
import { flushFotos } from './lib/offline-fotos'

const router = getRouter()

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)

// PWA + fila offline (sem efeito no preview/dev por guarda interna)
void registerPWA()
void flushFotos()
