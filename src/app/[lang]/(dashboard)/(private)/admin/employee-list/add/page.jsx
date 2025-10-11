'use client'

import { useState, useEffect } from 'react'
import { Grid, Card, Button, Box } from '@mui/material'
import { useRouter, useSearchParams } from 'next/navigation'
import { openDB } from 'idb'

import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'

// ✅ IndexedDB helper
async function getCustomerDB() {
  return openDB('mainCustomerDB', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('customers')) {
        db.createObjectStore('customers', { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

const initialFormData = {
  name: '',
  phone: '',
  email: '',
  password: '',
  address1: '',
  address2: '',
  pincode: '',
  city: '',
  state: ''
}

export default function AddCustomerPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const customerId = searchParams.get('id')

  const [formData, setFormData] = useState(initialFormData)
  const [editCustomerId, setEditCustomerId] = useState(null)
  const [emailError, setEmailError] = useState(false)

  const isEditMode = editCustomerId !== null
  const pageTitle = isEditMode ? 'Edit Customer' : 'Add Customer'

  // ✅ Load data in edit mode
  useEffect(() => {
    ;(async () => {
      if (!customerId) return
      try {
        const db = await getCustomerDB()
        const existing = await db.get('customers', Number(customerId))
        if (existing) {
          setFormData({
            name: existing.name || '',
            phone: existing.phone || '',
            email: existing.email || '',
            password: existing.password || '',
            address1: existing.address1 || '',
            address2: existing.address2 || '',
            pincode: existing.pincode || '',
            city: existing.city || '',
            state: existing.state || ''
          })
          setEditCustomerId(existing.id)
        }
      } catch (err) {
        console.error('Failed to load customer:', err)
      }
    })()
  }, [customerId])

  // ✅ Handle form field changes
  const handleChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePhoneChange = e => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 10) value = value.slice(0, 10)
    if (value.length > 5) value = value.slice(0, 5) + ' ' + value.slice(5)
    setFormData(prev => ({ ...prev, phone: value }))
  }

  // ✅ Save / Update
  const handleSave = async () => {
    if (!formData.name || !formData.email || !formData.phone) {
      alert('Please fill all required fields: Name, Email, Phone.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setEmailError(true)
      return
    } else {
      setEmailError(false)
    }

    const db = await getCustomerDB()
    const record = {
      ...formData,
      status: 'Active',
      updatedAt: new Date().toISOString()
    }

    if (isEditMode) record.id = editCustomerId

    await db.put('customers', record)
    alert(isEditMode ? 'Customer updated successfully!' : 'Customer added successfully!')
    router.push('/admin/customers')
  }

  return (
    <ContentLayout
      title={pageTitle}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Customer', href: '/admin/customers' },
        { label: pageTitle }
      ]}
    >
      <Grid container spacing={2}>
        <Grid item xs={12} md={12}>
          <Card sx={{ p: 4, boxShadow: 'none' }} elevation={0}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <CustomTextField
                  fullWidth
                  label='Name'
                  name='name'
                  value={formData.name}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <CustomTextField
                  fullWidth
                  label='Phone'
                  name='phone'
                  value={formData.phone}
                  onChange={handlePhoneChange}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <CustomTextField
                  fullWidth
                  label='Email'
                  name='email'
                  value={formData.email}
                  onChange={e => {
                    const value = e.target.value
                    setFormData(prev => ({ ...prev, email: value }))
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                    setEmailError(value && !emailRegex.test(value))
                  }}
                  error={emailError}
                  helperText={emailError ? 'Enter a valid email address' : ''}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <CustomTextField
                  fullWidth
                  type='password'
                  label='Password'
                  name='password'
                  value={formData.password}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <CustomTextField
                  fullWidth
                  multiline
                  rows={2}
                  label='Address 1'
                  name='address1'
                  value={formData.address1}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <CustomTextField
                  fullWidth
                  multiline
                  rows={2}
                  label='Address 2'
                  name='address2'
                  value={formData.address2}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <CustomTextField
                  fullWidth
                  label='Pincode'
                  name='pincode'
                  value={formData.pincode}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <CustomTextField
                  fullWidth
                  label='City'
                  name='city'
                  value={formData.city}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <CustomTextField
                  fullWidth
                  label='State'
                  name='state'
                  value={formData.state}
                  onChange={handleChange}
                />
              </Grid>

              {/* Buttons */}
              <Grid item xs={12} sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
                <Button variant='outlined' onClick={() => router.push('/admin/customers')}>
                  Cancel
                </Button>
                <Button variant='contained' onClick={handleSave}>
                  {isEditMode ? 'Update' : 'Save'}
                </Button>
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>
    </ContentLayout>
  )
}
