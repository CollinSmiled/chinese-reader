import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './styles/global.css'
import Navbar from './components/Navbar'
import Reader from './pages/Reader'
import Library from './pages/Library'
import Auth from './pages/Auth'
import Decks from './pages/Decks'
import Dictionary from './pages/Dictionary'
import { AuthProvider } from './auth/AuthContext'

function Placeholder({ name }: { name: string }) {
  return (
    <div className="p-10">
      <h2 className="text-xl text-ink-900 mb-2">{name}</h2>
      <p className="text-sm text-ink-400">Coming soon.</p>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/"         element={<Reader />} />
            <Route path="/auth"     element={<Auth />} />
            <Route path="/dictionary" element={<Dictionary />} />
            <Route path="/decks"    element={<Decks />} />
            <Route path="/vocab"    element={<Decks />} />
            <Route path="/library"  element={<Library />} />
            <Route path="/history"  element={<Library />} />
            <Route path="/settings" element={<Placeholder name="Settings" />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  )
}
