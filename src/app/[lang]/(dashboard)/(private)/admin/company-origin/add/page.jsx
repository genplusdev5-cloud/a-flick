'use client'

import { useState, useRef } from 'react'
import {
  Grid,
  Card,
  Button,
  MenuItem,
  Box,
  Typography,
  InputAdornment,
  IconButton,
  Dialog,
  DialogContent,
  Breadcrumbs
} from '@mui/material'

import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import VisibilityIcon from '@mui/icons-material/Visibility'
import RefreshIcon from '@mui/icons-material/Refresh'

import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import { Autocomplete } from '@mui/material'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// -------------------------------------------------------

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

// -------------------------------------------------------

export default function CompanyOriginAddPage() {
  const fileInputRef = useRef(null)

  const [formData, setFormData] = useState(initialCompanyFormData)
  const [selectedFile, setSelectedFile] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [taxNumberOpen, setTaxNumberOpen] = useState(false)

  const taxNumberOptions = ['TN-001', 'TN-002', 'TN-003', 'Others']

  // -------------------------------------------------------
  // INPUT HANDLERS
  // -------------------------------------------------------

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
    if (value.length > 5 && !value.includes(' ')) value = value.slice(0, 5) + ' ' + value.slice(5)
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

  // -------------------------------------------------------
  // FILE UPLOAD
  // -------------------------------------------------------

  const handleFileChange = e => {
    const file = e.target.files[0]
    if (!file) return

    const fileURL = URL.createObjectURL(file)

    setSelectedFile(file.name)
    setFormData(prev => ({
      ...prev,
      uploadedFileName: file.name,
      uploadedFileURL: fileURL
    }))
  }

  const handleViewLogo = () => setOpenDialog(true)
  const handleCloseDialog = () => setOpenDialog(false)

  // -------------------------------------------------------
  // REFRESH (UI ONLY)
  // -------------------------------------------------------

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setFormData(initialCompanyFormData)
      setSelectedFile('')
      setLoading(false)
    }, 500)
  }

  // -------------------------------------------------------
  // SAVE (UI ONLY)
  // -------------------------------------------------------

  const handleSave = () => {
    console.log('🔥 Form Submitted:', formData)
    alert('Company Origin Added (UI only)')
  }

  // -------------------------------------------------------
  // UI RENDER
  // -------------------------------------------------------

  return (
    <Box>
      {/* Breadcrumb */}
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
          <Typography color='text.primary'>Add Company Origin</Typography>
        </Breadcrumbs>
      </Box>

      {/* Main Card */}
      <Card sx={{ p: 3 }}>
        {/* Page Header */}
        <Box display='flex' alignItems='center' gap={2} mb={3}>
          <Typography variant='h5' sx={{ fontWeight: 600 }}>
            Add Company Origin
          </Typography>

          <Button
            variant='contained'
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

        {/* Form Section */}
        <Grid container spacing={6}>
          {/* BASIC FIELDS */}
          {[
            { label: 'Code', name: 'companyCode' },
            { label: 'Name', name: 'companyName', onChange: handleCompanyNameChange },
            { label: 'Phone', name: 'phone', onChange: handlePhoneChange },
            { label: 'Email', name: 'email' }
          ].map((f, i) => (
            <Grid item xs={12} md={3} key={i}>
              <CustomTextField
                fullWidth
                label={f.label}
                name={f.name}
                value={formData[f.name]}
                onChange={f.onChange || handleChange}
                error={f.name === 'email' && formData.email && !EMAIL_REGEX.test(formData.email)}
                helperText={
                  f.name === 'email' && formData.email && !EMAIL_REGEX.test(formData.email)
                    ? 'Enter a valid email'
                    : ''
                }
              />
            </Grid>
          ))}

          {/* TAX NUMBER */}
          <Grid item xs={12} md={3}>
            <Autocomplete
              freeSolo={false}
              options={taxNumberOptions}
              value={formData.taxNumber || null}
              open={taxNumberOpen}
              onOpen={() => setTaxNumberOpen(true)}
              onClose={() => setTaxNumberOpen(false)}
              onChange={(e, val) => setFormData(prev => ({ ...prev, taxNumber: val || '' }))}
              renderInput={params => <CustomTextField {...params} label='Tax Number' />}
            />
          </Grid>

          {/* ADDRESS */}
          {['addressLine1', 'addressLine2', 'city'].map((name, i) => (
            <Grid item xs={12} md={3} key={i}>
              <CustomTextField
                fullWidth
                label={
                  name === 'addressLine1'
                    ? 'Address Line 1'
                    : name === 'addressLine2'
                    ? 'Address Line 2'
                    : 'City'
                }
                name={name}
                value={formData[name]}
                onChange={name === 'city' ? handleCityChange : handleChange}
              />
            </Grid>
          ))}

          {/* GL FIELDS */}
          {[
            { label: 'GL-Contract', name: 'glContractAccount' },
            { label: 'GL-Job', name: 'glJobAccount' },
            { label: 'GL-Cont.Job', name: 'glContJobAccount' },
            { label: 'GL-Warranty', name: 'glWarrantyAccount' }
          ].map((f, i) => (
            <Grid item xs={12} md={3} key={i}>
              <CustomTextField fullWidth label={f.label} name={f.name} value={formData[f.name]} onChange={handleChange} />
            </Grid>
          ))}

          {/* OTHER FIELDS */}
          {[
            { label: 'UEN Number', name: 'uenNumber' },
            { label: 'GST Reg. Number', name: 'gstNumber' },
            { label: 'Invoice Prefix', name: 'invoicePrefixCode' },
            { label: 'Invoice Start No.', name: 'invoiceStartNumber' },
            { label: 'Contract Prefix', name: 'contractPrefixCode' }
          ].map((f, i) => (
            <Grid item xs={12} md={3} key={i}>
              <CustomTextField
                fullWidth
                label={f.label}
                name={f.name}
                value={formData[f.name]}
                onChange={f.name === 'invoiceStartNumber' ? handleInvoiceStartNumberChange : handleChange}
              />
            </Grid>
          ))}
        </Grid>

        {/* BANK SECTION */}
        <Grid container spacing={6} sx={{ mt: 4 }}>
          {[
            { label: 'Bank Name', name: 'bankName' },
            { label: 'Bank Account Number', name: 'bankAccountNumber' },
            { label: 'Bank Code', name: 'bankCode' },
            { label: 'Swift Code', name: 'swiftCode' }
          ].map((f, i) => (
            <Grid item xs={12} md={3} key={i}>
              <CustomTextField fullWidth label={f.label} name={f.name} value={formData[f.name]} onChange={handleChange} />
            </Grid>
          ))}

          {/* ACCOUNTING DATE */}
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

          {/* STATUS */}
          <Grid item xs={12} md={3}>
            <CustomTextField select fullWidth label='Status' name='status' value={formData.status} onChange={handleChange}>
              <MenuItem value='Active'>Active</MenuItem>
              <MenuItem value='Inactive'>Inactive</MenuItem>
            </CustomTextField>
          </Grid>

          {/* LOGO UPLOAD */}
          <Grid item xs={12} md={6}>
            <Typography sx={{ mb: 1, fontSize: '0.8rem', fontWeight: 500 }}>Logo</Typography>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <input
                type='file'
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept='image/*'
              />

              <Button
                variant='outlined'
                onClick={() => fileInputRef.current?.click()}
                fullWidth
                sx={{ py: 1.5 }}
              >
                {selectedFile || 'Upload File'}
              </Button>

              {selectedFile && (
                <IconButton color='primary' onClick={handleViewLogo}>
                  <VisibilityIcon />
                </IconButton>
              )}
            </Box>
          </Grid>

          {/* BUTTONS */}
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
            <Button variant='outlined' onClick={handleRefresh}>
              Cancel
            </Button>

            <Button variant='contained' onClick={handleSave}>
              Save
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* LOGO PREVIEW */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth='sm'>
        <DialogContent>
          <img src={formData.uploadedFileURL} style={{ width: '100%' }} />
        </DialogContent>
      </Dialog>
    </Box>
  )
}
