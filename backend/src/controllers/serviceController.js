import { query } from '../config/database.js'

function mapService(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    categoryId: row.category_id,
    category: row.category_name,
    description: row.description,
    durationMinutes: Number(row.duration_minutes),
    price: Number(row.price),
    image: row.image_url,
    isActive: row.is_active,
    isDiscountEligible: row.is_discount_eligible,
    simultaneousCapacity: row.simultaneous_capacity,
  }
}

export async function listServices(req, res, next) {
  try {
    const result = await query(
      `SELECT s.*, c.name AS category_name
       FROM services s
       JOIN service_categories c ON c.id = s.category_id
       WHERE s.is_active = TRUE AND c.is_active = TRUE
       ORDER BY c.display_order ASC, s.display_order ASC, s.name ASC`,
    )
    res.json({ services: result.rows.map(mapService) })
  } catch (error) {
    next(error)
  }
}

export async function listServiceCategories(req, res, next) {
  try {
    const result = await query(
      `SELECT id, name, slug, description, display_order AS "displayOrder", is_active AS "isActive"
       FROM service_categories
       WHERE is_active = TRUE
       ORDER BY display_order ASC, name ASC`,
    )
    res.json({ categories: result.rows })
  } catch (error) {
    next(error)
  }
}
