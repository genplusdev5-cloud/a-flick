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
  Breadcrumbs,
  CircularProgress
} from '@mui/material'

import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import VisibilityIcon from '@mui/icons-material/Visibility'
import RefreshIcon from '@mui/icons-material/Refresh'
import CloseIcon from '@mui/icons-material/Close'

import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import { Autocomplete } from '@mui/material'

import { getCompany, updateCompany } from '@/api/master/company'
import { useParams, useRouter } from 'next/navigation'
import { showToast } from '@/components/common/Toasts'
import { decodeId } from '@/utils/urlEncoder'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function CompanyOriginEditPage() {
  const fileInputRef = useRef(null)
  const { id: encodedId } = useParams()
  const id = decodeId(encodedId)
  const router = useRouter()

  const [formData, setFormData] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null) // actual File object
  const [previewUrl, setPreviewUrl] = useState('') // for preview
  const [openDialog, setOpenDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const taxNumberOptions = ['TN-001', 'TN-002', 'TN-003', 'Others']

  // FETCH COMPANY ON MOUNT
  useEffect(() => {
    if (id) loadCompany()
  }, [id])

  const loadCompany = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await getCompanyDetails(id)
      const data = res.data || res

      setFormData({
        companyCode: data.company_code || '',
        companyName: data.name || '',
        phone: data.phone || '',
        email: data.email || '',
        taxNumber: data.tax_id ? String(data.tax_id) : '',
        addressLine1: data.address_line_1 || '',
        addressLine2: data.address_line_2 || '',
        city: data.city || '',
        glContractAccount: data.gl_contract || '',
        glJobAccount: data.gl_job || '',
        glContJobAccount: data.gl_continuous_job || '',
        glWarrantyAccount: data.gl_warranty || '',
        uenNumber: data.uen_number || '',
        gstNumber: data.gst_number || '',
        invoicePrefixCode: data.invoice_prefix || '',
        invoiceStartNumber: data.invoice_start_number || '',
        contractPrefixCode: data.contract_prefix || '',
        status: data.is_active === 1 ? 'Active' : 'Inactive',
        bankName: data.bank_name || '',
        bankAccountNumber: data.bank_account || '',
        bankCode: data.bank_code || '',
        swiftCode: data.swift_code || '',
        accountingDate: data.bill_start_date ? new Date(data.bill_start_date) : null
      })

      // Existing logo preview
      if (data.logo) {
        setPreviewUrl(data.logo)
      }
    } catch (err) {
      showToast('error', 'Failed to load company details')
      router.push('/admin/company-origin')
    } finally {
      setLoading(false)
    }
  }

  // HANDLERS
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

  const handleFileChange = e => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Please upload a valid image')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Image must be under 5MB')
      return
    }

    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  // SAVE / UPDATE
  const handleSave = async () => {
    if (!formData.companyCode.trim()) return showToast('warning', 'Company Code required')
    if (!formData.companyName.trim()) return showToast('warning', 'Company Name required')
    if (!formData.email.trim()) return showToast('warning', 'Email required')
    if (formData.email && !EMAIL_REGEX.test(formData.email)) return showToast('warning', 'Invalid email')

    setSaving(true)
    try {
      const payload = new FormData()

      // Text fields
      payload.append('company_code', formData.companyCode.trim())
      payload.append('name', formData.companyName.trim())
      payload.append('phone', formData.phone.replace(/\s/g, ''))
      payload.append('email', formData.email.trim())
      payload.append('tax_id', formData.taxNumber || '')
      payload.append('address_line_1', formData.addressLine1)
      payload.append('address_line_2', formData.addressLine2)
      payload.append('city', formData.city)
      payload.append('gl_contract', formData.glContractAccount)
      payload.append('gl_job', formData.glJobAccount)
      payload.append('gl_continuous_job', formData.glContJobAccount)
      payload.append('gl_warranty', formData.glWarrantyAccount)
      payload.append('uen_number', formData.uenNumber)
      payload.append('gst_number', formData.gstNumber)
      payload.append('invoice_prefix', formData.invoicePrefixCode)
      payload.append('invoice_start_number', formData.invoiceStartNumber || '1')
      payload.append('contract_prefix', formData.contractPrefixCode)
      payload.append('is_active', formData.status === 'Active' ? 1 : 0)
      payload.append('bank_name', formData.bankName)
      payload.append('bank_account', formData.bankAccountNumber)
      payload.append('bank_code', formData.bankCode)
      payload.append('swift_code', formData.swiftCode)

      if (formData.accountingDate) {
        payload.append('bill_start_date', formData.accountingDate.toISOString().split('T')[0])
      }

      // Only append logo if user selected a new one
      if (selectedFile) {
        payload.append('logo', selectedFile) // backend field name
        // OR try: payload.append('company_logo', selectedFile) if above fails
      }

      await updateCompany(id, payload)

      showToast('success', 'Company updated successfully!')
      router.push('/admin/company-origin')
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error?.logo?.[0] || 'Update failed'
      showToast('error', msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='70vh'>
        <CircularProgress />
      </Box>
    )
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
          <Typography color='text.primary'>Update Company</Typography>
        </Breadcrumbs>
      </Box>

      <Card sx={{ p: { xs: 4, md: 6 }, borderRadius: 2, boxShadow: 3 }}>
        <Box display='flex' justifyContent='space-between' alignItems='center' mb={5}>
          <Typography variant='h5' fontWeight={600}>
            Update Company Origin
          </Typography>
          <Button
            variant='contained'
            color='secondary'
            startIcon={<RefreshIcon />}
            onClick={loadCompany}
            disabled={saving}
          >
            Refresh
          </Button>
        </Box>

        <Grid container spacing={5}>
          {/* All Fields - Same as Add Page */}
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Code *'
              name='companyCode'
              value={formData.companyCode}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Name *'
              name='companyName'
              value={formData.companyName}
              onChange={handleCompanyNameChange}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Phone *'
              name='phone'
              value={formData.phone}
              onChange={handlePhoneChange}
              placeholder='12345 67890'
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <CustomTextField
              fullWidth
              label='Email *'
              name='email'
              value={formData.email}
              onChange={handleChange}
              error={formData.email && !EMAIL_REGEX.test(formData.email)}
              helperText={formData.email && !EMAIL_REGEX.test(formData.email) ? 'Invalid email' : ''}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Autocomplete
              options={taxNumberOptions}
              value={formData.taxNumber ? String(formData.taxNumber) : null}
              getOptionLabel={option => String(option || '')}
              isOptionEqualToValue={(option, value) => String(option) === String(value)}
              onChange={(e, v) => setFormData(prev => ({ ...prev, taxNumber: v || '' }))}
              renderInput={params => <CustomTextField {...params} label='Tax Number' />}
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

          {/* GL Fields */}
          {[
            { name: 'glContractAccount', label: 'General Ledger - Contracts' },
            { name: 'glJobAccount', label: 'General Ledger - Task' },
            { name: 'glContJobAccount', label: 'General Ledger - Continuous Tasks' },
            { name: 'glWarrantyAccount', label: 'General Ledger - Warranty' }
          ].map(f => (
            <Grid item xs={12} md={3} key={f.name}>
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
            { name: 'uenNumber', label: 'UEN Number' },
            { name: 'gstNumber', label: 'GST number' },
            { name: 'invoicePrefixCode', label: 'Invoice prefix' },
            { name: 'invoiceStartNumber', label: 'Invoice starting number' },
            { name: 'contractPrefixCode', label: 'Contract prefix' }
          ].map(f => (
            <Grid item xs={12} md={3} key={f.name}>
              <CustomTextField
                fullWidth
                label={f.label}
                name={f.name}
                value={formData[f.name] || ''}
                onChange={f.name === 'invoiceStartNumber' ? handleInvoiceStartNumberChange : handleChange}
              />
            </Grid>
          ))}

          {/* Bank */}
          {[
            { name: 'bankName', label: 'Bank Name' },
            { name: 'bankAccountNumber', label: 'Bank Account' },
            { name: 'bankCode', label: 'Bank Code' },
            { name: 'swiftCode', label: 'SWIFT CODE' }
          ].map(f => (
            <Grid item xs={12} md={3} key={f.name}>
              <CustomTextField
                fullWidth
                label={f.label}
                name={f.name}
                value={formData[f.name] || ''}
                onChange={handleChange}
              />
            </Grid>
          ))}

          <Grid item xs={12} md={3}>
            <AppReactDatepicker
              selected={formData.accountingDate}
              onChange={handleDateChange}
              dateFormat='dd/MM/yyyy'
              customInput={
                <CustomTextField
                  fullWidth
                  label='Accounting Date'
                  InputProps={{ startAdornment: <CalendarTodayIcon /> }}
                />
              }
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <CustomTextField
              select
              fullWidth
              label='Status'
              name='status'
              value={formData.status}
              onChange={handleChange}
            >
              <MenuItem value='Active'>Active</MenuItem>
              <MenuItem value='Inactive'>Inactive</MenuItem>
            </CustomTextField>
          </Grid>

          {/* Logo */}
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
              <Button variant='outlined' onClick={() => fileInputRef.current?.click()} fullWidth>
                {selectedFile ? selectedFile.name : previewUrl ? 'Change Logo' : 'Choose Logo'}
              </Button>
              {previewUrl && (
                <IconButton color='primary' onClick={() => setOpenDialog(true)}>
                  <VisibilityIcon />
                </IconButton>
              )}
            </Box>
          </Grid>
        </Grid>

        <Box mt={6} display='flex' justifyContent='flex-end' gap={2}>
          <Button
            variant='contained'
            color='secondary'
            onClick={() => router.push('/admin/company-origin')}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            variant='contained'
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} color='inherit' /> : null}
          >
            {saving ? 'Updating...' : 'Update Company'}
          </Button>
        </Box>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth='sm' fullWidth>
        <IconButton
          onClick={() => setOpenDialog(false)}
          sx={{ position: 'absolute', right: 8, top: 8, bgcolor: 'background.paper' }}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent sx={{ p: 0 }}>
          <img src={previewUrl} alt='Logo' style={{ width: '100%', borderRadius: 8 }} />
        </DialogContent>
      </Dialog>
    </Box>
  )
}
