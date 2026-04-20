const ACTIVITY_MULT = {
  sedentary: 1.2,
  light:     1.375,
  moderate:  1.55,
  active:    1.725,
  extreme:   1.9,
}

export function calcTDEE({ age, sex, weightKg, heightCm, activity }) {
  const bmr = sex === 'male'
    ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * age - 161
  return Math.round(bmr * (ACTIVITY_MULT[activity] ?? 1.55))
}

export function adjustForGoal(tdee, goal) {
  if (goal === 'lose') return tdee - 500
  if (goal === 'gain') return tdee + 300
  return tdee
}

export function calcMacros(kcal, weightKg) {
  const protein = Math.round(weightKg * 2)
  const fat     = Math.round(kcal * 0.25 / 9)
  const carbs   = Math.round((kcal - protein * 4 - fat * 9) / 4)
  return { protein, fat, carbs }
}
