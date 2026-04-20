import { useEffect, useState } from 'react'
import BottomNav from './components/BottomNav'
import HomePage from './pages/HomePage'
import ScanPage from './pages/ScanPage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import { getProfile, getTheme, saveTheme } from './utils/storage'

export default function App() {
  const [page,       setPage]       = useState('home')
  const [dark,       setDark]       = useState(() => getTheme() === 'dark')
  const [scanResult, setScanResult] = useState(null)
  const [profile,    setProfile]    = useState(() => getProfile())

  useEffect(() => {
    saveTheme(dark ? 'dark' : 'light')
    if (dark) document.documentElement.setAttribute('data-dark', '')
    else      document.documentElement.removeAttribute('data-dark')
  }, [dark])

  function handleProfileSave(p) {
    setProfile(p)
  }

  const props = { setPage, darkMode: dark, setDarkMode: setDark, profile }

  return (
    <div style={{ minHeight:'100dvh', background:'var(--bg)', transition:'background 0.3s' }}>
      <div style={{ maxWidth:480, margin:'0 auto', position:'relative', minHeight:'100dvh' }}>
        {page === 'home'      && <HomePage      {...props} setScanResult={setScanResult}/>}
        {page === 'scan'      && <ScanPage      {...props} nutrition={scanResult}/>}
        {page === 'dashboard' && <DashboardPage {...props}/>}
        {page === 'profile'   && <ProfilePage   {...props} onProfileSave={handleProfileSave}/>}
        {page !== 'scan' && <BottomNav page={page} setPage={setPage}/>}
      </div>
    </div>
  )
}
