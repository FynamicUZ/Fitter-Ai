export async function lookupBarcode(barcode) {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
    const json = await res.json()
    if (json.status !== 1) return null
    const n = json.product?.nutriments || {}
    const serving = json.product?.serving_quantity || 100
    return {
      calories_kcal: Math.round(n['energy-kcal_serving'] ?? n['energy-kcal_100g'] ?? 0),
      mass_g:        Math.round(serving),
      fat_g:         Math.round((n['fat_serving'] ?? n['fat_100g'] ?? 0) * 10) / 10,
      carb_g:        Math.round((n['carbohydrates_serving'] ?? n['carbohydrates_100g'] ?? 0) * 10) / 10,
      protein_g:     Math.round((n['proteins_serving'] ?? n['proteins_100g'] ?? 0) * 10) / 10,
      name:          json.product?.product_name || 'Packaged food',
    }
  } catch {
    return null
  }
}
