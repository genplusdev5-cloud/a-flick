import { Grid, Typography, Button, Box } from '@mui/material'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import CustomTextField from '@core/components/mui/TextField'

const Step3ServiceDetails = ({
  formData,
  handleChange,
  handleAutocompleteChange,
  handleNativeFileChange,
  handleViewFile,
  dropdowns,
  handleKeyDown,
  refs
}) => {
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
          options={dropdowns?.billingFrequencies || []}
          value={formData.billingFrequencyId}
          onChange={v => handleAutocompleteChange('billingFrequency', v, refs.billingFrequencyRef)}
          inputRef={refs.billingFrequencyRef}
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
          onChange={v =>
            handleChange({
              target: { name: 'invoiceRemarks', value: v }
            })
          }
          renderInput={params => <CustomTextField {...params} label='Invoice Remarks' />}
        />
      </Grid>

      {/* Upload Floor Plan */}
      <Grid item xs={12} md={6}>
        <Typography variant='subtitle2' sx={{ mb: 1 }}>
          Upload Floor Plan
        </Typography>

        <Box display='flex' gap={2} alignItems='center'>
          <Button variant='contained' component='label' ref={refs?.fileUploadButtonRef}>
            Upload File
            <input type='file' hidden onChange={handleNativeFileChange} />
          </Button>

          {formData.uploadedFileName ? (
            <Box display='flex' alignItems='center' gap={1}>
              <Typography variant='body2'>{formData.uploadedFileName}</Typography>
              <Button size='small' onClick={handleViewFile}>
                View
              </Button>
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
          inputRef={refs.reportBlockRef}
          onKeyDown={e => handleKeyDown(e, refs.reportBlockRef)}
        />
      </Grid>

      {/* Technician */}
      <Grid item xs={12} md={6}>
        <GlobalAutocomplete
          label='Technician'
          options={dropdowns?.technicians || []}
          value={formData.technicianId}
          onChange={v => handleAutocompleteChange('technician', v, refs.technicianRef)}
          inputRef={refs.technicianRef}
        />
      </Grid>

      {/* Supervisor */}
      <Grid item xs={12} md={6}>
        <GlobalAutocomplete
          label='Supervisor'
          options={dropdowns?.supervisors || []}
          value={formData.supervisorId}
          onChange={v => handleAutocompleteChange('supervisor', v, refs.supervisorRef)}
          inputRef={refs.supervisorRef}
        />
      </Grid>
    </Grid>
  )
}

export default Step3ServiceDetails
