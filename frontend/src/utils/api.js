const API_BASE = import.meta.env.VITE_API_URL ?? ''

export async function predictImage(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_BASE}/predict`, { method: 'POST', body: form })
  if (!res.ok) throw new Error(`Prediction failed: ${res.status}`)
  return res.json()
}
