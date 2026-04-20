const today = () => new Date().toISOString().slice(0, 10)

// ── Profile ──────────────────────────────────────────────────────────────────
export function getProfile() {
  try { return JSON.parse(localStorage.getItem('fitter_profile')) || null } catch { return null }
}
export function saveProfile(profile) {
  localStorage.setItem('fitter_profile', JSON.stringify(profile))
}

// ── Meals ─────────────────────────────────────────────────────────────────────
export function getMeals() {
  try { return JSON.parse(localStorage.getItem('fitter_meals')) || [] } catch { return [] }
}
export function addMeal(meal) {
  const meals = getMeals()
  meals.push({ id: Date.now(), date: today(), timestamp: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }), ...meal })
  localStorage.setItem('fitter_meals', JSON.stringify(meals))
}
export function getTodayMeals() {
  return getMeals().filter(m => m.date === today())
}
export function getMealsByDate(dateStr) {
  return getMeals().filter(m => m.date === dateStr)
}

// ── Water ─────────────────────────────────────────────────────────────────────
export function getWater() {
  try {
    const w = JSON.parse(localStorage.getItem('fitter_water'))
    if (w?.date === today()) return w.count
  } catch {}
  return 0
}
export function setWater(count) {
  localStorage.setItem('fitter_water', JSON.stringify({ date: today(), count }))
}

// ── Theme ─────────────────────────────────────────────────────────────────────
export function getTheme() {
  return localStorage.getItem('fitter_theme') || 'light'
}
export function saveTheme(theme) {
  localStorage.setItem('fitter_theme', theme)
}

// ── Streak ────────────────────────────────────────────────────────────────────
export function calcStreak() {
  const meals = getMeals()
  const daysWithMeals = new Set(meals.map(m => m.date))
  let streak = 0
  const d = new Date()
  while (true) {
    const key = d.toISOString().slice(0, 10)
    if (!daysWithMeals.has(key)) break
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

// ── Weekly data ───────────────────────────────────────────────────────────────
export function getWeeklyData() {
  const result = []
  const meals = getMeals()
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('en', { weekday: 'short' })
    const dayMeals = meals.filter(m => m.date === key)
    const calories = Math.round(dayMeals.reduce((s, m) => s + (m.calories || 0), 0))
    const logged = dayMeals.length > 0
    result.push({ key, label, calories, logged })
  }
  return result
}
