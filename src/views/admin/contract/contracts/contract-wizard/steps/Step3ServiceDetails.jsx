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

  const requiredFieldSx = {
    '& .MuiFormLabel-asterisk': {
      display: 'none'
    }
  }

  const renderLabel = (label, required = false) => (
    <Box component='span' sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {label}
      {required && (
        <Typography component='span' sx={{ color: '#e91e63', fontWeight: 700, fontSize: '0.75rem', mt: -0.5 }}>
          *
        </Typography>
      )}
    </Box>
  )

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
          label={renderLabel('Billing Frequency', true)}
          options={dropdowns?.billingFrequencies || []}
          value={formData.billingFrequencyId}
          onChange={v => handleAutocompleteChange('billingFrequency', v, refs.billingFrequencyRef)}
          inputRef={refs.billingFrequencyRef}
          required
          sx={requiredFieldSx}
        />
      </Grid>

      {/* No. of Invoice (Auto calculated) */}
      <Grid item xs={12} md={4}>
        <CustomTextField
          fullWidth
          label={renderLabel('No. of Invoice')}
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
          renderInput={params => <CustomTextField {...params} label={renderLabel('Invoice Remarks')} />}
        />
      </Grid>

      {/* Upload Floor Plan */}
      <Grid item xs={12} md={6}>
        <Typography variant='subtitle2' sx={{ mb: 1 }}>
          {renderLabel('Upload Floor Plan')}
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
        <GlobalAutocomplete
          label='Report Block'
          multiple
          freeSolo
          options={dropdowns.reportBlocks || []}
          value={Array.isArray(formData.reportBlock) ? formData.reportBlock : []}
          onChange={v =>
            handleChange({
              target: { name: 'reportBlock', value: v }
            })
          }
          renderInput={params => <CustomTextField {...params} label={renderLabel('Report Block')} />}
        />
      </Grid>

      {/* Technician */}
      <Grid item xs={12} md={6}>
        <GlobalAutocomplete
          label={renderLabel('Technician')}
          options={dropdowns.technicians || []}
          value={formData.technicianId}
          onChange={v => handleAutocompleteChange('technician', v, refs.technicianRef)}
          inputRef={refs.technicianRef}
        />
      </Grid>

      {/* Supervisor */}
      <Grid item xs={12} md={6}>
        <GlobalAutocomplete
          label={renderLabel('Supervisor')}
          options={dropdowns.supervisors || []}
          value={formData.supervisorId}
          onChange={v => handleAutocompleteChange('supervisor', v, refs.supervisorRef)}
          inputRef={refs.supervisorRef}
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
