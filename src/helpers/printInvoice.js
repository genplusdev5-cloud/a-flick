// helpers/printInvoice.js
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/**
 * elementId: id of DOM node that contains InvoicePDF component
 */
export async function printInvoice(elementId = 'invoice-preview') {
  const input = document.getElementById(elementId)
  if (!input) {
    console.error('Invoice element not found:', elementId)
    return
  }

  // Make sure images inside the element have loaded
  const imgs = Array.from(input.querySelectorAll('img'))
  await Promise.all(
    imgs.map(img => {
      return new Promise(resolve => {
        if (img.complete) return resolve()
        img.onload = img.onerror = () => resolve()
      })
    })
  )

  const canvas = await html2canvas(input, {
    scale: 3,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false
  })

  const imgData = canvas.toDataURL('image/png')

  const pdf = new jsPDF('p', 'mm', 'a4')
  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width

  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)

  // Open preview in new tab
  window.open(pdf.output('bloburl'), '_blank')

  // Download
  pdf.save(`invoice_${Date.now()}.pdf`)
}
