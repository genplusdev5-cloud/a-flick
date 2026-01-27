'use client'

import React from 'react'
import { Grid, Typography } from '@mui/material'
import CustomTextField from '@core/components/mui/TextField'

const Step5Review = ({ formData, setFormData }) => {
  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const requiredFieldSx = {
    '& .MuiFormLabel-asterisk': {
      color: '#e91e63 !important',
      fontWeight: 700
    },
    '& .MuiInputLabel-root.Mui-required': {
      color: 'inherit'
    }
  }

  const renderTF = (name, label, md = 12) => (
    <Grid item xs={12} md={md}>
      <CustomTextField
        fullWidth
        multiline
        minRows={2}
        label={label}
        name={name}
        value={formData[name]}
        onChange={handleChange}
        required
        sx={requiredFieldSx}
      />
    </Grid>
  )

  return (
    <Grid container spacing={4}>
      <Grid item xs={12}>
        <Typography variant='h6'>Review & Remarks</Typography>
      </Grid>

      {renderTF('billingRemarks', 'Billing Remarks')}
      {renderTF('technicianRemarks', 'Technician Remarks')}
      {renderTF('appointmentRemarks', 'Appointment Remarks')}
      {renderTF('agreement1', 'Agreement Add. 1', 6)}
      {renderTF('agreement2', 'Agreement Add. 2', 6)}
    </Grid>
  )
}

export default Step5Review
