import { useState, useEffect } from 'react'
import { useCompany } from '@/hooks/useCompany'
import { getAuditLogs } from '@/lib/neon/audit'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AuditLog } from '@/lib/neon/schema'

export function AuditLogViewer() {
  const { company } = useCompany()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (company) {
      loadLogs()
    }
  }, [company])

  const loadLogs = async () => {
    if (!company) return

    setLoading(true)
    try {
      const data = await getAuditLogs(company.id, { limit: 100 })
      setLogs(data)
    } catch (error) {
      console.error('Failed to load audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!company) {
    return <div>No company selected</div>
  }

  if (loading) {
    return <div>Loading audit logs...</div>
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Audit Trail</CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No audit logs found
          </div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3 border rounded-md text-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{log.action}</div>
                    <div className="text-gray-600">
                      {log.resource_type} • {log.resource_id.slice(0, 8)}...
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                  {log.old_values && log.new_values && (
                    <div className="text-xs">
                      <div className="text-red-600">- {JSON.stringify(log.old_values)}</div>
                      <div className="text-green-600">+ {JSON.stringify(log.new_values)}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}


