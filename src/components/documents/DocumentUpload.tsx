import { useState, useRef } from 'react'
import { useCompany } from '@/hooks/useCompany'
import { useAuth } from '@/hooks/useAuth'
import { processDocument } from '@/lib/neon/documents'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function DocumentUpload() {
  const { company } = useCompany()
  const { user } = useAuth()
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<Record<string, { stage: string; progress: number }>>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setFiles(selectedFiles)
    setError(null)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFiles = Array.from(e.dataTransfer.files)
    setFiles(droppedFiles)
    setError(null)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleUpload = async () => {
    if (!company || !user || files.length === 0) {
      setError('Please select files and ensure you have a company')
      return
    }

    setUploading(true)
    setError(null)
    setSuccess([])
    const progressMap: Record<string, { stage: string; progress: number }> = {}

    try {
      for (const file of files) {
        try {
          // Track progress stages
          progressMap[file.name] = { stage: 'Uploading to storage...', progress: 0 }
          setProgress({ ...progressMap })

          // Process document (includes upload, OCR, embeddings, storage)
          progressMap[file.name] = { stage: 'Uploading file...', progress: 25 }
          setProgress({ ...progressMap })

          const document = await processDocument(
            company.id,
            file,
            user.$id
          )

          progressMap[file.name] = { stage: 'Complete', progress: 100 }
          setProgress({ ...progressMap })
          setSuccess(prev => [...prev, file.name])

          console.log('Document processed:', document)
        } catch (err: any) {
          console.error(`Failed to process ${file.name}:`, err)
          
          // Provide more specific error messages
          let errorMessage = err.message || 'Unknown error occurred'
          
          // Check for specific error types
          if (err.message?.includes('not authorized')) {
            errorMessage = `Storage permission error: Please check Appwrite Storage bucket permissions. The bucket must allow authenticated users to create files.`
          } else if (err.message?.includes('Function execution')) {
            errorMessage = `Processing error: ${err.message}. Please check that the process-document Appwrite Function is deployed and configured.`
          } else if (err.message?.includes('timeout')) {
            errorMessage = `Processing timeout: The document took too long to process. Please try again or contact support.`
          }
          
          setError(`Failed to process ${file.name}: ${errorMessage}`)
          
          // Reset progress for failed file
          delete progressMap[file.name]
          setProgress({ ...progressMap })
        }
      }
    } finally {
      setUploading(false)
      // Clear files after successful upload
      if (success.length > 0) {
        setFiles([])
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    }
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Upload Documents</CardTitle>
        <CardDescription>
          Upload invoices, receipts, or other financial documents for AI processing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
            {error}
          </div>
        )}

        {success.length > 0 && (
          <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md">
            Successfully processed: {success.join(', ')}
          </div>
        )}

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-teal-500 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.tiff"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <svg
              className="w-12 h-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-sm text-gray-600 mb-2">
              Drag and drop files here, or click to select
            </p>
            <p className="text-xs text-gray-500">
              PDF, JPG, PNG, TIFF up to 10MB
            </p>
          </label>
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Selected files:</p>
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <span className="text-sm">{file.name}</span>
                <span className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            ))}
          </div>
        )}

        {Object.keys(progress).length > 0 && (
          <div className="space-y-2">
            {Object.entries(progress).map(([filename, progInfo]) => (
              <div key={filename}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">{filename}</span>
                  <span className="text-gray-600">{progInfo.progress}%</span>
                </div>
                <div className="text-xs text-gray-500 mb-1">{progInfo.stage}</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-teal-600 h-2 rounded-full transition-all"
                    style={{ width: `${progInfo.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading || !company}
          className="w-full"
        >
          {uploading ? 'Processing...' : `Upload ${files.length} file${files.length !== 1 ? 's' : ''}`}
        </Button>
      </CardContent>
    </Card>
  )
}

