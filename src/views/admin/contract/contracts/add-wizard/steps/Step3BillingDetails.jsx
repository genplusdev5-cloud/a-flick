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
          renderInput={params => <CustomTextField {...params} label='Invoice Remarks' />}
        />
      </Grid>

       {/* Upload Floor Plan */}
      <Grid item xs={12} md={6}>
        <Typography variant='subtitle2' sx={{ mb: 1 }}>
          Upload Floor Plan
        </Typography>

        <Box display='flex' gap={2} alignItems='center'>
          <Button variant='contained' component='label' ref={fileUploadButtonRef}>
            Upload File
            <input type='file' hidden onChange={handleNativeFileChange} />
          </Button>

          {formData.uploadedFileName ? (
            <Box display='flex' alignItems='center' gap={1}>
              <Typography variant='body2'>{formData.uploadedFileName}</Typography>
               {/* View button omitted for simplicity unless user asks for preview logic explicitly again */}
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
        />
      </Grid>

    </Grid>
  )
}

export default Step3BillingDetails
