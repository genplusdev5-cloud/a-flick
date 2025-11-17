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

import { getCompanyDetails, updateCompany } from '@/api/company'
import { useParams, useRouter } from 'next/navigation'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// --------------------------------------------

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

// --------------------------------------------

export default function CompanyOriginEditPage() {
  const fileInputRef = useRef(null)
  const { id } = useParams()
  const router = useRouter()

  const [formData, setFormData] = useState(initialCompanyFormData)
  const [selectedFile, setSelectedFile] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [taxNumberOpen, setTaxNumberOpen] = useState(false)

  const taxNumberOptions = ['TN-001', 'TN-002', 'TN-003', 'Others']

  // --------------------------------------------
  // FETCH COMPANY DETAILS
  // --------------------------------------------

  useEffect(() => {
    loadCompany()
  }, [id])

  const loadCompany = async () => {
    if (!id) return

    try {
      setLoading(true)

      const details = await getCompanyDetails(id)

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
    } catch (error) {
      console.error('❌ Failed to load company details: ', error)
    } finally {
      setLoading(false)
    }
  }

  // --------------------------------------------
  // HANDLERS (same as Add page)
  // --------------------------------------------

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
    const value = e.target.value.replace(/[^a-zA-Z ]/g, '')
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

    const fileURL = URL.createObjectURL(file)
    setSelectedFile(file.name)
    setFormData(prev => ({
      ...prev,
      uploadedFileName: file.name,
      uploadedFileURL: fileURL
    }))
  }

  // --------------------------------------------
  // SAVE DATA
  // --------------------------------------------

  const handleSave = async () => {
    try {
      setLoading(true)

      const payload = {
        ...formData,
        accountingDate: formData.accountingDate
          ? formData.accountingDate.toISOString()
          : null
      }

      await updateCompany(id, payload)

      alert('Company Updated Successfully!')
    } catch (error) {
      console.error('❌ Error updating:', error)
      alert('Failed to update')
    } finally {
      setLoading(false)
    }
  }

  // --------------------------------------------
  // REFRESH
  // --------------------------------------------

  const handleRefresh = () => loadCompany()

  // --------------------------------------------
  // UI SECTION
  // --------------------------------------------

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

          <Typography component='a' href='/admin/company-origin' sx={{ textDecoration: 'none', color: 'primary.main' }}>
            Company Origin
          </Typography>

          <Typography color='text.primary'>Edit</Typography>
        </Breadcrumbs>
      </Box>

      {/* Card */}
      <Card sx={{ p: 3 }}>
        {/* Header */}
        <Box display='flex' alignItems='center' gap={2} mb={3}>
          <Typography variant='h5' sx={{ fontWeight: 600 }}>
            Edit Company Origin
          </Typography>

          <Button
            variant='contained'
            color='primary'
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            sx={{ textTransform: 'none', height: 36 }}
          >
            Refresh
          </Button>
        </Box>

        {/* Form */}
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
              />
            </Grid>
          ))}

          {/* TAX NUMBER AUTOCOMPLETE */}
          <Grid item xs={12} md={3}>
            <Autocomplete
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
                value={formData[f.name]}
                onChange={f.name === 'invoiceStartNumber' ? handleInvoiceStartNumberChange : handleChange}
              />
            </Grid>
          ))}

          {/* BANK SECTION */}
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

              <Button variant='outlined' onClick={() => fileInputRef.current?.click()} fullWidth sx={{ py: 1.5 }}>
                {selectedFile || 'Upload File'}
              </Button>

              {selectedFile && (
                <IconButton color='primary' onClick={() => setOpenDialog(true)}>
                  <VisibilityIcon />
                </IconButton>
              )}
            </Box>
          </Grid>

          {/* SAVE + CANCEL */}
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
            <Button variant='outlined' onClick={loadCompany}>
              Reset
            </Button>

            <Button variant='contained' color='primary' onClick={handleSave}>
              Update
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* LOGO PREVIEW */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth='sm'>
        <DialogContent>
          <img src={formData.uploadedFileURL} style={{ width: '100%' }} alt='Company Logo' />
        </DialogContent>
      </Dialog>
    </Box>
  )
}
