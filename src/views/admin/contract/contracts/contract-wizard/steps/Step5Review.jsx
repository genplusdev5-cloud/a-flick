import { Grid, Typography } from '@mui/material'
import CustomTextField from '@core/components/mui/TextField'

const Step5Review = ({ formData, handleChange }) => {
  return (
    <Grid container spacing={4}>
      <Grid item xs={12}>
        <Typography variant='h6'>Review & Remarks</Typography>
      </Grid>

      <Grid item xs={12}>
        <CustomTextField
          fullWidth
          multiline
          minRows={2}
          label='Billing Remarks'
          name='billingRemarks'
          value={formData.billingRemarks || ''}
          onChange={handleChange}
        />
      </Grid>

      <Grid item xs={12}>
        <CustomTextField
          fullWidth
          multiline
          minRows={2}
          label='Technician Remarks'
          name='technicianRemarks'
          value={formData.technicianRemarks || ''}
          onChange={handleChange}
        />
      </Grid>

      <Grid item xs={12}>
        <CustomTextField
          fullWidth
          multiline
          minRows={2}
          label='Appointment Remarks'
          name='appointmentRemarks'
          value={formData.appointmentRemarks || ''}
          onChange={handleChange}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <CustomTextField
          fullWidth
          multiline
          minRows={2}
          label='Agreement Add. 1'
          name='agreement1'
          value={formData.agreement1 || ''}
          onChange={handleChange}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <CustomTextField
          fullWidth
          multiline
          minRows={2}
          label='Agreement Add. 2'
          name='agreement2'
          value={formData.agreement2 || ''}
          onChange={handleChange}
        />
      </Grid>
    </Grid>
  )
}

export default Step5Review
