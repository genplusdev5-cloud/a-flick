'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Box, Button, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PrintIcon from '@mui/icons-material/Print'

import PermissionGuard from '@/components/auth/PermissionGuard'
import ProgressCircularCustomization from '@/components/common/ProgressCircularCustomization'
import { showToast } from '@/components/common/Toasts'

import { getInvoiceDetails, updateInvoice } from '@/api/invoice_group/invoice'
import InvoicePDF from '@/components/invoice/InvoicePDF'

const InvoiceViewPage = () => {
  const { id } = useParams()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [invoiceData, setInvoiceData] = useState(null)

  useEffect(() => {
    if (!id) return

    const loadInvoice = async () => {
      setLoading(true)
      try {
        const res = await getInvoiceDetails(id)

        // handle both res & res.data
        const data = res?.data || res
        setInvoiceData(data)
      } catch (err) {
        console.error(err)
        showToast('error', 'Failed to load invoice')
      } finally {
        setLoading(false)
      }
    }

    loadInvoice()
  }, [id])

  // PRINT FUNCTION
  const handlePrint = async () => {
    const element = document.getElementById('invoice-print')

    if (!element) return

    const html2canvas = (await import('html2canvas')).default
    const jsPDF = (await import('jspdf')).default

    const canvas = await html2canvas(element, {
      scale: 3,
      backgroundColor: '#ffffff'
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')

    const width = pdf.internal.pageSize.getWidth()
    const height = (canvas.height * width) / canvas.width

    pdf.addImage(imgData, 'PNG', 0, 0, width, height)
    pdf.autoPrint()

    window.open(pdf.output('bloburl'), '_blank')
  }

  if (loading) {
    return (
      <Box sx={{ height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ProgressCircularCustomization size={70} />
      </Box>
    )
  }

  if (!invoiceData) {
    return (
      <Typography align='center' color='error'>
        Invoice not found
      </Typography>
    )
  }

  return (
    <Box sx={{ px: 4, py: 3 }}>
      {/* TOP ACTION BAR */}
      <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
        <Button startIcon={<ArrowBackIcon />} variant='outlined' onClick={() => router.back()}>
          Back
        </Button>

        <Button startIcon={<PrintIcon />} variant='contained' onClick={handlePrint}>
          Print
        </Button>
      </Box>

      {/* PRINT STYLE VIEW */}
      <Box
        id='invoice-print'
        sx={{
          background: '#fff',
          p: 4,
          boxShadow: 3,
          maxWidth: '210mm',
          mx: 'auto'
        }}
      >
        <InvoicePDF invoiceData={invoiceData} />
      </Box>
    </Box>
  )
}

export default function InvoiceViewPageWrapper() {
  return (
    <PermissionGuard permission='Invoice'>
      <InvoiceViewPage />
    </PermissionGuard>
  )
}
