'use client'

import { useState, useEffect, useRef } from 'react'
import { Grid, Card, Button, MenuItem, Box, Typography, InputAdornment } from '@mui/material'
import { useRouter, useSearchParams } from 'next/navigation'
import { openDB } from 'idb'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'

import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import { Autocomplete } from '@mui/material'

const getCompanyDB = async () => {
  return openDB('companyDB', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('companies')) {
        db.createObjectStore('companies', { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

const initialCompanyFormData = {
  prefixCode: '',
  name: '',
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
  uploadedFileName: ''
}

export default function EditCompanyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileInputRef = useRef(null)

  const dbId = searchParams.get('dbId')
  const [emailError, setEmailError] = useState(false)

  const [formData, setFormData] = useState(initialCompanyFormData)
  const [editCompanyId, setEditCompanyId] = useState(null)
  const [selectedFile, setSelectedFile] = useState('')

  const taxNumberRef = useRef(null)
  const [taxNumberOpen, setTaxNumberOpen] = useState(false)
  const taxNumberOptions = ['TN-001', 'TN-002', 'TN-003', 'Others']

  const pageTitle = 'Edit Company'

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
            uploadedFileName: existing.uploadedFileName || ''
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
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleDateChange = date => {
    setFormData(prev => ({ ...prev, accountingDate: date }))
  }

  const handleFileChange = e => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file.name)
      setFormData(prev => ({ ...prev, uploadedFileName: file.name }))
    }
  }

  const handleFileDrop = e => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      setSelectedFile(file.name)
      setFormData(prev => ({ ...prev, uploadedFileName: file.name }))
    }
  }

  const handleSave = async () => {
    const db = await getCompanyDB()
    await db.put('companies', {
      ...formData,
      id: editCompanyId,
      updatedAt: new Date().toISOString()
    })
    router.push('/admin/company-origin')
  }

  return (
    <ContentLayout
      title={pageTitle}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Company Origin', href: '/admin/company-origin' },
        { label: pageTitle }
      ]}
    >
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Card sx={{ p: 4, boxShadow: 'none' }} elevation={0}>
            <Grid container spacing={6}>
              <Grid item xs={12} md={3}>
                <CustomTextField
                  fullWidth
                  label='Prefix'
                  name='prefixCode'
                  value={formData.prefixCode}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <CustomTextField
                  fullWidth
                  label='Name'
                  name='name'
                  value={formData.name}
                  onChange={handleChange}
                  onInput={e => {
                    e.target.value = e.target.value.replace(/[^a-zA-Z ]/g, '') // allow only letters and space
                  }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <CustomTextField
                  fullWidth
                  label='Phone'
                  name='phone'
                  value={formData.phone}
                  onChange={e => {
                    // Remove non-digit characters
                    let value = e.target.value.replace(/\D/g, '')

                    // Limit to 10 digits
                    if (value.length > 10) value = value.slice(0, 10)

                    // Add a space after 5 digits
                    if (value.length > 5) {
                      value = value.slice(0, 5) + ' ' + value.slice(5)
                    }

                    handleChange({
                      target: {
                        name: 'phone',
                        value: value
                      }
                    })
                  }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <CustomTextField
                  fullWidth
                  label='Email'
                  name='email'
                  value={formData.email}
                  onChange={e => {
                    handleChange(e) // Update state
                  }}
                  // Check email validity
                  error={formData.email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)}
                  helperText={
                    formData.email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
                      ? 'Enter a valid email'
                      : ''
                  }
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <Autocomplete
                  ref={taxNumberRef}
                  freeSolo={false}
                  options={taxNumberOptions}
                  value={formData.taxNumber}
                  open={taxNumberOpen}
                  onOpen={() => setTaxNumberOpen(true)}
                  onClose={() => setTaxNumberOpen(false)}
                  onFocus={() => setTaxNumberOpen(true)}
                  onInputChange={(e, newValue, reason) => {
                    if (reason === 'input' && !taxNumberOptions.includes(newValue)) return
                    setFormData(prev => ({ ...prev, taxNumber: newValue }))
                  }}
                  onChange={(e, newValue) => setFormData(prev => ({ ...prev, taxNumber: newValue }))}
                  noOptionsText='No options'
                  renderInput={params => (
                    <CustomTextField
                      label='Tax Number'
                      {...params}
                      inputProps={{
                        ...params.inputProps,
                        onKeyDown: e => {
                          if (e.key === 'Enter' && taxNumberOptions.includes(formData.taxNumber)) {
                            e.preventDefault()
                          } else if (e.key === 'Enter') e.preventDefault()
                        }
                      }}
                    />
                  )}
                />
              </Grid>

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
  <CustomTextField
    fullWidth
    label="City"
    name="city"
    value={formData.city}
    onChange={(e) => {
      // Remove any non-letter characters
      const value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
      handleChange({ target: { name: 'city', value } });
    }}
  />
</Grid>


              <Grid item xs={12} md={3}>
                <CustomTextField
                  fullWidth
                  label='GL-Contract'
                  name='glContractAccount'
                  value={formData.glContractAccount}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <CustomTextField
                  fullWidth
                  label='GL-Job'
                  name='glJobAccount'
                  value={formData.glJobAccount}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <CustomTextField
                  fullWidth
                  label='GL-Cont.Job'
                  name='glContJobAccount'
                  value={formData.glContJobAccount}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <CustomTextField
                  fullWidth
                  label='GL-Warranty'
                  name='glWarrantyAccount'
                  value={formData.glWarrantyAccount}
                  onChange={handleChange}
                />
              </Grid>
<Grid item xs={12} md={3}>
  <CustomTextField
    fullWidth
    label='UEN Number'
    name='uenNumber'
    value={formData.uenNumber}
    onChange={(e) => {
      let value = e.target.value.replace(/\D/g, ''); // remove non-numbers
      setFormData({ ...formData, uenNumber: value });
    }}
  />
</Grid>

<Grid item xs={12} md={3}>
  <CustomTextField
    fullWidth
    label='GST Reg. Number'
    name='gstNumber'
    value={formData.gstNumber}
    onChange={(e) => {
      let value = e.target.value.replace(/\D/g, ''); // remove non-numbers
      setFormData({ ...formData, gstNumber: value });
    }}
  />
</Grid>

              <Grid item xs={12} md={3}>
                <CustomTextField
                  fullWidth
                  label='Invoice Prefix'
                  name='invoicePrefixCode'
                  value={formData.invoicePrefixCode}
                  onChange={handleChange}
                />
              </Grid>
          <Grid item xs={12} md={3}>
  <CustomTextField
    fullWidth
    label='Invoice Start No.'
    name='invoiceStartNumber'
    value={formData.invoiceStartNumber}
    onChange={(e) => {
      let value = e.target.value.replace(/\D/g, ''); // remove non-numbers
      setFormData({ ...formData, invoiceStartNumber: value });
    }}
  />
</Grid>

              <Grid item xs={12} md={3}>
                <CustomTextField
                  fullWidth
                  label='Contract Prefix'
                  name='contractPrefixCode'
                  value={formData.contractPrefixCode}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>

            <Grid container spacing={6} sx={{ mt: 4 }}>
              <Grid item xs={12} md={3}>
                <CustomTextField
                  fullWidth
                  label='Bank Name'
                  name='bankName'
                  value={formData.bankName}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <CustomTextField
                  fullWidth
                  label='Bank Account Number'
                  name='bankAccountNumber'
                  value={formData.bankAccountNumber}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <CustomTextField
                  fullWidth
                  label='Bank Code'
                  name='bankCode'
                  value={formData.bankCode}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <CustomTextField
                  fullWidth
                  label='Swift Code'
                  name='swiftCode'
                  value={formData.swiftCode}
                  onChange={handleChange}
                />
              </Grid>

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

              <Grid item xs={12} md={3}>
                <Typography sx={{ mb: 1, fontSize: '0.8rem', fontWeight: 500 }}>Logo</Typography>
                <Box>
                  <input type='file' ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
                  <Button
                    variant='outlined'
                    fullWidth
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleFileDrop}
                    sx={{ borderColor: 'black', borderStyle: 'solid', borderWidth: 1, py: 1.5 }}
                  >
                    <Typography sx={{ color: selectedFile ? 'text.primary' : 'text.disabled' }}>
                      {selectedFile || 'Upload File / Drag & Drop'}
                    </Typography>
                  </Button>
                </Box>
              </Grid>

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
    </ContentLayout>
  )
}
