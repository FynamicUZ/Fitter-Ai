import { useState } from 'react'
import StatTile from '../components/StatTile'
import { Icons } from '../components/Icons'
import { addMeal } from '../utils/storage'

export default function ScanPage({ setPage, nutrition }) {
  const [portion,  setPortion]  = useState(1)
  const [mealType, setMealType] = useState(nutrition?.mealType || 'Lunch')
  const [saved,    setSaved]    = useState(false)
  const tabs = ['Breakfast','Lunch','Dinner','Snack']

  if (!nutrition) {
    setPage('home')
    return null
  }

  const s = v => Math.round(v * portion * 10) / 10

  function handleSave() {
    addMeal({
      mealType,
      calories: s(nutrition.calories_kcal),
      mass:     s(nutrition.mass_g),
      fat:      s(nutrition.fat_g),
      carb:     s(nutrition.carb_g),
      protein:  s(nutrition.protein_g),
    })
    setSaved(true)
  }

  if (saved) return (
    <div className="page-enter" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'80vh', gap:16, padding:24 }}>
      <div style={{ width:80, height:80, borderRadius:'50%', background:'rgba(76,175,130,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40 }}>✅</div>
      <div style={{ fontSize:20, fontWeight:800, color:'var(--text)' }}>Logged to {mealType}!</div>
      <div style={{ fontSize:13, color:'var(--text2)' }}>{s(nutrition.calories_kcal)} kcal added to today's log</div>
      <button onClick={() => setPage('home')} style={{ marginTop:8, padding:'14px 36px', borderRadius:14, border:'none', background:'var(--primary)', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer' }}>
        Back to Home
      </button>
    </div>
  )

  return (
    <div className="page-enter" style={{ paddingBottom: 100 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'18px 16px 8px' }}>
        <button onClick={() => setPage('home')} style={{ width:36, height:36, borderRadius:10, border:'1px solid var(--border)', background:'var(--card)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text)' }}>
          <Icons.ChevronLeft/>
        </button>
        <span style={{ fontSize:17, fontWeight:700, color:'var(--text)' }}>Nutrition Estimate</span>
      </div>

      <div style={{ padding:'0 16px', display:'flex', flexDirection:'column', gap:14 }}>
        {/* Food image placeholder */}
        <div style={{ borderRadius:20, overflow:'hidden', boxShadow:'var(--shadow)', position:'relative', background:'var(--card)', padding:'32px 16px', textAlign:'center', border:'1px solid var(--border)' }}>
          <div style={{ fontSize:56, marginBottom:8 }}>🍽️</div>
          {nutrition.name && <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:4 }}>{nutrition.name}</div>}
          <div style={{ fontSize:11, color:'var(--text2)' }}>food photo · analysed</div>
          <div style={{ position:'absolute', top:12, right:12, background:'rgba(0,0,0,0.5)', borderRadius:20, padding:'4px 10px', fontSize:11, fontWeight:700, color:'#fff', backdropFilter:'blur(8px)' }}>±70 kcal accuracy</div>
        </div>

        {/* Stat tiles */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div style={{ gridColumn:'1 / -1' }}>
            <StatTile label="Calories" value={s(nutrition.calories_kcal)} unit="kcal" color="var(--primary)" large/>
          </div>
          <StatTile label="Mass"          value={s(nutrition.mass_g)}    unit="g" color="var(--text)"/>
          <StatTile label="Protein"        value={s(nutrition.protein_g)} unit="g" color="#6B8EF0"/>
          <StatTile label="Carbohydrates"  value={s(nutrition.carb_g)}    unit="g" color="#F4D03F"/>
          <StatTile label="Fat"            value={s(nutrition.fat_g)}     unit="g" color="#F4845F"/>
        </div>

        {/* Portion slider */}
        <div style={{ background:'var(--card)', borderRadius:16, padding:'16px', boxShadow:'var(--shadow)', border:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <span style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>Portion size</span>
            <span style={{ fontSize:16, fontWeight:800, color:'var(--primary)' }}>{portion}×</span>
          </div>
          <input type="range" min="0.5" max="3" step="0.25" value={portion} onChange={e => setPortion(parseFloat(e.target.value))} style={{ width:'100%' }}/>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
            {['0.5×','1×','2×','3×'].map(l => <span key={l} style={{ fontSize:11, color:'var(--text2)' }}>{l}</span>)}
          </div>
        </div>

        {/* Meal type */}
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:8 }}>Meal type</div>
          <div style={{ display:'flex', gap:8 }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setMealType(t)} style={{ flex:1, padding:'10px 0', borderRadius:12, border:`1.5px solid ${mealType===t ? 'var(--primary)' : 'var(--border)'}`, background: mealType===t ? 'rgba(76,175,130,0.1)' : 'var(--card)', color: mealType===t ? 'var(--primary)' : 'var(--text2)', fontSize:11, fontWeight:700, cursor:'pointer', transition:'all 0.2s' }}>{t}</button>
            ))}
          </div>
        </div>

        <button onClick={handleSave} style={{ width:'100%', padding:'16px', borderRadius:16, border:'none', cursor:'pointer', background:'var(--primary)', color:'#fff', fontSize:15, fontWeight:700, boxShadow:'0 4px 16px rgba(76,175,130,0.35)', transition:'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.transform='translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform=''}
        >Save to log</button>
        <button onClick={() => setPage('home')} style={{ width:'100%', padding:'14px', borderRadius:16, border:'1.5px solid var(--border)', background:'transparent', color:'var(--text2)', fontSize:14, fontWeight:600, cursor:'pointer' }}>Retake photo</button>
      </div>
    </div>
  )
}
