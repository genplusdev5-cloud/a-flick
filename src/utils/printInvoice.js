import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export const printInvoice = async elementId => {
  const input = document.getElementById(elementId)

  if (!input) {
    console.error("Invoice element not found:", elementId)
    return
  }

  // HTML → Canvas conversion
  const canvas = await html2canvas(input, {
    scale: 2, // high quality
    useCORS: true,
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF('p', 'mm', 'a4')

  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width

  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)

  // Preview open
  window.open(pdf.output('bloburl'), '_blank')

  // Download file
  pdf.save('invoice.pdf')
}
