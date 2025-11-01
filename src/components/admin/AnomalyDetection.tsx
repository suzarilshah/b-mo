import { useState, useEffect } from 'react'
import { useCompany } from '@/hooks/useCompany'
import { getAnomalies } from '@/lib/neon/anomaly'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Anomaly } from '@/lib/neon/anomaly'

export function AnomalyDetection() {
  const { company } = useCompany()
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (company) {
      loadAnomalies()
    }
  }, [company])

  const loadAnomalies = async () => {
    if (!company) return

    setLoading(true)
    try {
      const data = await getAnomalies(company.id)
      setAnomalies(data)
    } catch (error) {
      console.error('Failed to load anomalies:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!company) {
    return <div>No company selected</div>
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Anomaly Detection</CardTitle>
          <Button onClick={loadAnomalies} disabled={loading} size="sm">
            {loading ? 'Scanning...' : 'Scan Transactions'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {anomalies.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No anomalies detected
          </div>
        ) : (
          <div className="space-y-3">
            {anomalies.map((anomaly, index) => (
              <div
                key={index}
                className={`p-3 border-l-4 rounded ${
                  anomaly.severity === 'high' ? 'border-red-500 bg-red-50' :
                  anomaly.severity === 'medium' ? 'border-orange-500 bg-orange-50' :
                  'border-yellow-500 bg-yellow-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        anomaly.severity === 'high' ? 'bg-red-200 text-red-800' :
                        anomaly.severity === 'medium' ? 'bg-orange-200 text-orange-800' :
                        'bg-yellow-200 text-yellow-800'
                      }`}>
                        {anomaly.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">{anomaly.type}</span>
                    </div>
                    <div className="text-sm mt-1">{anomaly.description}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Confidence: {(anomaly.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Navigate to transaction detail
                      console.log('View transaction:', anomaly.transaction_id)
                    }}
                  >
                    Review
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}


