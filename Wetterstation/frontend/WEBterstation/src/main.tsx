/*
  main.tsx
  Einstiegspunkt der React-Anwendung.
  Die Hauptkomponente wird hier in das HTML-Element mit der ID 'root' gerendert.
*/
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Wetterstation from './App.tsx'
import '../node_modules/bootstrap/dist/css/bootstrap.min.css'

// Rendern des React-Baumes in das DOM
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Wetterstation />
  </StrictMode>
)