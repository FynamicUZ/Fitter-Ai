import { Icons } from './Icons'

export default function StatTile({ label, value, unit, color, large, trend }) {
  return (
    <div style={{
      background: large ? color : 'var(--card)',
      border: large ? 'none' : '1px solid var(--border)',
      borderRadius:14, padding: large ? '20px 18px' : '14px 16px',
      boxShadow:'var(--shadow)', position:'relative', overflow:'hidden',
    }}>
      {large && <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.15)' }}/>}
      <div style={{ fontSize:11, fontWeight:600, color: large ? 'rgba(255,255,255,0.8)' : 'var(--text2)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>{label}</div>
      <div style={{ display:'flex', alignItems:'flex-end', gap:4 }}>
        <span style={{ fontSize: large ? 32 : 22, fontWeight:800, color: large ? '#fff' : color || 'var(--text)', lineHeight:1 }}>{value}</span>
        <span style={{ fontSize:12, fontWeight:600, color: large ? 'rgba(255,255,255,0.7)' : 'var(--text2)', marginBottom:2 }}>{unit}</span>
        {trend !== undefined && (
          <span style={{ marginBottom:2, color: trend > 0 ? '#4CAF82' : trend < 0 ? '#F4845F' : 'var(--text2)', display:'flex', alignItems:'center' }}>
            {trend > 0 ? <Icons.ArrowUp/> : trend < 0 ? <Icons.ArrowDown/> : null}
          </span>
        )}
      </div>
    </div>
  )
}
