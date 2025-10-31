import { useState, useEffect } from 'react'
import { useCompany } from '@/hooks/useCompany'
import { getDocuments, updateDocumentStatus } from '@/lib/neon/documents'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getFilePreviewUrl } from '@/lib/appwrite/storage'
import type { Document } from '@/lib/neon/schema'

export function DocumentList() {
  const { company } = useCompany()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'review' | 'approved'>('all')

  useEffect(() => {
    if (company) {
      loadDocuments()
    }
  }, [company, filter])

  const loadDocuments = async () => {
    if (!company) return

    setLoading(true)
    try {
      const filters: any = {}
      if (filter !== 'all') {
        filters.status = filter
      }
      const data = await getDocuments(company.id, filters)
      setDocuments(data)
    } catch (error) {
      console.error('Failed to load documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (documentId: string) => {
    if (!company) return

    try {
      await updateDocumentStatus(company.id, documentId, 'approved')
      await loadDocuments()
    } catch (error) {
      console.error('Failed to approve document:', error)
    }
  }

  const handleReject = async (documentId: string) => {
    if (!company) return

    try {
      await updateDocumentStatus(company.id, documentId, 'rejected')
      await loadDocuments()
    } catch (error) {
      console.error('Failed to reject document:', error)
    }
  }

  if (!company) {
    return <div>No company selected</div>
  }

  if (loading) {
    return <div>Loading documents...</div>
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Documents</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('pending')}
            >
              Pending
            </Button>
            <Button
              variant={filter === 'review' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('review')}
            >
              Review
            </Button>
            <Button
              variant={filter === 'approved' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('approved')}
            >
              Approved
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No documents found
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 border rounded-md hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="font-medium">{doc.file_name}</div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      doc.status === 'approved' ? 'bg-green-100 text-green-700' :
                      doc.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      doc.status === 'review' ? 'bg-yellow-100 text-yellow-700' :
                      doc.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {doc.status}
                    </span>
                    {doc.ocr_confidence !== null && doc.ocr_confidence !== undefined && (
                      <span className="text-xs text-gray-500">
                        Confidence: {(doc.ocr_confidence * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {doc.document_type} • {new Date(doc.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {doc.appwrite_file_id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = getFilePreviewUrl(doc.appwrite_file_id)
                        window.open(url, '_blank')
                      }}
                    >
                      View
                    </Button>
                  )}
                  {doc.status === 'review' || doc.status === 'processing' ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApprove(doc.id)}
                        className="text-green-600 border-green-600"
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(doc.id)}
                        className="text-red-600 border-red-600"
                      >
                        Reject
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

