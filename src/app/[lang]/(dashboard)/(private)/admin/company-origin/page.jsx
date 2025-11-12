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

import { getCompanyList, getCompanyDetails, updateCompany } from '@/api/company'
import { useRouter } from 'next/navigation'

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

export default function CompanyOriginPage() {
  const router = useRouter()
  const fileInputRef = useRef(null)
  const [formData, setFormData] = useState(initialCompanyFormData)
  const [selectedFile, setSelectedFile] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [companyId, setCompanyId] = useState(null)

  const taxNumberRef = useRef(null)
  const [taxNumberOpen, setTaxNumberOpen] = useState(false)
  const taxNumberOptions = ['TN-001', 'TN-002', 'TN-003', 'Others']

  const pageTitle = 'Company Origin'

  useEffect(() => {
    ;(async () => {
      try {
        const list = await getCompanyList()
        if (list.length > 0) {
          const firstCompany = list[0]
          setCompanyId(firstCompany.id)

          // ✅ Fetch details first
          const details = await getCompanyDetails(firstCompany.id)
          console.log('✅ Company details:', details)

          // ✅ Now safely map the backend → frontend keys
          setFormData({
            ...initialCompanyFormData,
            companyCode: details.company_code || '',
            companyName: details.name || '',
            phone: details.phone || '',
            email: details.email || '',
            taxNumber: details.tax_id || '',
            addressLine1: details.address_line_1 || '',
            addressLine2: details.address_line_2 || '',
            city: details.city || '',
            glContractAccount: details.gl_contract || '',
            glJobAccount: details.gl_job || '',
            glContJobAccount: details.gl_continuous_job || '',
            glWarrantyAccount: details.gl_warranty || '',
            uenNumber: details.uen_number || '',
            gstNumber: details.gst_number || '',
            invoicePrefixCode: details.invoice_prefix || '',
            invoiceStartNumber: details.invoice_start_number || '',
            contractPrefixCode: details.contract_prefix || '',
            status: details.is_active === 1 ? 'Active' : 'Inactive',
            bankName: details.bank_name || '',
            bankAccountNumber: details.bank_account || '',
            bankCode: details.bank_code || '',
            swiftCode: details.swift_code || '',
            accountingDate: details.bill_start_date ? new Date(details.bill_start_date) : null,
            uploadedFileName: details.image_name || '',
            uploadedFileURL: details.logo || ''
          })

          setSelectedFile(details.image_name || '')
        } else {
          console.warn('No company found in list.')
        }
      } catch (error) {
        console.error('Failed to load company:', error)
      }
    })()
  }, [])

  // ✅ Handle Input Changes
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

  // ✅ File Upload Handling
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

  // ✅ Save / Update Company
  const handleSave = async () => {
    if (!formData.companyName || !formData.email || !EMAIL_REGEX.test(formData.email)) {
      alert('Please fill in a valid Name and Email.')
      return
    }

    try {
      if (!companyId) {
        alert('No company found to update.')
        return
      }

      const payload = {
        ...formData,
        accountingDate: formData.accountingDate ? formData.accountingDate.toISOString() : null
      }

      const response = await updateCompany(companyId, payload)
      console.log('✅ Update success:', response)
      alert('Company details updated successfully.')
    } catch (error) {
      console.error('❌ Error updating company:', error)
      alert('Failed to update company data.')
    }
  }

  // ✅ Refresh
  const handleRefresh = async () => {
    setLoading(true)
    try {
      const list = await getCompanyList()
      if (list.length > 0) {
        const firstCompany = list[0]
        const details = await getCompanyDetails(firstCompany.id)

        setFormData({
          ...initialCompanyFormData,
          ...details,
          accountingDate: details.accountingDate ? new Date(details.accountingDate) : null
        })
        setCompanyId(firstCompany.id)
        setSelectedFile(details.uploadedFileName || '')
      }
    } catch (err) {
      console.error('Error refreshing company data:', err)
    } finally {
      setTimeout(() => setLoading(false), 800)
    }
  }

  const handleViewLogo = () => {
    if (formData.uploadedFileURL) setOpenDialog(true)
    else alert('No image available to view.')
  }

  const handleCloseDialog = () => setOpenDialog(false)

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
          <Typography color='text.primary'>{pageTitle}</Typography>
        </Breadcrumbs>
      </Box>

      {/* Main Card */}
      <Card sx={{ p: 3 }}>
        {/* Header */}
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

        {/* Form Fields */}
        <Grid container spacing={6}>
          {/* Basic Fields */}
          {[
            { label: 'Code', name: 'companyCode' },
            { label: 'Name', name: 'companyName', onChange: handleCompanyNameChange },
            { label: 'Phone', name: 'phone', onChange: handlePhoneChange },
            { label: 'Email', name: 'email' }
          ].map((field, i) => (
            <Grid item xs={12} md={3} key={i}>
              <CustomTextField
                fullWidth
                label={field.label}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={field.onChange || handleChange}
                error={field.name === 'email' && formData.email !== '' && !EMAIL_REGEX.test(formData.email)}
                helperText={
                  field.name === 'email' && formData.email !== '' && !EMAIL_REGEX.test(formData.email)
                    ? 'Enter a valid email'
                    : ''
                }
              />
            </Grid>
          ))}

          {/* Tax Number */}
          <Grid item xs={12} md={3}>
            <Autocomplete
              ref={taxNumberRef}
              freeSolo={false}
              options={taxNumberOptions}
              value={formData.taxNumber?.toString() || null}
              getOptionLabel={option => option?.toString() || ''}
              isOptionEqualToValue={(option, value) => option?.toString() === value?.toString()}
              open={taxNumberOpen}
              onOpen={() => setTaxNumberOpen(true)}
              onClose={() => setTaxNumberOpen(false)}
              onFocus={() => setTaxNumberOpen(true)}
              onChange={handleTaxNumberAutocompleteChange}
              noOptionsText='No options'
              renderInput={params => <CustomTextField label='Tax Number' {...params} />}
            />
          </Grid>

          {/* Address */}
          {['addressLine1', 'addressLine2', 'city'].map((name, i) => (
            <Grid item xs={12} md={3} key={i}>
              <CustomTextField
                fullWidth
                label={name === 'addressLine1' ? 'Address Line 1' : name === 'addressLine2' ? 'Address Line 2' : 'City'}
                name={name}
                value={formData[name] || ''}
                onChange={name === 'city' ? handleCityChange : handleChange}
              />
            </Grid>
          ))}

          {/* GL Fields */}
          {[
            { label: 'GL-Contract', name: 'glContractAccount' },
            { label: 'GL-Job', name: 'glJobAccount' },
            { label: 'GL-Cont.Job', name: 'glContJobAccount' },
            { label: 'GL-Warranty', name: 'glWarrantyAccount' }
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

          {/* Other Fields */}
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
                value={formData[f.name] || ''}
                onChange={f.name === 'invoiceStartNumber' ? handleInvoiceStartNumberChange : handleChange}
              />
            </Grid>
          ))}
        </Grid>

        {/* Bank Section */}
        <Grid container spacing={6} sx={{ mt: 4 }}>
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

          {/* Buttons */}
          <Grid item xs={12} sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
            <Button variant='outlined' onClick={handleRefresh}>
              Cancel
            </Button>
            <Button variant='contained' color='primary' onClick={handleSave}>
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
