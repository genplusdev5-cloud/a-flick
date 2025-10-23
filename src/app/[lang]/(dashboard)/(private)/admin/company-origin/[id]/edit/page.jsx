'use client'

import { useState, useEffect, useRef } from 'react'
import { Grid, Card, Button, MenuItem, Box, Typography, InputAdornment, IconButton, Dialog, DialogContent } from '@mui/material'
import { useRouter, useSearchParams } from 'next/navigation'
import { openDB } from 'idb'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import VisibilityIcon from '@mui/icons-material/Visibility'

import ContentLayout from '@/components/layout/ContentLayout'
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

// Initial form data structure
const initialCompanyFormData = {
  companyCode: '', // Mapped from 'Prefix' in your original code to 'Code' in the form
  companyName: '', // Mapped from 'Name' in the form
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

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function EditCompanyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileInputRef = useRef(null)

  const dbId = searchParams.get('dbId')

  const [formData, setFormData] = useState(initialCompanyFormData)
  const [editCompanyId, setEditCompanyId] = useState(null)
  const [selectedFile, setSelectedFile] = useState('')
  const [openDialog, setOpenDialog] = useState(false) // For image dialog

  const taxNumberRef = useRef(null)
  const [taxNumberOpen, setTaxNumberOpen] = useState(false)
  const taxNumberOptions = ['TN-001', 'TN-002', 'TN-003', 'Others']

  const pageTitle = 'Edit Company'

  // *** CRITICAL useEffect Logic: Fetch and Pre-fill ***
  useEffect(() => {
    ;(async () => {
      if (!dbId) return
      const numericDbId = Number(dbId)
      try {
        const db = await getCompanyDB()
        const existing = await db.get('companies', numericDbId)

        if (existing) {
          // Map fetched data to form state
          setFormData({
            ...initialCompanyFormData,
            ...existing,
            // Convert ISO string back to Date object for the date picker
            accountingDate: existing.accountingDate ? new Date(existing.accountingDate) : null,
            // Ensure file details are present
            uploadedFileName: existing.uploadedFileName || '',
            uploadedFileURL: existing.uploadedFileURL || ''
          })
          setSelectedFile(existing.uploadedFileName || '')
          setEditCompanyId(existing.id)
        } else {
          console.error(`Company with DB ID ${dbId} not found.`)
        }
      } catch (err) {
        console.error('Failed to load company:', err)
      }
    })()
  }, [dbId])

  const handleChange = e => {
    const { name, value } = e.target
    // Map 'name' from the form field to 'companyName' in the state if necessary (based on how your form is named)
    // The previous code had a slight mismatch, but since `initialCompanyFormData` now uses `companyName` and `companyCode`, we update the logic.
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Custom handlers for specific fields where mapping or formatting is needed
  const handleCompanyNameChange = e => {
    const value = e.target.value.replace(/[^a-zA-Z ]/g, '')
    setFormData(prev => ({ ...prev, companyName: value }))
  }

  const handlePhoneChange = e => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 10) value = value.slice(0, 10)
    // Check if space needs to be added for formatting "xxxxx xxxxx"
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

  // --- File Upload & Dialog Preview ---
  const handleFileChange = e => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file.name)
      // For local testing, create a temporary URL for preview
      const fileURL = URL.createObjectURL(file)
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
      setSelectedFile(file.name)
      const fileURL = URL.createObjectURL(file)
      setFormData(prev => ({
        ...prev,
        uploadedFileName: file.name,
        uploadedFileURL: fileURL
      }))
    }
  }

  const handleViewLogo = () => {
    if (formData.uploadedFileURL) setOpenDialog(true)
    else alert('No image available to view.')
  }

  const handleCloseDialog = () => setOpenDialog(false)

  const handleSave = async () => {
    // Check fields using companyName and email
    if (!formData.companyName || !formData.email || !EMAIL_REGEX.test(formData.email)) {
      alert('Please fill in a valid Name and Email.')
      return
    }

    const db = await getCompanyDB()
    const dataToSave = {
      ...formData,
      // Use the stored ID to update the existing record
      id: editCompanyId,
      // Convert Date object to ISO string for storage
      accountingDate: formData.accountingDate ? formData.accountingDate.toISOString() : null,
      updatedAt: new Date().toISOString()
    }

    // Save/Update the full data object
    await db.put('companies', dataToSave)

    router.push('/admin/company-origin')
  }

  const handleTaxNumberAutocompleteChange = (e, newValue) => {
    setFormData(prev => ({ ...prev, taxNumber: newValue }))
  }

  return (
    <ContentLayout
      title={pageTitle}
      breadcrumbs={[
        { label: 'Dashboard', href: '/admin/dashboards' },
        { label: 'Company Origin', href: '/admin/company-origin' },
        { label: pageTitle }
      ]}
    >
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Card sx={{ p: 4, boxShadow: 'none' }} elevation={0}>
            <Grid container spacing={6}>
              {/* Code (Used to store companyCode) */}
              <Grid item xs={12} md={3}>
                <CustomTextField
                  fullWidth
                  label='Code'
                  name='companyCode'
                  value={formData.companyCode || ''}
                  onChange={handleChange}
                />
              </Grid>

              {/* Name (Used to store companyName) */}
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

              {/* Tax Number Autocomplete */}
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
                  renderInput={params => (
                    <CustomTextField
                      label='Tax Number'
                      {...params}
                      inputProps={{
                        ...params.inputProps,
                        onKeyDown: e => { if (e.key === 'Enter') e.preventDefault() }
                      }}
                    />
                  )}
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

              {/* GL Accounts */}
              <Grid item xs={12} md={3}>
                <CustomTextField
                  fullWidth
                  label='GL-Contract'
                  name='glContractAccount'
                  value={formData.glContractAccount || ''}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <CustomTextField
                  fullWidth
                  label='GL-Job'
                  name='glJobAccount'
                  value={formData.glJobAccount || ''}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <CustomTextField
                  fullWidth
                  label='GL-Cont.Job'
                  name='glContJobAccount'
                  value={formData.glContJobAccount || ''}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <CustomTextField
                  fullWidth
                  label='GL-Warranty'
                  name='glWarrantyAccount'
                  value={formData.glWarrantyAccount || ''}
                  onChange={handleChange}
                />
              </Grid>

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
              {/* Bank Name */}
              <Grid item xs={12} md={3}>
                <CustomTextField
                  fullWidth
                  label='Bank Name'
                  name='bankName'
                  value={formData.bankName || ''}
                  onChange={handleChange}
                />
              </Grid>

              {/* Bank Account Number */}
              <Grid item xs={12} md={3}>
                <CustomTextField
                  fullWidth
                  label='Bank Account Number'
                  name='bankAccountNumber'
                  value={formData.bankAccountNumber || ''}
                  onChange={handleChange}
                />
              </Grid>

              {/* Bank Code */}
              <Grid item xs={12} md={3}>
                <CustomTextField
                  fullWidth
                  label='Bank Code'
                  name='bankCode'
                  value={formData.bankCode || ''}
                  onChange={handleChange}
                />
              </Grid>

              {/* Swift Code */}
              <Grid item xs={12} md={3}>
                <CustomTextField
                  fullWidth
                  label='Swift Code'
                  name='swiftCode'
                  value={formData.swiftCode || ''}
                  onChange={handleChange}
                />
              </Grid>

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

              {/* Status Select */}
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

              {/* Logo Upload & View */}
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
        </Grid>
      </Grid>

      {/* Image Dialog */}
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
    </ContentLayout>
  )
}
