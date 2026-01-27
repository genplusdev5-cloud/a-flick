'use client'

import React from 'react'
import { Grid, Typography, Button, Box } from '@mui/material'
import CustomTextField from '@core/components/mui/TextField'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'

const Step3BillingDetails = ({
  formData,
  setFormData,
  dropdowns,
  refs,
  handleAutocompleteChange,
  handleKeyDown,
  handleNativeFileChange = () => {}, // Handled in index
  handleViewFile = () => {}, // Handled in index
  fileUploadButtonRef // Passed from Index
}) => {
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

  return (
    <Grid container spacing={4}>
      <Grid item xs={12}>
        <Typography variant='h6' sx={{ mb: 2 }}>
          Billing & Reporting
        </Typography>
      </Grid>

      {/* Billing Frequency */}
      <Grid item xs={12} md={4}>
        <GlobalAutocomplete
          label='Billing Frequency'
          options={dropdowns.billingFrequencies || []}
          value={formData.billingFrequencyId}
          onChange={(v) => handleAutocompleteChange('billingFrequency', v, refs.billingFrequencyInputRef)}
          inputRef={refs.billingFrequencyInputRef}
          required
          sx={requiredFieldSx}
        />
      </Grid>

      {/* No. of Invoice (Auto calculated) */}
      <Grid item xs={12} md={4}>
        <CustomTextField
          fullWidth
          label='No. of Invoice'
          name='invoiceCount'
          value={formData.invoiceCount}
          InputProps={{ readOnly: true }}
          required
          sx={requiredFieldSx}
        />
      </Grid>

      {/* Invoice Remarks */}
      <Grid item xs={12} md={4}>
         <GlobalAutocomplete
          label='Invoice Remarks'
          multiple
          freeSolo
          options={formData.invoiceRemarksOptions || []}
          value={Array.isArray(formData.invoiceRemarks) ? formData.invoiceRemarks : []}
          onChange={v => setFormData(prev => ({ ...prev, invoiceRemarks: v }))}
          renderInput={params => <CustomTextField {...params} label='Invoice Remarks' required sx={requiredFieldSx} />}
        />
      </Grid>

       {/* Upload Floor Plan */}
      <Grid item xs={12} md={6}>
        <Typography variant='subtitle2' sx={{ mb: 1 }}>
          Upload Floor Plan <span style={{ color: '#e91e63', fontWeight: 700 }}>*</span>
        </Typography>

        <Box display='flex' gap={2} alignItems='center'>
          <Button variant='contained' component='label' ref={fileUploadButtonRef}>
            Upload File
            <input type='file' hidden onChange={handleNativeFileChange} />
          </Button>

          {formData.uploadedFileName ? (
            <Box display='flex' alignItems='center' gap={1}>
              <Typography variant='body2'>{formData.uploadedFileName}</Typography>
            </Box>
          ) : (
            <Typography variant='body2' color='textSecondary'>
              No file chosen
            </Typography>
          )}
        </Box>
      </Grid>

      {/* Report Block */}
      <Grid item xs={12} md={6}>
        <CustomTextField
          fullWidth
          label='Report Block'
          name='reportBlock'
          value={formData.reportBlock}
          onChange={handleChange}
          inputRef={refs.reportBlockRef} // Ensure Ref
          onKeyDown={e => handleKeyDown(e, refs.reportBlockRef)}
          required
          sx={requiredFieldSx}
        />
      </Grid>

       {/* Technician */}
      <Grid item xs={12} md={6}>
        <GlobalAutocomplete
          label='Technician'
          options={dropdowns.technicians || []}
          value={formData.technicianId}
          onChange={v => handleAutocompleteChange('technician', v, refs.technicianInputRef)}
          inputRef={refs.technicianInputRef}
          required
          sx={requiredFieldSx}
        />
      </Grid>

      {/* Supervisor */}
      <Grid item xs={12} md={6}>
        <GlobalAutocomplete
          label='Supervisor'
          options={dropdowns.supervisors || []}
          value={formData.supervisorId}
          onChange={v => handleAutocompleteChange('supervisor', v, refs.supervisorInputRef)}
          inputRef={refs.supervisorInputRef}
          required
          sx={requiredFieldSx}
        />
      </Grid>

    </Grid>
  )
}

export default Step3BillingDetails
