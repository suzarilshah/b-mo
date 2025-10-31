import { useState, useEffect } from 'react'
import { useCompany } from '@/hooks/useCompany'
import { getForecasts } from '@/lib/neon/forecasts'
import { generateForecast } from '@/lib/forecasting/lstm'
import { createForecasts } from '@/lib/neon/forecasts'
import { chatCompletion } from '@/lib/azure/gpt5'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { Forecast } from '@/lib/neon/schema'

export function ForecastDashboard() {
  const { company } = useCompany()
  const [forecasts, setForecasts] = useState<Forecast[]>([])
  const [forecastType, setForecastType] = useState<'sales' | 'revenue' | 'expense' | 'kpi'>('sales')
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [generatingSummary, setGeneratingSummary] = useState(false)

  useEffect(() => {
    if (company) {
      loadForecasts()
    }
  }, [company, forecastType])

  const loadForecasts = async () => {
    if (!company) return

    try {
      const data = await getForecasts(company.id, {
        forecast_type: forecastType,
        limit: 30,
      })
      setForecasts(data)

      // Generate summary if forecasts exist
      if (data.length > 0) {
        generateSummary(data)
      }
    } catch (error) {
      console.error('Failed to load forecasts:', error)
    }
  }

  const generateNewForecast = async () => {
    if (!company) return

    setLoading(true)
    try {
      const forecastResults = await generateForecast({
        companyId: company.id,
        forecastType,
      })

      // Store in database
      await createForecasts(company.id, forecastResults)
      await loadForecasts()
    } catch (error) {
      console.error('Failed to generate forecast:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateSummary = async (forecastData: Forecast[]) => {
    setGeneratingSummary(true)
    try {
      const prompt = `Analyze these financial forecasts and provide insights:

Forecast Type: ${forecastType}
Forecasts:
${forecastData.slice(0, 10).map(f => 
  `${f.forecast_date}: ${f.predicted_value} (range: ${f.confidence_interval_lower || 'N/A'} - ${f.confidence_interval_upper || 'N/A'})`
).join('\n')}

Provide:
1. Key trends
2. Notable patterns
3. Business recommendations`

      const aiSummary = await chatCompletion([
        {
          role: 'system',
          content: 'You are a financial forecasting analyst providing insights on predictions.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ], {
        temperature: 0.7,
        maxTokens: 500,
      })

      setSummary(aiSummary)
    } catch (error) {
      console.error('Failed to generate summary:', error)
    } finally {
      setGeneratingSummary(false)
    }
  }

  if (!company) {
    return <div>No company selected</div>
  }

  const chartData = forecasts.map(f => ({
    date: new Date(f.forecast_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    predicted: f.predicted_value,
    lower: f.confidence_interval_lower || f.predicted_value * 0.9,
    upper: f.confidence_interval_upper || f.predicted_value * 1.1,
  }))

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Forecasting</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={forecastType === 'sales' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setForecastType('sales')}
              >
                Sales
              </Button>
              <Button
                variant={forecastType === 'revenue' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setForecastType('revenue')}
              >
                Revenue
              </Button>
              <Button
                variant={forecastType === 'expense' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setForecastType('expense')}
              >
                Expenses
              </Button>
              <Button
                onClick={generateNewForecast}
                disabled={loading}
                size="sm"
              >
                {loading ? 'Generating...' : 'Generate Forecast'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {forecasts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No forecasts available</p>
              <Button onClick={generateNewForecast} disabled={loading}>
                Generate Forecast
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="predicted" stroke="#14b8a6" strokeWidth={2} name="Predicted" />
                  <Line type="monotone" dataKey="lower" stroke="#f97316" strokeDasharray="5 5" name="Lower Bound" />
                  <Line type="monotone" dataKey="upper" stroke="#f97316" strokeDasharray="5 5" name="Upper Bound" />
                </LineChart>
              </ResponsiveContainer>

              {generatingSummary ? (
                <div className="text-center py-4 text-gray-500">Generating AI summary...</div>
              ) : summary ? (
                <div className="p-4 bg-blue-50 rounded-md">
                  <h3 className="font-medium mb-2">AI Forecast Summary</h3>
                  <p className="text-sm whitespace-pre-wrap">{summary}</p>
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

