import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export async function printAgreement(elementId = 'agreement-preview') {
  const input = document.getElementById(elementId)
  if (!input) {
    console.error('Agreement element not found:', elementId)
    return
  }

  // Wait for all images
  const imgs = Array.from(input.querySelectorAll('img'))
  await Promise.all(
    imgs.map(
      img =>
        new Promise(resolve => {
          if (img.complete) return resolve()
          img.onload = img.onerror = () => resolve()
        })
    )
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

  // full-page render
  const width = pdf.internal.pageSize.getWidth()
  const height = pdf.internal.pageSize.getHeight()

  pdf.addImage(imgData, 'PNG', 0, 0, width, height)

  // OPEN PDF IN NEW TAB EXACTLY LIKE INVOICE
  const blob = pdf.output('blob')
  const blobURL = URL.createObjectURL(blob)
  window.open(blobURL, '_blank')
}
