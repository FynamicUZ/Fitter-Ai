import { useState } from 'react'
import { Icons } from '../components/Icons'
import StatTile from '../components/StatTile'
import LineChart from '../components/LineChart'
import DonutChart from '../components/DonutChart'
import { getWeeklyData, calcStreak, getMeals } from '../utils/storage'

export default function DashboardPage({ darkMode, setDarkMode, profile }) {
  const [range, setRange] = useState('This week')
  const ranges = ['This week','Last week','This month']
  const kcalGoal = profile?.kcalGoal || 2100

  const weekly = getWeeklyData()
  const eaten  = weekly.map(d => d.calories || 0)
  const goal   = weekly.map(() => kcalGoal)
  const labels = weekly.map(d => d.label)
  const streak = calcStreak()

  const meals = getMeals()
  const last7 = getMeals().filter(m => {
    const d = new Date(m.date)
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7)
    return d >= cutoff
  })

  const daysLogged = new Set(last7.map(m => m.date)).size || 1
  const avg = key => Math.round(last7.reduce((s, m) => s + (m[key] || 0), 0) / daysLogged)

  return (
    <div className="page-enter" style={{ paddingBottom:90 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 20px 8px' }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:20, fontWeight:800, color:'var(--text)', letterSpacing:'-0.03em' }}>Your Progress</div>
          <div style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>
            {new Date(Date.now() - 6*86400000).toLocaleDateString('en',{month:'short',day:'numeric'})} – {new Date().toLocaleDateString('en',{month:'short',day:'numeric'})}
          </div>
        </div>
        <button onClick={() => setDarkMode(d => !d)} style={{ width:36, height:36, borderRadius:'50%', border:'1px solid var(--border)', background:'var(--card)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text2)' }}>
          {darkMode ? <Icons.Sun/> : <Icons.Moon/>}
        </button>
      </div>

      <div style={{ display:'flex', gap:6, padding:'4px 16px 8px' }}>
        {ranges.map(r => (
          <button key={r} onClick={() => setRange(r)} style={{ padding:'7px 14px', borderRadius:20, border:'none', cursor:'pointer', background: range===r ? 'var(--primary)' : 'var(--card)', color: range===r ? '#fff' : 'var(--text2)', fontSize:12, fontWeight:600, transition:'all 0.2s', boxShadow: range===r ? '0 2px 8px rgba(76,175,130,0.3)' : 'none' }}>{r}</button>
        ))}
      </div>

      <div style={{ padding:'0 16px', display:'flex', flexDirection:'column', gap:14 }}>
        {/* Weekly calories chart */}
        <div style={{ background:'var(--card)', borderRadius:20, padding:'18px 16px', boxShadow:'var(--shadow)', border:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ fontSize:15, fontWeight:700, color:'var(--text)' }}>Calories this week</div>
            <div style={{ display:'flex', gap:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--text2)' }}>
                <div style={{ width:16, height:2.5, borderRadius:2, background:'#4CAF82' }}/>Eaten
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--text2)' }}>
                <div style={{ width:16, height:2, borderRadius:2, backgroundImage:'repeating-linear-gradient(to right,#F4845F 0,#F4845F 5px,transparent 5px,transparent 9px)' }}/>Goal
              </div>
            </div>
          </div>
          {eaten.some(v => v > 0)
            ? <LineChart eaten={eaten} goal={goal} labels={labels} width={340} height={160}/>
            : <div style={{ textAlign:'center', padding:'32px 0', color:'var(--text2)', fontSize:13 }}>Log meals to see your chart</div>
          }
        </div>

        {/* Streak */}
        <div style={{ background:'var(--card)', borderRadius:20, padding:'18px', boxShadow:'var(--shadow)', border:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
            <Icons.Flame/>
            <div>
              <div style={{ fontSize:17, fontWeight:800, color:'var(--text)' }}>{streak} day streak 🔥</div>
              <div style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>
                {streak === 0 ? 'Log a meal today to start your streak!' : 'Keep it up! Log today\'s meals to continue'}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            {weekly.map((d, i) => (
              <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                <div style={{ width:'100%', aspectRatio:'1', borderRadius:10, background: d.logged ? 'var(--primary)' : 'var(--bg)', border:`1.5px solid ${d.logged ? 'var(--primary)' : 'var(--border)'}`, display:'flex', alignItems:'center', justifyContent:'center', color: d.logged ? '#fff' : 'var(--text2)' }}>
                  {d.logged && <Icons.Check/>}
                </div>
                <span style={{ fontSize:9, fontWeight:600, color:'var(--text2)' }}>{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly averages */}
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:'var(--text)', marginBottom:10 }}>Weekly averages</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <StatTile label="Avg Calories" value={avg('calories').toLocaleString()} unit="kcal" color="var(--primary)"/>
            <StatTile label="Avg Protein"  value={avg('protein')}  unit="g" color="#6B8EF0"/>
            <StatTile label="Avg Carbs"    value={avg('carb')}     unit="g" color="#F4D03F"/>
            <StatTile label="Avg Fat"      value={avg('fat')}      unit="g" color="#F4845F"/>
          </div>
        </div>

        {/* Macro breakdown */}
        <div style={{ background:'var(--card)', borderRadius:20, padding:'18px', boxShadow:'var(--shadow)', border:'1px solid var(--border)' }}>
          <div style={{ fontSize:15, fontWeight:700, color:'var(--text)', marginBottom:14 }}>Macro breakdown</div>
          <DonutChart segments={[
            { label:'Protein',       value: avg('protein'), color:'#6B8EF0' },
            { label:'Carbohydrates', value: avg('carb'),    color:'#F4D03F' },
            { label:'Fat',           value: avg('fat'),     color:'#F4845F' },
          ]}/>
        </div>
      </div>
    </div>
  )
}
