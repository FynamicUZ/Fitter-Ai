export default function LineChart({ eaten, goal, labels, width = 320, height = 160 }) {
  const pad = { top: 10, right: 10, bottom: 28, left: 36 }
  const w = width - pad.left - pad.right
  const h = height - pad.top - pad.bottom
  const allVals = [...eaten, ...goal].filter(v => v > 0)
  if (allVals.length === 0) return null
  const maxV = Math.max(...allVals) * 1.15
  const minV = Math.min(...allVals) * 0.85
  const xOf = i => pad.left + (i / (eaten.length - 1)) * w
  const yOf = v => pad.top + h - ((v - minV) / (maxV - minV)) * h

  const pathD = pts => pts.map((v, i) => {
    if (i === 0) return `M${xOf(i)},${yOf(v)}`
    const x0 = xOf(i-1), y0 = yOf(pts[i-1])
    const x1 = xOf(i),   y1 = yOf(v)
    const cpx = (x0 + x1) / 2
    return `C${cpx},${y0} ${cpx},${y1} ${x1},${y1}`
  }).join(' ')

  const areaD = pts => {
    const line = pathD(pts)
    return `${line} L${xOf(pts.length-1)},${pad.top+h} L${pad.left},${pad.top+h} Z`
  }

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow:'visible' }}>
      <defs>
        <linearGradient id="eatenGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4CAF82" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#4CAF82" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map(t => (
        <line key={t} x1={pad.left} x2={pad.left+w} y1={pad.top+h*t} y2={pad.top+h*t} stroke="var(--border)" strokeWidth="1"/>
      ))}
      <path d={areaD(eaten)} fill="url(#eatenGrad)"/>
      <path d={pathD(goal)} fill="none" stroke="#F4845F" strokeWidth="2" strokeDasharray="6 4" strokeLinecap="round"/>
      <path d={pathD(eaten)} fill="none" stroke="#4CAF82" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {eaten.map((v, i) => <circle key={i} cx={xOf(i)} cy={yOf(v)} r="4" fill="#4CAF82" stroke="var(--card)" strokeWidth="2"/>)}
      {goal.map((v, i) => <circle key={i} cx={xOf(i)} cy={yOf(v)} r="3" fill="#F4845F" stroke="var(--card)" strokeWidth="2"/>)}
      {labels.map((l, i) => (
        <text key={i} x={xOf(i)} y={height-4} textAnchor="middle" fontSize="10" fill="var(--text2)" fontFamily="Plus Jakarta Sans">{l}</text>
      ))}
      {[minV, (minV+maxV)/2, maxV].map((v, i) => (
        <text key={i} x={pad.left-6} y={yOf(v)+4} textAnchor="end" fontSize="10" fill="var(--text2)" fontFamily="Plus Jakarta Sans">{Math.round(v/100)*100}</text>
      ))}
    </svg>
  )
}
