export default function DonutChart({ segments, size = 140 }) {
  const cx = size/2, cy = size/2, r = size/2 - 14, stroke = 22
  const circ = 2 * Math.PI * r
  let offset = 0
  const total = segments.reduce((s, g) => s + g.value, 0)
  const arcs = segments.map(seg => {
    const pct = seg.value / total
    const dash = pct * circ
    const arc = { ...seg, dash, offset: circ * (1 - offset) - circ, pct }
    offset += pct
    return arc
  })
  return (
    <div style={{ display:'flex', alignItems:'center', gap:20 }}>
      <svg width={size} height={size} style={{ flexShrink:0 }}>
        {arcs.map((arc, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={arc.color} strokeWidth={stroke}
            strokeDasharray={`${arc.dash} ${circ}`}
            strokeDashoffset={arc.offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="butt"
            style={{ transition: 'stroke-dasharray 0.6s ease' }}/>
        ))}
        <circle cx={cx} cy={cy} r={r - stroke/2 - 2} fill="var(--card)"/>
      </svg>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {segments.map(seg => (
          <div key={seg.label} style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:10, height:10, borderRadius:3, background:seg.color, flexShrink:0 }}/>
            <span style={{ fontSize:12, color:'var(--text2)' }}>{seg.label}</span>
            <span style={{ fontSize:12, fontWeight:700, color:'var(--text)', marginLeft:'auto' }}>{Math.round(seg.value)}g</span>
          </div>
        ))}
      </div>
    </div>
  )
}
