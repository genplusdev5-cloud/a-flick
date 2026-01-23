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
          value={formData.billingFrequency}
          onChange={(e, v) => handleAutocompleteChange('billingFrequency', v)}
        />
      </Grid>

      {/* No. of Invoice - Read Only usually linked to Frequency */}
      <Grid item xs={12} md={4}>
        <CustomTextField
          fullWidth
          label='No. of Invoice'
          name='invoiceCount'
          value={formData.invoiceCount}
          onChange={handleChange}
          InputProps={{ readOnly: true }}
        />
      </Grid>

      {/* Invoice Remarks */}
      <Grid item xs={12} md={4}>
        <GlobalAutocomplete
          label='Invoice Remarks'
          multiple
          freeSolo
          options={[]} // You might want to fetch dynamic remarks
          value={Array.isArray(formData.invoiceRemarks) ? formData.invoiceRemarks : []}
          onChange={(e, v) => handleChange({ target: { name: 'invoiceRemarks', value: v } })} // Simple adapter if handleChange supports it, or use specific setter
          renderInput={params => <CustomTextField {...params} label='Invoice Remarks' />}
        />
      </Grid>

      {/* File Upload - "Upload Floor Plan" */}
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
        />
      </Grid>
    </Grid>
  )
}

export default Step3ServiceDetails
