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
import CloseIcon from '@mui/icons-material/Close'

import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import { Autocomplete } from '@mui/material'

import { addCompany } from '@/api/master/company' // un API import
import { showToast } from '@/components/common/Toasts'
import { useRouter } from 'next/navigation'
import GlobalButton from '@/components/common/GlobalButton'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

export default function CompanyOriginAddPage() {
  const router = useRouter()
  const fileInputRef = useRef(null)

  const [formData, setFormData] = useState(initialCompanyFormData)
  const [selectedFile, setSelectedFile] = useState(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [taxNumberOpen, setTaxNumberOpen] = useState(false)

  const taxNumberOptions = ['TN-001', 'TN-002', 'TN-003', 'Others']

  const handleCancel = () => {
    router.push('/admin/company-origin') // ✅ list page route
  }

  // Input Handlers
  const handleChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCompanyNameChange = e => {
    const value = e.target.value.replace(/[^a-zA-Z\s]/g, '')
    setFormData(prev => ({ ...prev, companyName: value }))
  }

  const handlePhoneChange = e => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 10) value = value.slice(0, 10)
    if (value.length > 5) value = value.slice(0, 5) + ' ' + value.slice(5)
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

  // File Upload
  const handleFileChange = e => {
    const file = e.target.files[0]
    if (!file) return

    // Optional: Validate file type & size
    if (!file.type.startsWith('image/')) {
      showToast('error', 'Please upload an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Image size should be less than 5MB')
      return
    }

    const fileURL = URL.createObjectURL(file)
    setSelectedFile(file)
    setFormData(prev => ({
      ...prev,
      uploadedFileName: file.name,
      uploadedFileURL: fileURL
    }))
  }

  const handleViewLogo = () => setOpenDialog(true)
  const handleCloseDialog = () => setOpenDialog(false)

  // Refresh Form
  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setFormData(initialCompanyFormData)
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setLoading(false)
      showToast('info', 'Form cleared')
    }, 600)
  }

  // Save Company - API Call
  const handleSave = async () => {
    // Basic Validation
    if (!formData.companyCode.trim()) return showToast('warning', 'Company Code is required')
    if (!formData.companyName.trim()) return showToast('warning', 'Company Name is required')
    if (!formData.email.trim()) return showToast('warning', 'Email is required')
    if (formData.email && !EMAIL_REGEX.test(formData.email)) return showToast('warning', 'Enter valid email')
    if (!formData.phone.trim()) return showToast('warning', 'Phone is required')

    setLoading(true)

    try {
      const payload = new FormData()

      // Append all text fields
      payload.append('company_code', formData.companyCode.trim())
      payload.append('name', formData.companyName.trim())
      payload.append('phone', formData.phone.replace(/\s+/g, ''))
      payload.append('email', formData.email.trim())
      payload.append('tax_number', formData.taxNumber || '')
      payload.append('address_line1', formData.addressLine1.trim())
      payload.append('address_line2', formData.addressLine2.trim())
      payload.append('city', formData.city.trim())
      payload.append('gl_contract_account', formData.glContractAccount)
      payload.append('gl_job_account', formData.glJobAccount)
      payload.append('gl_cont_job_account', formData.glContJobAccount)
      payload.append('gl_warranty_account', formData.glWarrantyAccount)
      payload.append('uen_number', formData.uenNumber)
      payload.append('gst_number', formData.gstNumber)
      payload.append('invoice_prefix_code', formData.invoicePrefixCode)
      payload.append('invoice_start_number', formData.invoiceStartNumber || '1')
      payload.append('contract_prefix_code', formData.contractPrefixCode)
      payload.append('status', formData.status === 'Active' ? 1 : 0)
      payload.append('bank_name', formData.bankName)
      payload.append('bank_account_number', formData.bankAccountNumber)
      payload.append('bank_code', formData.bankCode)
      payload.append('swift_code', formData.swiftCode)

      if (formData.accountingDate) {
        const formattedDate = formData.accountingDate.toISOString().split('T')[0] // YYYY-MM-DD
        payload.append('accounting_date', formattedDate)
      }

      // Append logo if uploaded
      // Append logo if uploaded - CORRECT WAY
      if (selectedFile) {
        payload.append('company_logo', selectedFile) // 99% idhu work aagum
      }

      const response = await addCompany(payload)

      showToast('success', 'Company added successfully!')
      router.push('/admin/company-origin') // redirect to list page
    } catch (err) {
      console.error('Add Company Error:', err)
      const msg = err.response?.data?.message || err.message || 'Failed to add company'
      showToast('error', msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>

      {/* Breadcrumb */}
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs>
          <Typography component='a' href='/admin/dashboard' sx={{ color: 'primary.main', textDecoration: 'none' }}>
            Dashboard
          </Typography>
          <Typography
            component='a'
            href='/admin/company-origin'
            sx={{ color: 'text.secondary', textDecoration: 'none' }}
          >
            Company Origin
          </Typography>
          <Typography color='text.primary'>Add Company</Typography>
        </Breadcrumbs>
      </Box>

      <Card sx={{ p: { xs: 4, md: 6 }, borderRadius: 2, boxShadow: 3 }}>
        {/* Header */}
        <Box display='flex' justifyContent='space-between' alignItems='center' mb={5}>
          <Typography variant='h5' fontWeight={600}>
            Add Company Origin
          </Typography>

          <Button
            variant='contained'
            color='primary'
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        <Grid container spacing={5}>
          {/* Basic Info */}
          <Grid item xs={12} sm={6} md={3}>
            <CustomTextField
              fullWidth
              label='Company Code '
              name='companyCode'
              value={formData.companyCode}
              onChange={handleChange}
              disabled={loading}
              required
              sx={{
                '& .MuiFormLabel-asterisk': {
                  color: '#e91e63 !important',
                  fontWeight: 700
                },
                '& .MuiInputLabel-root.Mui-required': {
                  color: 'inherit'
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <CustomTextField
              fullWidth
              label='Company Name '
              name='companyName'
              value={formData.companyName}
              onChange={handleCompanyNameChange}
              disabled={loading}
              required
              sx={{
                '& .MuiFormLabel-asterisk': {
                  color: '#e91e63 !important',
                  fontWeight: 700
                },
                '& .MuiInputLabel-root.Mui-required': {
                  color: 'inherit'
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <CustomTextField
              fullWidth
              label='Phone '
              name='phone'
              value={formData.phone}
              onChange={handlePhoneChange}
              placeholder='12345 67890'
              disabled={loading}
              required
              sx={{
                '& .MuiFormLabel-asterisk': {
                  color: '#e91e63 !important',
                  fontWeight: 700
                },
                '& .MuiInputLabel-root.Mui-required': {
                  color: 'inherit'
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <CustomTextField
              fullWidth
              label='Email '
              name='email'
              value={formData.email}
              onChange={handleChange}
              error={formData.email && !EMAIL_REGEX.test(formData.email)}
              helperText={formData.email && !EMAIL_REGEX.test(formData.email) ? 'Invalid email' : ''}
              disabled={loading}
              required
              sx={{
                '& .MuiFormLabel-asterisk': {
                  color: '#e91e63 !important',
                  fontWeight: 700
                },
                '& .MuiInputLabel-root.Mui-required': {
                  color: 'inherit'
                }
              }}
            />
          </Grid>

          {/* Tax Number */}
          <Grid item xs={12} md={3}>
            <Autocomplete
              options={taxNumberOptions}
              value={formData.taxNumber || null}
              onChange={(e, val) => setFormData(prev => ({ ...prev, taxNumber: val || '' }))}
              renderInput={params => <CustomTextField {...params} label='Tax Number' />}
              disabled={loading}
            />
          </Grid>

          {/* Address */}
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Address Line 1'
              name='addressLine1'
              value={formData.addressLine1}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Address Line 2'
              name='addressLine2'
              value={formData.addressLine2}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <CustomTextField fullWidth label='City' name='city' value={formData.city} onChange={handleCityChange} />
          </Grid>

          {/* GL Accounts */}
          {['GlContractAccount', 'GlJobAccount', 'GlContJobAccount', 'GlWarrantyAccount'].map(field => (
            <Grid item xs={12} md={3} key={field}>
              <CustomTextField
                fullWidth
                label={field.replace(/([A-Z])/g, ' $1').trim()}
                name={field}
                value={formData[field]}
                onChange={handleChange}
                required
                sx={{
                  '& .MuiFormLabel-asterisk': {
                    color: '#e91e63 !important',
                    fontWeight: 700
                  },
                  '& .MuiInputLabel-root.Mui-required': {
                    color: 'inherit'
                  }
                }}
              />
            </Grid>
          ))}

          {/* Other Fields */}
          {[
            { name: 'uenNumber', label: 'UEN Number' },
            { name: 'gstNumber', label: 'GST Reg. Number' },
            { name: 'invoicePrefixCode', label: 'Invoice Prefix' },
            { name: 'invoiceStartNumber', label: 'Invoice Start No.', type: 'number' },
            { name: 'contractPrefixCode', label: 'Contract Prefix' }
          ].map(f => (
            <Grid item xs={12} md={3} key={f.name}>
              <CustomTextField
                fullWidth
                label={f.label}
                name={f.name}
                value={formData[f.name]}
                onChange={f.name === 'invoiceStartNumber' ? handleInvoiceStartNumberChange : handleChange}
                required
                sx={{
                  '& .MuiFormLabel-asterisk': {
                    color: '#e91e63 !important',
                    fontWeight: 700
                  },
                  '& .MuiInputLabel-root.Mui-required': {
                    color: 'inherit'
                  }
                }}
              />
            </Grid>
          ))}

          {/* Bank Details */}
          {['BankName', 'BankAccountNumber', 'BankCode', 'SwiftCode'].map(field => (
            <Grid item xs={12} md={3} key={field}>
              <CustomTextField
                fullWidth
                label={field.replace(/([A-Z])/g, ' $1').trim()}
                name={field}
                value={formData[field]}
                onChange={handleChange}
                required
                sx={{
                  '& .MuiFormLabel-asterisk': {
                    color: '#e91e63 !important',
                    fontWeight: 700
                  },
                  '& .MuiInputLabel-root.Mui-required': {
                    color: 'inherit'
                  }
                }}
              />
            </Grid>
          ))}

          {/* Date & Status */}
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
                    startAdornment: <CalendarTodayIcon />
                  }}
                />
              }
            />
          </Grid>
          {/* Logo Upload */}
          <Grid item xs={12} md={6}>
            <Typography variant='body2' fontWeight={500} mb={1}>
              Company Logo
            </Typography>
            <Box display='flex' gap={2} alignItems='center'>
              <input
                type='file'
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept='image/*'
              />
              <Button variant='outlined' onClick={() => fileInputRef.current?.click()} fullWidth disabled={loading}>
                {selectedFile ? selectedFile.name : 'Choose Logo'}
              </Button>
              {selectedFile && (
                <IconButton color='primary' onClick={handleViewLogo}>
                  <VisibilityIcon />
                </IconButton>
              )}
            </Box>
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box mt={6} display='flex' justifyContent='flex-end' gap={2}>
          <GlobalButton
            color='secondary'
            onClick={handleCancel} // ✅ CHANGE HERE
            disabled={loading}
          >
            Cancel
          </GlobalButton>

          <Button
            variant='contained'
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Company'}
          </Button>
        </Box>
      </Card>

      {/* Logo Preview Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth='sm' fullWidth>
        <IconButton
          onClick={handleCloseDialog}
          sx={{ position: 'absolute', right: 8, top: 8, bgcolor: 'background.paper' }}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent sx={{ p: 0 }}>
          <img src={formData.uploadedFileURL} alt='Logo Preview' style={{ width: '100%', borderRadius: 8 }} />
        </DialogContent>
      </Dialog>
    </Box>
  )
}
