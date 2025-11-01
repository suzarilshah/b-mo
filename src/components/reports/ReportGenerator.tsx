import { useState } from 'react'
import { useCompany } from '@/hooks/useCompany'
import { generateSOFP, formatSOFPForExport } from '@/lib/reports/sofp'
import { generateSOPL, formatSOPLForExport } from '@/lib/reports/sopl'
import { summarizeSOFP, summarizeSOPL } from '@/lib/reports/summarize'
import { generatePDFReport, downloadPDF } from '@/lib/export/pdf'
import { generateExcel, downloadExcel } from '@/lib/export/excel'
import { arrayToCSV, downloadCSV } from '@/lib/export/csv'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type ReportType = 'sofp' | 'sopl'

export function ReportGenerator() {
  const { company } = useCompany()
  const [reportType, setReportType] = useState<ReportType>('sofp')
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0])
  const [periodStart, setPeriodStart] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  )
  const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().split('T')[0])
  const [generating, setGenerating] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [generatingSummary, setGeneratingSummary] = useState(false)

  const handleGenerateReport = async () => {
    if (!company) return

    setGenerating(true)
    setSummary(null)

    try {
      let data: string[][]

      if (reportType === 'sofp') {
        const report = await generateSOFP(company.id, asOfDate)
        data = formatSOFPForExport(report)
        
        // Generate summary
        setGeneratingSummary(true)
        try {
          const aiSummary = await summarizeSOFP(report)
          setSummary(aiSummary)
        } catch (error) {
          console.error('Failed to generate summary:', error)
        } finally {
          setGeneratingSummary(false)
        }
      } else {
        const report = await generateSOPL(company.id, periodStart, periodEnd)
        data = formatSOPLForExport(report)
        
        // Generate summary
        setGeneratingSummary(true)
        try {
          const aiSummary = await summarizeSOPL(report)
          setSummary(aiSummary)
        } catch (error) {
          console.error('Failed to generate summary:', error)
        } finally {
          setGeneratingSummary(false)
        }
      }

      // Store data for export
      ;(window as any).lastReportData = data
    } catch (error: any) {
      console.error('Failed to generate report:', error)
      alert(`Failed to generate report: ${error.message}`)
    } finally {
      setGenerating(false)
    }
  }

  const handleExportPDF = async () => {
    const data = (window as any).lastReportData
    if (!data) {
      alert('Please generate a report first')
      return
    }

    const title = reportType === 'sofp' ? 'Statement of Financial Position' : 'Statement of Profit or Loss'
    const blob = await generatePDFReport(title, data)
    const filename = `${reportType}_${company?.name}_${new Date().toISOString().split('T')[0]}.pdf`
    downloadPDF(blob, filename)
  }

  const handleExportExcel = () => {
    const data = (window as any).lastReportData
    if (!data) {
      alert('Please generate a report first')
      return
    }

    const blob = generateExcel(data, reportType === 'sofp' ? 'SOFP' : 'SOPL')
    const filename = `${reportType}_${company?.name}_${new Date().toISOString().split('T')[0]}.xlsx`
    downloadExcel(blob, filename)
  }

  const handleExportCSV = () => {
    const data = (window as any).lastReportData
    if (!data) {
      alert('Please generate a report first')
      return
    }

    const csv = arrayToCSV(data)
    const filename = `${reportType}_${company?.name}_${new Date().toISOString().split('T')[0]}.csv`
    downloadCSV(csv, filename)
  }

  if (!company) {
    return <div>Please select a company first</div>
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Financial Reports</CardTitle>
        <CardDescription>
          Generate Statement of Financial Position or Profit & Loss reports
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Report Type</label>
          <div className="flex gap-4">
            <Button
              variant={reportType === 'sofp' ? 'default' : 'outline'}
              onClick={() => setReportType('sofp')}
            >
              Statement of Financial Position
            </Button>
            <Button
              variant={reportType === 'sopl' ? 'default' : 'outline'}
              onClick={() => setReportType('sopl')}
            >
              Statement of Profit or Loss
            </Button>
          </div>
        </div>

        {reportType === 'sofp' ? (
          <div>
            <label htmlFor="asOfDate" className="block text-sm font-medium mb-1">
              As of Date
            </label>
            <input
              id="asOfDate"
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="periodStart" className="block text-sm font-medium mb-1">
                Period Start
              </label>
              <input
                id="periodStart"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label htmlFor="periodEnd" className="block text-sm font-medium mb-1">
                Period End
              </label>
              <input
                id="periodEnd"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        )}

        <Button
          onClick={handleGenerateReport}
          disabled={generating || generatingSummary}
          className="w-full"
        >
          {generating ? 'Generating...' : generatingSummary ? 'Generating AI Summary...' : 'Generate Report'}
        </Button>

        {summary && (
          <div className="p-4 bg-blue-50 rounded-md">
            <h3 className="font-medium mb-2">AI-Powered Summary</h3>
            <p className="text-sm whitespace-pre-wrap">{summary}</p>
          </div>
        )}

        {(window as any).lastReportData && (
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleExportPDF} size="sm">
              Export PDF
            </Button>
            <Button variant="outline" onClick={handleExportExcel} size="sm">
              Export Excel
            </Button>
            <Button variant="outline" onClick={handleExportCSV} size="sm">
              Export CSV
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


