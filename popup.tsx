import React from 'react'
import { createRoot } from 'react-dom/client'
import Timer from './components/Timer'
import './styles/globals.css'

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(
    <React.StrictMode>
      <Timer />
    </React.StrictMode>
  )
} 