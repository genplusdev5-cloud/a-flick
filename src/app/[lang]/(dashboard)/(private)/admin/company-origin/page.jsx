'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Grid,
  Card,
  Button,
  MenuItem,
  Box,
  Typography,
  InputAdornment,
  IconButton,
  CardHeader,
  Dialog,
  DialogContent,
  Breadcrumbs
} from '@mui/material'
import { useRouter, useSearchParams } from 'next/navigation'
import { openDB } from 'idb'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import VisibilityIcon from '@mui/icons-material/Visibility'
import RefreshIcon from '@mui/icons-material/Refresh'
import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import { Autocomplete } from '@mui/material'

// IndexedDB setup function
const getCompanyDB = async () => {
  return openDB('companyDB', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('companies')) {
        db.createObjectStore('companies', { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

// Initial form data
const initialCompanyFormData = {
  companyCode: '',
  companyName: '',
  phone: '',
  email: '',
  taxNumber: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  glContractAccount: '',
  glJobAccount: '',
  glContJobAccount: '',
  glWarrantyAccount: '',
  uenNumber: '',
  gstNumber: '',
  invoicePrefixCode: '',
  invoiceStartNumber: '',
  contractPrefixCode: '',
  status: 'Active',
  bankName: '',
  bankAccountNumber: '',
  bankCode: '',
  swiftCode: '',
  accountingDate: null,
  uploadedFileName: '',
  uploadedFileURL: ''
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function EditCompanyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileInputRef = useRef(null)
  const dbId = searchParams.get('dbId')

  const [formData, setFormData] = useState(initialCompanyFormData)
  const [editCompanyId, setEditCompanyId] = useState(null)
  const [selectedFile, setSelectedFile] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [loading, setLoading] = useState(false)

  const taxNumberRef = useRef(null)
  const [taxNumberOpen, setTaxNumberOpen] = useState(false)
  const taxNumberOptions = ['TN-001', 'TN-002', 'TN-003', 'Others']

  const pageTitle = 'Company Origin'

  // Fetch and pre-fill data
  useEffect(() => {
    ;(async () => {
      if (!dbId) return
      const numericDbId = Number(dbId)
      try {
        const db = await getCompanyDB()
        const existing = await db.get('companies', numericDbId)
        if (existing) {
          setFormData({
            ...initialCompanyFormData,
            ...existing,
            accountingDate: existing.accountingDate ? new Date(existing.accountingDate) : null,
            uploadedFileName: existing.uploadedFileName || '',
            uploadedFileURL: existing.uploadedFileURL || ''
          })
          setSelectedFile(existing.uploadedFileName || '')
          setEditCompanyId(existing.id)
        }
      } catch (err) {
        console.error('Failed to load company:', err)
      }
    })()
  }, [dbId])

  const handleChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCompanyNameChange = e => {
    const value = e.target.value.replace(/[^a-zA-Z ]/g, '')
    setFormData(prev => ({ ...prev, companyName: value }))
  }

  const handlePhoneChange = e => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 10) value = value.slice(0, 10)
    if (value.length > 5 && value.indexOf(' ') === -1) value = value.slice(0, 5) + ' ' + value.slice(5)
    setFormData(prev => ({ ...prev, phone: value }))
  }

  const handleCityChange = e => {
    const value = e.target.value.replace(/[^a-zA-Z\s]/g, '')
    setFormData(prev => ({ ...prev, city: value }))
  }

  const handleInvoiceStartNumberChange = e => {
    const value = e.target.value.replace(/\D/g, '')
    setFormData(prev => ({ ...prev, invoiceStartNumber: value }))
  }

  const handleDateChange = date => {
    setFormData(prev => ({ ...prev, accountingDate: date }))
  }

  const handleFileChange = e => {
    const file = e.target.files[0]
    if (file) {
      const fileURL = URL.createObjectURL(file)
      setSelectedFile(file.name)
      setFormData(prev => ({
        ...prev,
        uploadedFileName: file.name,
        uploadedFileURL: fileURL
      }))
    }
    e.target.value = null
  }

  const handleFileDrop = e => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      const fileURL = URL.createObjectURL(file)
      setSelectedFile(file.name)
      setFormData(prev => ({
        ...prev,
        uploadedFileName: file.name,
        uploadedFileURL: fileURL
      }))
    }
  }

  const handleTaxNumberAutocompleteChange = (event, newValue) => {
    setFormData(prev => ({
      ...prev,
      taxNumber: newValue || ''
    }))
  }

  const handleSave = async () => {
    if (!formData.companyName || !formData.email || !EMAIL_REGEX.test(formData.email)) {
      alert('Please fill in a valid Name and Email.')
      return
    }

    try {
      const db = await getCompanyDB()
      const dataToSave = {
        ...formData,
        id: editCompanyId,
        accountingDate: formData.accountingDate ? formData.accountingDate.toISOString() : null,
        updatedAt: new Date().toISOString()
      }

      await db.put('companies', dataToSave)

      // Navigate back to list page
      router.push('/admin/company-origin')
    } catch (err) {
      console.error('Error saving company:', err)
      alert('Failed to save company data.')
    }
  }

  const handleViewLogo = () => {
    if (formData.uploadedFileURL) setOpenDialog(true)
    else alert('No image available to view.')
  }

  const handleCloseDialog = () => setOpenDialog(false)

  const handleRefresh = async () => {
    setLoading(true)

    try {
      if (!dbId) {
        // If new company (not editing), just reset form fields
        setFormData(initialCompanyFormData)
        setSelectedFile('')
      } else {
        // Reload only the company data from IndexedDB
        const db = await getCompanyDB()
        const numericDbId = Number(dbId)
        const existing = await db.get('companies', numericDbId)

        if (existing) {
          setFormData({
            ...initialCompanyFormData,
            ...existing,
            accountingDate: existing.accountingDate ? new Date(existing.accountingDate) : null,
            uploadedFileName: existing.uploadedFileName || '',
            uploadedFileURL: existing.uploadedFileURL || ''
          })
          setSelectedFile(existing.uploadedFileName || '')
          setEditCompanyId(existing.id)
        }
      }
    } catch (err) {
      console.error('Error refreshing company data:', err)
    } finally {
      setTimeout(() => setLoading(false), 800)
    }
  }

  return (
    <Box>
      {/* Breadcrumb + Header */}
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs aria-label='breadcrumb'>
          <Typography
            component='a'
            href='/admin/dashboards'
            sx={{
              color: 'primary.main',
              textDecoration: 'none',
              fontWeight: 500,
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            Dashboard
          </Typography>
          <Typography color='text.primary'>{pageTitle}</Typography>
        </Breadcrumbs>
      </Box>

      <Card sx={{ p: 3 }}>
        {/* Header Title + Refresh */}

        <Box display='flex' alignItems='center' gap={2} mb={3}>
          <Typography variant='h5' sx={{ fontWeight: 600 }}>
            {pageTitle}
          </Typography>

          <Button
            variant='contained'
            color='primary'
            startIcon={
              <RefreshIcon
                sx={{
                  animation: loading ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                  }
                }}
              />
            }
            disabled={loading}
            onClick={handleRefresh}
            sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Box>

        {/* Company Form */}
        <Grid container spacing={6}>
          {/* Code */}
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Code'
              name='companyCode'
              value={formData.companyCode || ''}
              onChange={handleChange}
            />
          </Grid>

          {/* Name */}
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Name'
              name='companyName'
              value={formData.companyName || ''}
              onChange={handleCompanyNameChange}
            />
          </Grid>

          {/* Phone */}
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Phone'
              name='phone'
              value={formData.phone || ''}
              onChange={handlePhoneChange}
            />
          </Grid>

          {/* Email */}
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Email'
              name='email'
              value={formData.email || ''}
              onChange={handleChange}
              error={formData.email !== '' && !EMAIL_REGEX.test(formData.email)}
              helperText={formData.email !== '' && !EMAIL_REGEX.test(formData.email) ? 'Enter a valid email' : ''}
            />
          </Grid>

          {/* Tax Number */}
          <Grid item xs={12} md={3}>
            <Autocomplete
              ref={taxNumberRef}
              freeSolo={false}
              options={taxNumberOptions}
              value={formData.taxNumber || null}
              open={taxNumberOpen}
              onOpen={() => setTaxNumberOpen(true)}
              onClose={() => setTaxNumberOpen(false)}
              onFocus={() => setTaxNumberOpen(true)}
              onChange={handleTaxNumberAutocompleteChange}
              noOptionsText='No options'
              renderInput={params => <CustomTextField label='Tax Number' {...params} />}
            />
          </Grid>

          {/* Address Line 1 */}
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Address Line 1'
              name='addressLine1'
              value={formData.addressLine1 || ''}
              onChange={handleChange}
            />
          </Grid>

          {/* Address Line 2 */}
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Address Line 2'
              name='addressLine2'
              value={formData.addressLine2 || ''}
              onChange={handleChange}
            />
          </Grid>

          {/* City */}
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='City'
              name='city'
              value={formData.city || ''}
              onChange={handleCityChange}
            />
          </Grid>

          {/* GL Fields */}
          {[
            { label: 'GL-Contract', name: 'glContractAccount' },
            { label: 'GL-Job', name: 'glJobAccount' },
            { label: 'GL-Cont.Job', name: 'glContJobAccount' },
            { label: 'GL-Warranty', name: 'glWarrantyAccount' }
          ].map((field, i) => (
            <Grid item xs={12} md={3} key={i}>
              <CustomTextField
                fullWidth
                label={field.label}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={handleChange}
              />
            </Grid>
          ))}

          {/* UEN Number */}
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='UEN Number'
              name='uenNumber'
              value={formData.uenNumber || ''}
              onChange={handleChange}
            />
          </Grid>

          {/* GST Reg. Number */}
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='GST Reg. Number'
              name='gstNumber'
              value={formData.gstNumber || ''}
              onChange={handleChange}
            />
          </Grid>

          {/* Invoice Prefix */}
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Invoice Prefix'
              name='invoicePrefixCode'
              value={formData.invoicePrefixCode || ''}
              onChange={handleChange}
            />
          </Grid>

          {/* Invoice Start No. */}
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Invoice Start No.'
              name='invoiceStartNumber'
              value={formData.invoiceStartNumber || ''}
              onChange={handleInvoiceStartNumberChange}
            />
          </Grid>

          {/* Contract Prefix */}
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Contract Prefix'
              name='contractPrefixCode'
              value={formData.contractPrefixCode || ''}
              onChange={handleChange}
            />
          </Grid>
        </Grid>

        <Grid container spacing={6} sx={{ mt: 4 }}>
          {/* Bank Details */}
          {[
            { label: 'Bank Name', name: 'bankName' },
            { label: 'Bank Account Number', name: 'bankAccountNumber' },
            { label: 'Bank Code', name: 'bankCode' },
            { label: 'Swift Code', name: 'swiftCode' }
          ].map((f, i) => (
            <Grid item xs={12} md={3} key={i}>
              <CustomTextField
                fullWidth
                label={f.label}
                name={f.name}
                value={formData[f.name] || ''}
                onChange={handleChange}
              />
            </Grid>
          ))}

          {/* Accounting Date */}
          <Grid item xs={12} md={3}>
            <AppReactDatepicker
              selected={formData.accountingDate}
              onChange={handleDateChange}
              dateFormat='dd/MM/yyyy'
              placeholderText='DD/MM/YYYY'
              customInput={
                <CustomTextField
                  fullWidth
                  label='Accounting Date'
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <CalendarTodayIcon />
                      </InputAdornment>
                    )
                  }}
                />
              }
            />
          </Grid>

          {/* Status */}
          <Grid item xs={12} md={3}>
            <CustomTextField
              select
              fullWidth
              label='Status'
              name='status'
              value={formData.status || 'Active'}
              onChange={handleChange}
            >
              <MenuItem value='Active'>Active</MenuItem>
              <MenuItem value='Inactive'>Inactive</MenuItem>
            </CustomTextField>
          </Grid>

          {/* Logo Upload */}
          <Grid item xs={12} md={6}>
            <Typography sx={{ mb: 1, fontSize: '0.8rem', fontWeight: 500 }}>Logo</Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'stretch' }}>
              <input
                type='file'
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept='image/*'
              />
              <Button
                variant='outlined'
                fullWidth
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={handleFileDrop}
                sx={{
                  borderColor: 'black',
                  borderStyle: 'solid',
                  borderWidth: 1,
                  py: 1.5,
                  flexGrow: 1
                }}
              >
                <Typography
                  sx={{
                    color: selectedFile ? 'text.primary' : 'text.disabled',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {selectedFile || 'Upload File / Drag & Drop'}
                </Typography>
              </Button>

              {selectedFile && (
                <IconButton
                  color='primary'
                  onClick={handleViewLogo}
                  sx={{ border: '1px solid currentColor', borderRadius: '8px', p: 1.5 }}
                  title='View Uploaded Logo'
                >
                  <VisibilityIcon />
                </IconButton>
              )}
            </Box>
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12} sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
            <Button variant='outlined' onClick={() => router.push('/admin/company-origin')}>
              Cancel
            </Button>
            <Button variant='contained' onClick={handleSave}>
              Update
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Logo Preview Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth='sm' fullWidth>
        <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {formData.uploadedFileURL && (
            <img
              src={formData.uploadedFileURL}
              alt='Uploaded Logo'
              style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  )
}
