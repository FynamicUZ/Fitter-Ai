import { useRef, useState } from 'react'
import CircularProgress from '../components/CircularProgress'
import MacroBadge from '../components/MacroBadge'
import MealCard from '../components/MealCard'
import { Icons } from '../components/Icons'
import { getTodayMeals, getWater, setWater } from '../utils/storage'
import { predictImage } from '../utils/api'
import { lookupBarcode } from '../utils/barcode'

export default function HomePage({ setPage, setScanResult, darkMode, setDarkMode, profile }) {
  const [activeTab, setActiveTab] = useState('Lunch')
  const [dragging, setDragging]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [water, setWaterState]    = useState(() => getWater())
  const fileRef = useRef()
  const tabs = ['Breakfast','Lunch','Dinner','Snack']

  const meals       = getTodayMeals()
  const kcalGoal    = profile?.kcalGoal  || 2100
  const proteinGoal = profile?.protein   || 150
  const carbGoal    = profile?.carbs     || 210
  const fatGoal     = profile?.fat       || 70

  const eaten = meals.reduce((a, m) => ({
    calories: a.calories + (m.calories || 0),
    protein:  a.protein  + (m.protein  || 0),
    carbs:    a.carbs    + (m.carb     || 0),
    fat:      a.fat      + (m.fat      || 0),
  }), { calories:0, protein:0, carbs:0, fat:0 })

  const today = new Date().toLocaleDateString('en', { weekday:'long', month:'long', day:'numeric' })

  async function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) { setError('Please upload an image.'); return }
    setLoading(true); setError('')
    try {
      const nutrition = await predictImage(file)
      nutrition.mealType = activeTab
      setScanResult(nutrition)
      setPage('scan')
    } catch {
      setError('Could not connect to the AI server. Make sure the backend is running.')
    } finally { setLoading(false) }
  }

  async function handleBarcode() {
    const code = window.prompt('Enter barcode number:')
    if (!code) return
    setLoading(true); setError('')
    const nutrition = await lookupBarcode(code.trim())
    setLoading(false)
    if (!nutrition) { setError('Product not found. Try a different barcode.'); return }
    nutrition.mealType = activeTab
    setScanResult(nutrition)
    setPage('scan')
  }

  function handleWater(count) {
    setWaterState(count)
    setWater(count)
  }

  return (
    <div className="page-enter" style={{ paddingBottom: 90 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 20px 8px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:34, height:34, borderRadius:10, background:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:18 }}>🌿</span>
          </div>
          <span style={{ fontSize:20, fontWeight:800, color:'var(--text)', letterSpacing:'-0.03em' }}>Fitter</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={() => setDarkMode(d => !d)} style={{ width:36, height:36, borderRadius:'50%', border:'1px solid var(--border)', background:'var(--card)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text2)' }}>
            {darkMode ? <Icons.Sun/> : <Icons.Moon/>}
          </button>
          <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#4CAF82,#2e9e68)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>👤</div>
        </div>
      </div>

      <div style={{ padding:'0 16px', display:'flex', flexDirection:'column', gap:14 }}>
        {/* Hero card */}
        <div style={{ background:'var(--card)', borderRadius:20, padding:'24px 20px 20px', boxShadow:'var(--shadow)', border:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.07em' }}>Today's calories</div>
              <div style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>{today}</div>
            </div>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--primary)', background:'rgba(76,175,130,0.12)', padding:'4px 10px', borderRadius:99 }}>
              {Math.round((eaten.calories / kcalGoal) * 100)}% of goal
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
            <CircularProgress value={eaten.calories} max={kcalGoal} size={180} strokeWidth={16} color="var(--primary)">
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:28, fontWeight:800, color:'var(--text)', lineHeight:1.1, letterSpacing:'-0.03em' }}>{Math.round(eaten.calories).toLocaleString()}</div>
                <div style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>of {kcalGoal.toLocaleString()} kcal</div>
                <div style={{ fontSize:11, fontWeight:600, color:'var(--accent)', marginTop:4 }}>{Math.max(0, kcalGoal - Math.round(eaten.calories))} left</div>
              </div>
            </CircularProgress>
          </div>
          <div style={{ display:'flex', gap:12 }}>
            <MacroBadge label="Protein" current={Math.round(eaten.protein)} goal={proteinGoal} color="#6B8EF0"/>
            <MacroBadge label="Carbs"   current={Math.round(eaten.carbs)}   goal={carbGoal}    color="#F4D03F"/>
            <MacroBadge label="Fat"     current={Math.round(eaten.fat)}     goal={fatGoal}     color="#F4845F"/>
          </div>
        </div>

        {/* Log a meal */}
        <div style={{ background:'var(--card)', borderRadius:20, padding:'18px', boxShadow:'var(--shadow)', border:'1px solid var(--border)' }}>
          <div style={{ fontSize:15, fontWeight:700, color:'var(--text)', marginBottom:12 }}>Log a meal</div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => handleFile(e.target.files[0])}/>
          <div
            onClick={() => !loading && fileRef.current.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
            style={{ border:`2px dashed ${dragging ? 'var(--primary)' : 'var(--border)'}`, borderRadius:14, padding:'24px 16px', textAlign:'center', cursor: loading ? 'wait' : 'pointer', background: dragging ? 'rgba(76,175,130,0.06)' : 'var(--bg)', transition:'all 0.2s', marginBottom:10 }}
          >
            {loading ? (
              <>
                <div style={{ marginBottom:8, color:'var(--primary)' }}><Icons.Camera/></div>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--primary)' }}>Analysing image…</div>
                <div style={{ fontSize:11, color:'var(--text2)', marginTop:4 }}>This takes a few seconds</div>
              </>
            ) : (
              <>
                <div style={{ marginBottom:8, color:'var(--text2)' }}><Icons.Camera/></div>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:3 }}>Take a photo or upload food image</div>
                <div style={{ fontSize:11, color:'var(--text2)' }}>AI will estimate nutrition instantly</div>
              </>
            )}
          </div>
          <button onClick={handleBarcode} disabled={loading} style={{ width:'100%', padding:'11px', borderRadius:12, border:'1px solid var(--border)', background:'var(--bg)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, color:'var(--text)', fontSize:13, fontWeight:600, marginBottom:14, transition:'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(76,175,130,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background='var(--bg)'}
          >
            <Icons.Barcode/> Scan packaged food barcode
          </button>
          {error && <div style={{ fontSize:12, color:'#F4845F', marginBottom:10, textAlign:'center' }}>{error}</div>}
          <div style={{ display:'flex', gap:6 }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{ flex:1, padding:'8px 0', borderRadius:10, border:'none', cursor:'pointer', background: activeTab===t ? 'var(--primary)' : 'var(--bg)', color: activeTab===t ? '#fff' : 'var(--text2)', fontSize:11, fontWeight:700, transition:'all 0.2s' }}>{t}</button>
            ))}
          </div>
        </div>

        {/* Today's meals */}
        {meals.length > 0 && (
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:'var(--text)', marginBottom:10 }}>Today's meals</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {meals.map(m => <MealCard key={m.id} {...m}/>)}
            </div>
          </div>
        )}

        {/* Water tracker */}
        <div style={{ background:'var(--card)', borderRadius:20, padding:'16px 18px', boxShadow:'var(--shadow)', border:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>Water intake</div>
              <div style={{ fontSize:12, color:'var(--text2)', marginTop:1 }}>{water} / 8 glasses</div>
            </div>
            <button onClick={() => handleWater(Math.min(water+1, 8))} style={{ padding:'7px 14px', borderRadius:10, border:'none', cursor:'pointer', background:'rgba(59,130,246,0.12)', color:'#3B82F6', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', gap:4 }}>
              <Icons.Plus/> glass
            </button>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            {Array.from({length:8}).map((_, i) => (
              <button key={i} onClick={() => handleWater(i < water ? i : i+1)} style={{ flex:1, border:'none', cursor:'pointer', background:'none', padding:0, color: i < water ? '#3B82F6' : 'var(--border)', transition:'color 0.2s, transform 0.15s', transform: i < water ? 'scale(1.05)' : 'scale(1)' }}>
                <Icons.Droplet/>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
