import { Grid, Typography, Button, Box, Divider } from '@mui/material'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import CustomTextField from '@core/components/mui/TextField'
import { useState } from 'react'
import UpdateContractValueDialog from './UpdateContractValueDialog'

const Step3ServiceDetails = ({
  formData,
  handleChange,
  handleAutocompleteChange,
  handleNativeFileChange,
  handleViewFile,
  dropdowns,
  handleKeyDown,
  refs,
  pestItems // ✅ Received from parent
}) => {
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false)

  // Calculate total from pest items
  const calculatedTotal = (pestItems || []).reduce((acc, curr) => acc + (Number(curr.totalValue) || 0), 0)

  // Use manual value if set, otherwise calculated
  // If formData.contractValue is 0 or empty, we might want to default to calculatedTotal?
  // But if user explicitly sets 0, we should respect it.
  // Let's assume calculatedTotal is the baseline.
  const displayValue = formData.contractValue ? formData.contractValue : calculatedTotal

  const handleUpdateValue = val => {
    handleChange({
      target: { name: 'contractValue', value: val }
    })
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

      <Divider />

      {/* Contract Value Display (Bottom) */}
      <Grid item xs={12} display='flex' justifyContent='flex-start' alignItems='center' sx={{ mt: 38 }}>
        <Box
          display='flex'
          alignItems='center'
          gap={1}
          sx={{ cursor: 'pointer', p: 1, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
          onClick={() => setOpenUpdateDialog(true)}
        >
          <Typography variant='subtitle1' color='textSecondary'>
            Total Contract Value ($)
          </Typography>
          <Typography variant='h6' color='primary.main' sx={{ textDecoration: 'underline' }}>
            {displayValue}
          </Typography>
        </Box>
      </Grid>

      <UpdateContractValueDialog
        open={openUpdateDialog}
        onClose={() => setOpenUpdateDialog(false)}
        currentValue={displayValue}
        onSave={handleUpdateValue}
      />
    </Grid>
  )
}

export default Step3ServiceDetails
