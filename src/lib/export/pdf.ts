import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

/**
 * Generate PDF report
 */
export async function generatePDFReport(
  title: string,
  content: string[][] // Array of rows, each row is an array of cells
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create()
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)

  const page = pdfDoc.addPage([612, 792]) // US Letter size
  const { width, height } = page.getSize()

  // Title
  const titleSize = 24
  page.drawText(title, {
    x: 50,
    y: height - 50,
    size: titleSize,
    font: timesRomanBold,
    color: rgb(0.2, 0.4, 0.4), // Teal
  })

  // Table content
  let yPosition = height - 100
  const rowHeight = 20
  const fontSize = 12
  const margin = 50
  const columnWidth = (width - 2 * margin) / (content[0]?.length || 1)

  for (const row of content) {
    if (yPosition < 100) {
      // Add new page if needed
      pdfDoc.addPage([612, 792])
      yPosition = height - 50
    }

    let xPosition = margin
    for (const cell of row) {
      page.drawText(String(cell), {
        x: xPosition,
        y: yPosition,
        size: fontSize,
        font: timesRomanFont,
        color: rgb(0, 0, 0),
      })
      xPosition += columnWidth
    }

    yPosition -= rowHeight
  }

  const pdfBytes = await pdfDoc.save()
  return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
}

/**
 * Download PDF file
 */
export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

