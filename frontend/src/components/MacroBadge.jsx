export default function MacroBadge({ label, current, goal, color, unit = 'g' }) {
  const pct = Math.min((current / goal) * 100, 100)
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>
          {Math.round(current)}<span style={{ fontWeight:400, color:'var(--text2)' }}>/{goal}{unit}</span>
        </span>
      </div>
      <div style={{ height: 5, borderRadius: 99, background: 'var(--track)', overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background: color, borderRadius:99, transition:'width 0.6s ease' }}/>
      </div>
    </div>
  )
}
