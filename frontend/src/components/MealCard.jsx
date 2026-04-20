const TYPE_COLORS = { Breakfast:'#F4845F', Lunch:'#4CAF82', Dinner:'#6B8EF0', Snack:'#C084FC' }
const TYPE_EMOJI  = { Breakfast:'🌅', Lunch:'🥗', Dinner:'🍽️', Snack:'🍎' }

export default function MealCard({ type, time, calories, protein, fat, carb }) {
  const col = TYPE_COLORS[type] || '#6B7280'
  const emoji = TYPE_EMOJI[type] || '🍴'
  return (
    <div style={{
      background: 'var(--card)', borderRadius: 14, padding: '12px 14px',
      display:'flex', alignItems:'center', gap:12,
      boxShadow: 'var(--shadow)', border: '1px solid var(--border)',
      transition: 'transform 0.15s ease, box-shadow 0.15s ease', cursor:'pointer',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='var(--shadow-hover)' }}
      onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='var(--shadow)' }}
    >
      <div style={{ width:46, height:46, borderRadius:12, background:`${col}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
        {emoji}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
          <span style={{ fontSize:11, fontWeight:700, color:col, background:`${col}18`, padding:'2px 7px', borderRadius:99 }}>{type}</span>
          <span style={{ fontSize:11, color:'var(--text2)' }}>{time}</span>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{Math.round(calories)} kcal</span>
          <span style={{ fontSize:12, color:'var(--text2)' }}>P:{Math.round(protein)}g</span>
          <span style={{ fontSize:12, color:'var(--text2)' }}>F:{Math.round(fat)}g</span>
          <span style={{ fontSize:12, color:'var(--text2)' }}>C:{Math.round(carb)}g</span>
        </div>
      </div>
    </div>
  )
}
