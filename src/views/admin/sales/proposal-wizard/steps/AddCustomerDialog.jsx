import React, { useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, CircularProgress } from '@mui/material'
import CustomTextField from '@core/components/mui/TextField'
import { addCustomer } from '@/api/customer_group/customer/add'
import { showToast } from '@/components/common/Toasts'

const AddCustomerDialog = ({ open, onClose, onCustomerAdded }) => {
  const initialData = {
    name: '',
    serviceAddress: '',
    postalCode: '',
    email: '',
    contactPerson: '',
    contactPhone: '',
    businessName: ''
  }

  const [formData, setFormData] = useState(initialData)
  const [loading, setLoading] = useState(false)

  const handleChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async () => {
    if (!formData.name) {
      showToast('error', 'Customer Name is required')
      return
    }

    setLoading(true)
    try {
      const payload = {
        name: formData.name,
        service_address: formData.serviceAddress,
        postal_code: formData.postalCode,
        email: formData.email,
        contact_person: formData.contactPerson,
        contact_number: formData.contactPhone,
        business_name: formData.businessName,
        is_temp: 1
      }

      const response = await addCustomer(payload)

      if (response && (response.success || response.status)) {
        // Adjust based on actual API response structure
        showToast('success', 'Customer added successfully')
        // Pass the new customer object back; ensure it matches the dropdown structure
        // Assuming response.data or response contains the new customer, or we reconstruct it
        const newCustomer = response.data ||
          response.customer || {
            value: response.id || payload.name, // Fallback if ID not returned immediately, though API should return it
            label: payload.name,
            ...payload
          }

        // If the API returns the full object appropriately, use it.
        // For now, based on typical patterns, we might need to handle what the API returns.
        // Let's assume the API returns the created object or ID.

        onCustomerAdded(newCustomer)
        setFormData(initialData)
        onClose()
      } else {
        showToast('error', response?.message || 'Failed to add customer')
      }
    } catch (error) {
      console.error('Error adding customer:', error)
      showToast('error', 'An error occurred while adding the customer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle>Add New Customer</DialogTitle>
      <DialogContent>
        <Grid container spacing={4} sx={{ mt: 0 }}>
          <Grid item xs={12} md={6}>
            <CustomTextField
              fullWidth
              label='Customer Name *'
              name='name'
              value={formData.name}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <CustomTextField
              fullWidth
              label='Business Name'
              name='businessName'
              value={formData.businessName}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <CustomTextField
              fullWidth
              label='Service Address'
              name='serviceAddress'
              value={formData.serviceAddress}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <CustomTextField
              fullWidth
              label='Postal Code'
              name='postalCode'
              value={formData.postalCode}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <CustomTextField fullWidth label='Email' name='email' value={formData.email} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} md={6}>
            <CustomTextField
              fullWidth
              label='Contact Person Name'
              name='contactPerson'
              value={formData.contactPerson}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <CustomTextField
              fullWidth
              label='Contact Person Phone'
              name='contactPhone'
              value={formData.contactPhone}
              onChange={handleChange}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color='secondary' disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant='contained' disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddCustomerDialog
