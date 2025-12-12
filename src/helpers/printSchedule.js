// helpers/printSchedule.js
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/**
 * elementId: ID of DOM node that contains SchedulePDF component
 */
export async function printSchedule(elementId = 'schedule-preview-container') {
  const input = document.getElementById(elementId)
  if (!input) {
    console.error('Schedule element not found:', elementId)
    return
  }

  // Wait for all images inside Schedule PDF to load
  const imgs = Array.from(input.querySelectorAll('img'))
  await Promise.all(
    imgs.map(img => {
      return new Promise(resolve => {
        if (img.complete) return resolve()
        img.onload = img.onerror = () => resolve()
      })
    })
  )

  // Convert HTML → Canvas
  const canvas = await html2canvas(input, {
    scale: 3,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false
  })

  const imgData = canvas.toDataURL('image/png')

  // Generate PDF
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width

  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)

  // Open preview tab
  window.open(pdf.output('bloburl'), '_blank')

  // Auto-download PDF
  pdf.save(`schedule_${Date.now()}.pdf`)
}
