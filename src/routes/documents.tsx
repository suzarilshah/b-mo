import { createFileRoute } from '@tanstack/react-router'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { DocumentUpload } from '@/components/documents/DocumentUpload'
import { DocumentList } from '@/components/documents/DocumentList'

export const Route = createFileRoute('/documents')({
  component: DocumentsPage,
})

function DocumentsPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <div>
          <h1 className="text-3xl font-bold mb-6 text-gray-800">Documents</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <DocumentUpload />
            </div>
            <div>
              <DocumentList />
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}


