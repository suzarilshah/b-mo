import { query } from './client'
import type { Forecast } from './schema'

/**
 * Get forecasts for a company
 */
export async function getForecasts(
  companyId: string,
  filters?: {
    forecast_type?: string
    startDate?: string
    endDate?: string
    limit?: number
  }
): Promise<Forecast[]> {
  let sql = 'SELECT * FROM forecasts WHERE company_id = $1'
  const params: any[] = [companyId]
  let paramIndex = 2

  if (filters?.forecast_type) {
    sql += ` AND forecast_type = $${paramIndex}`
    params.push(filters.forecast_type)
    paramIndex++
  }
  if (filters?.startDate) {
    sql += ` AND forecast_date >= $${paramIndex}`
    params.push(filters.startDate)
    paramIndex++
  }
  if (filters?.endDate) {
    sql += ` AND forecast_date <= $${paramIndex}`
    params.push(filters.endDate)
    paramIndex++
  }

  sql += ' ORDER BY forecast_date ASC'

  if (filters?.limit) {
    sql += ` LIMIT $${paramIndex}`
    params.push(filters.limit)
  }

  return await query<Forecast>(sql, params)
}

/**
 * Create forecast records
 */
export async function createForecasts(
  companyId: string,
  forecasts: Array<{
    forecast_type: 'sales' | 'revenue' | 'expense' | 'kpi'
    metric_name?: string
    forecast_date: string
    predicted_value: number
    confidence_interval_lower?: number
    confidence_interval_upper?: number
    model_version?: string
    input_data?: Record<string, any>
  }>
): Promise<Forecast[]> {
  const results: Forecast[] = []

  for (const forecast of forecasts) {
    const forecastId = crypto.randomUUID()
    const result = await query<Forecast>(
      `INSERT INTO forecasts (
        id, company_id, forecast_type, metric_name, forecast_date,
        predicted_value, confidence_interval_lower, confidence_interval_upper,
        model_version, input_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
      RETURNING *`,
      [
        forecastId,
        companyId,
        forecast.forecast_type,
        forecast.metric_name || null,
        forecast.forecast_date,
        forecast.predicted_value,
        forecast.confidence_interval_lower || null,
        forecast.confidence_interval_upper || null,
        forecast.model_version || null,
        forecast.input_data ? JSON.stringify(forecast.input_data) : null,
      ]
    )
    results.push(result[0])
  }

  return results
}


