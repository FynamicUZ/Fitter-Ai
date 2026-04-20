import { useEffect, useState } from 'react'
import { Icons } from '../components/Icons'
import { calcTDEE, adjustForGoal, calcMacros } from '../utils/tdee'
import { saveProfile } from '../utils/storage'

const ACTIVITIES = [
  { id:'sedentary', icon:'🛋️', label:'Sedentary',          sub:'Little or no exercise' },
  { id:'light',     icon:'🚶', label:'Lightly active',     sub:'1–3 days/week' },
  { id:'moderate',  icon:'🏃', label:'Moderately active',  sub:'3–5 days/week' },
  { id:'active',    icon:'💪', label:'Very active',        sub:'6–7 days/week' },
  { id:'extreme',   icon:'🔥', label:'Extremely active',   sub:'Physical job or 2×/day' },
]

export default function ProfilePage({ darkMode, setDarkMode, onProfileSave }) {
  const [form, setForm] = useState({ age:'25', sex:'male', weight:'70', wUnit:'kg', height:'175', hUnit:'cm', activity:'moderate', goal:'maintain' })
  const [result, setResult] = useState(null)
  const [saved,  setSaved]  = useState(false)
  const up = (k, v) => { setForm(f => ({ ...f, [k]: v })); setSaved(false) }

  useEffect(() => {
    const age = parseInt(form.age) || 25
    const w   = parseFloat(form.weight) || 70
    const wKg = form.wUnit === 'lbs' ? w * 0.453592 : w
    const h   = parseFloat(form.height) || 175
    const hCm = form.hUnit === 'ft' ? h * 30.48 : h
    const tdee    = calcTDEE({ age, sex: form.sex, weightKg: wKg, heightCm: hCm, activity: form.activity })
    const adjusted = adjustForGoal(tdee, form.goal)
    const macros  = calcMacros(adjusted, wKg)
    setResult({ tdee: adjusted, ...macros })
  }, [form])

  function handleSave() {
    if (!result) return
    const profile = {
      ...form,
      kcalGoal: result.tdee,
      protein:  result.protein,
      carbs:    result.carbs,
      fat:      result.fat,
    }
    saveProfile(profile)
    onProfileSave(profile)
    setSaved(true)
  }

  const inp = (label, key, type) => (
    <div>
      <label style={{ fontSize:12, fontWeight:600, color:'var(--text2)', display:'block', marginBottom:6 }}>{label}</label>
      <input type={type} value={form[key]} onChange={e => up(key, e.target.value)} style={{ width:'100%', padding:'12px 14px', borderRadius:12, border:'1.5px solid var(--border)', background:'var(--bg)', color:'var(--text)', fontSize:15, fontWeight:600, outline:'none', boxSizing:'border-box', transition:'border-color 0.2s' }}
        onFocus={e => e.target.style.borderColor='var(--primary)'}
        onBlur={e => e.target.style.borderColor='var(--border)'}
      />
    </div>
  )

  const toggle = (key, opts) => (
    <div style={{ display:'flex', gap:6 }}>
      {opts.map(o => (
        <button key={o.value} onClick={() => up(key, o.value)} style={{ flex:1, padding:'10px', borderRadius:12, border:`1.5px solid ${form[key]===o.value ? 'var(--primary)' : 'var(--border)'}`, background: form[key]===o.value ? 'rgba(76,175,130,0.12)' : 'var(--card)', color: form[key]===o.value ? 'var(--primary)' : 'var(--text2)', fontSize:13, fontWeight:700, cursor:'pointer', transition:'all 0.2s' }}>{o.label}</button>
      ))}
    </div>
  )

  return (
    <div className="page-enter" style={{ paddingBottom:90 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 20px 8px' }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:20, fontWeight:800, color:'var(--text)', letterSpacing:'-0.03em' }}>Set your daily goal</div>
          <div style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>We'll calculate your calorie target</div>
        </div>
        <button onClick={() => setDarkMode(d => !d)} style={{ width:36, height:36, borderRadius:'50%', border:'1px solid var(--border)', background:'var(--card)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text2)' }}>
          {darkMode ? <Icons.Sun/> : <Icons.Moon/>}
        </button>
      </div>

      <div style={{ padding:'0 16px', display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ background:'var(--card)', borderRadius:20, padding:'20px 18px', boxShadow:'var(--shadow)', border:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:16 }}>
          {inp('Age', 'age', 'number')}
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'var(--text2)', display:'block', marginBottom:6 }}>Biological sex</label>
            {toggle('sex', [{ value:'male', label:'Male' },{ value:'female', label:'Female' }])}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8 }}>
            <div>{inp('Weight', 'weight', 'number')}</div>
            <div style={{ display:'flex', flexDirection:'column', justifyContent:'flex-end', gap:6 }}>
              {['kg','lbs'].map(u => (
                <button key={u} onClick={() => up('wUnit', u)} style={{ padding:'8px 10px', borderRadius:10, border:`1.5px solid ${form.wUnit===u ? 'var(--primary)' : 'var(--border)'}`, background: form.wUnit===u ? 'rgba(76,175,130,0.12)' : 'var(--card)', color: form.wUnit===u ? 'var(--primary)' : 'var(--text2)', fontSize:12, fontWeight:700, cursor:'pointer', transition:'all 0.2s' }}>{u}</button>
              ))}
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8 }}>
            <div>{inp('Height', 'height', 'number')}</div>
            <div style={{ display:'flex', flexDirection:'column', justifyContent:'flex-end', gap:6 }}>
              {['cm','ft'].map(u => (
                <button key={u} onClick={() => up('hUnit', u)} style={{ padding:'8px 10px', borderRadius:10, border:`1.5px solid ${form.hUnit===u ? 'var(--primary)' : 'var(--border)'}`, background: form.hUnit===u ? 'rgba(76,175,130,0.12)' : 'var(--card)', color: form.hUnit===u ? 'var(--primary)' : 'var(--text2)', fontSize:12, fontWeight:700, cursor:'pointer', transition:'all 0.2s' }}>{u}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Activity level */}
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:8 }}>Activity level</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {ACTIVITIES.map(a => (
              <button key={a.id} onClick={() => up('activity', a.id)} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:14, border:`1.5px solid ${form.activity===a.id ? 'var(--primary)' : 'var(--border)'}`, background: form.activity===a.id ? 'rgba(76,175,130,0.08)' : 'var(--card)', cursor:'pointer', textAlign:'left', transition:'all 0.2s', boxShadow: form.activity===a.id ? '0 0 0 3px rgba(76,175,130,0.15)' : 'none' }}>
                <span style={{ fontSize:22, flexShrink:0 }}>{a.icon}</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color: form.activity===a.id ? 'var(--primary)' : 'var(--text)' }}>{a.label}</div>
                  <div style={{ fontSize:11, color:'var(--text2)', marginTop:1 }}>{a.sub}</div>
                </div>
                {form.activity===a.id && (
                  <div style={{ marginLeft:'auto', width:20, height:20, borderRadius:'50%', background:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>
                    <Icons.Check/>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Goal */}
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:8 }}>Goal</div>
          <div style={{ display:'flex', gap:8 }}>
            {[{v:'lose',l:'Lose weight'},{v:'maintain',l:'Maintain'},{v:'gain',l:'Gain muscle'}].map(g => (
              <button key={g.v} onClick={() => up('goal', g.v)} style={{ flex:1, padding:'12px 0', borderRadius:14, border:`1.5px solid ${form.goal===g.v ? 'var(--primary)' : 'var(--border)'}`, background: form.goal===g.v ? 'rgba(76,175,130,0.1)' : 'var(--card)', color: form.goal===g.v ? 'var(--primary)' : 'var(--text2)', fontSize:12, fontWeight:700, cursor:'pointer', transition:'all 0.2s' }}>{g.l}</button>
            ))}
          </div>
        </div>

        {/* Result card */}
        {result && (
          <div style={{ background:'linear-gradient(135deg, #4CAF82 0%, #2e9e68 100%)', borderRadius:20, padding:'20px', boxShadow:'0 8px 24px rgba(76,175,130,0.35)' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.75)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>Your daily calorie goal</div>
            <div style={{ fontSize:38, fontWeight:800, color:'#fff', letterSpacing:'-0.03em', marginBottom:16 }}>{result.tdee.toLocaleString()} <span style={{ fontSize:18, fontWeight:600 }}>kcal</span></div>
            <div style={{ display:'flex', gap:10, marginBottom:20 }}>
              {[{l:'Protein',v:result.protein},{l:'Carbs',v:result.carbs},{l:'Fat',v:result.fat}].map(m => (
                <div key={m.l} style={{ flex:1, background:'rgba(255,255,255,0.18)', borderRadius:12, padding:'10px 12px' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.75)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{m.l}</div>
                  <div style={{ fontSize:18, fontWeight:800, color:'#fff', marginTop:3 }}>{m.v}g</div>
                </div>
              ))}
            </div>
            <button onClick={handleSave} style={{ width:'100%', padding:'14px', borderRadius:14, border:'none', cursor:'pointer', background: saved ? 'rgba(255,255,255,0.3)' : '#fff', transition:'all 0.2s', color: saved ? '#fff' : '#2e9e68', fontSize:14, fontWeight:700 }}>
              {saved ? '✓ Goal saved!' : 'Save my goal'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
