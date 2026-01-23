import { Grid, Typography, Divider } from '@mui/material'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import CustomTextField from '@core/components/mui/TextField'

const Step1DealType = ({
  formData,
  handleChange,
  handleAutocompleteChange,
  handleKeyDown,
  dropdowns, // Ensure dropdowns are passed
  refs
}) => {
  return (
    <Grid container spacing={4}>
      <Grid item xs={12}>
        <Typography variant='h6' sx={{ mb: 2 }}>
          Deal Type & Contact Information
        </Typography>
      </Grid>

      {/* --- ROW 1 --- */}
      {/* Origin */}
      <Grid item xs={12} md={4}>
        <GlobalAutocomplete
          label='Origin'
          options={['Sales', 'Enquiry']} // Example options, or pass from dropdowns
          value={formData.origin}
          onChange={(e, v) => handleAutocompleteChange('origin', v)}
        />
      </Grid>

      {/* Customer (Moved from Step 2) */}
      <Grid item xs={12} md={4}>
        <GlobalAutocomplete
          label='Customer'
          options={dropdowns?.customers || []}
          value={formData.customer}
          onChange={(e, v) => handleAutocompleteChange('customer', v)}
        />
      </Grid>

      {/* Contract Type */}
      <Grid item xs={12} md={4}>
        <GlobalAutocomplete
          label='Contract Type'
          options={['Continuous Contract', 'Limited Contract', 'Continuous Job', 'Job', 'Warranty']}
          value={formData.contractType}
          onChange={(e, v) => handleAutocompleteChange('contractType', v)}
        />
      </Grid>

      {/* --- ROW 2 --- */}
      {/* Proposal Status */}
      <Grid item xs={12} md={4}>
        <GlobalAutocomplete
          label='Proposal Status'
          options={['Draft', 'Sent', 'Approved', 'Rejected']}
          value={formData.proposalStatus}
          onChange={(e, v) => handleAutocompleteChange('proposalStatus', v)}
        />
      </Grid>

      {/* Business Name */}
      <Grid item xs={12} md={4}>
        <CustomTextField
          fullWidth
          label='Business Name'
          name='businessName'
          value={formData.businessName}
          onChange={handleChange}
        />
      </Grid>

      {/* BG Testing */}
      <Grid item xs={12} md={4}>
        <GlobalAutocomplete
          label='BG Testing'
          options={['Yes', 'No']}
          value={formData.bgTesting}
          onChange={(e, v) => handleAutocompleteChange('bgTesting', v)}
        />
      </Grid>

      {/* --- ROW 3: Billing Info --- */}
      <Grid item xs={12}>
        <Divider sx={{ my: 1 }}> Billing Details </Divider>
      </Grid>

      <Grid item xs={12} md={4}>
        <CustomTextField
          fullWidth
          label='Billing Name'
          name='billingName'
          value={formData.billingName}
          onChange={handleChange}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <CustomTextField
          fullWidth
          label='Billing Address'
          name='billingAddress'
          value={formData.billingAddress}
          onChange={handleChange}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <CustomTextField
          fullWidth
          label='Billing Postal Code'
          name='billingPostalCode'
          value={formData.billingPostalCode}
          onChange={handleChange}
        />
      </Grid>

      {/* --- ROW 4: Codes --- */}
      <Grid item xs={12} md={4}>
        <CustomTextField
          fullWidth
          label='Cust. Code'
          name='customerCode'
          value={formData.customerCode}
          onChange={handleChange}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <CustomTextField
          fullWidth
          label='Group Code'
          name='groupCode'
          value={formData.groupCode}
          onChange={handleChange}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <CustomTextField fullWidth label='Acc. Code' name='accCode' value={formData.accCode} onChange={handleChange} />
      </Grid>

      {/* --- ROW 5: PIC Contact --- */}
      <Grid item xs={12}>
        <Divider sx={{ my: 1 }}> PIC Contact Details </Divider>
      </Grid>

      <Grid item xs={12} md={4}>
        <CustomTextField
          fullWidth
          label='PIC Contact Name'
          name='picContactName'
          value={formData.picContactName}
          onChange={handleChange}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <CustomTextField
          fullWidth
          label='PIC Email'
          name='picEmail'
          value={formData.picEmail}
          onChange={handleChange}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <CustomTextField
          fullWidth
          label='PIC Phone'
          name='picPhone'
          value={formData.picPhone}
          onChange={handleChange}
        />
      </Grid>

      {/* --- ROW 6: Billing Contact --- */}
      <Grid item xs={12}>
        <Divider sx={{ my: 1 }}> Billing Contact Details </Divider>
      </Grid>

      <Grid item xs={12} md={4}>
        <CustomTextField
          fullWidth
          label='Billing Contact Name'
          name='billingContactName'
          value={formData.billingContactName}
          onChange={handleChange}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <CustomTextField
          fullWidth
          label='Billing Email'
          name='billingEmail'
          value={formData.billingEmail}
          onChange={handleChange}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <CustomTextField
          fullWidth
          label='Billing Phone'
          name='billingPhone'
          value={formData.billingPhone}
          onChange={handleChange}
        />
      </Grid>
    </Grid>
  )
}

export default Step1DealType
