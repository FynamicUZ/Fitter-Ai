import { Icons } from './Icons'

const items = [
  { id:'home',      label:'Home',     Icon: Icons.Home  },
  { id:'dashboard', label:'Progress', Icon: Icons.Chart },
  { id:'profile',   label:'Profile',  Icon: Icons.User  },
]

export default function BottomNav({ page, setPage }) {
  return (
    <nav style={{
      position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
      width:'100%', maxWidth:480, background:'var(--card)',
      borderTop:'1px solid var(--border)', display:'flex',
      padding:'8px 0 max(8px, env(safe-area-inset-bottom))',
      zIndex:100, backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
    }}>
      {items.map(({ id, label, Icon }) => {
        const active = page === id
        return (
          <button key={id} onClick={() => setPage(id)} style={{
            flex:1, border:'none', background:'none', cursor:'pointer',
            display:'flex', flexDirection:'column', alignItems:'center', gap:3,
            color: active ? 'var(--primary)' : 'var(--text2)',
            transition:'color 0.2s ease', padding:'4px 0',
          }}>
            <div style={{ transform: active ? 'scale(1.1)' : 'scale(1)', transition:'transform 0.2s ease' }}>
              <Icon/>
            </div>
            <span style={{ fontSize:10, fontWeight: active ? 700 : 500 }}>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
