import { Grid, Typography, FormControlLabel, Checkbox, Divider } from '@mui/material'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

const Step2CustomerInfo = ({
  formData,
  handleChange,
  handleAutocompleteChange,
  handleDateChange,
  dropdowns,
  copyFromCustomer,
  copyCustomerAddress,
  setCopyCustomerAddress
}) => {
  return (
    <Grid container spacing={4}>
      <Grid item xs={12}>
        <Typography variant='h6' sx={{ mb: 2 }}>
          Customer Address & Schedule
        </Typography>
      </Grid>

      {/* Service Address Row */}
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Checkbox
              checked={copyCustomerAddress}
              onChange={async e => {
                const checked = e.target.checked
                setCopyCustomerAddress(checked)
                if (checked && formData.customerId) await copyFromCustomer(formData.customerId)
              }}
            />
          }
          label='Copy from Customer'
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <CustomTextField
          fullWidth
          label='Service Address'
          name='serviceAddress'
          value={formData.serviceAddress}
          onChange={handleChange}
        />
      </Grid>

      <Grid item xs={12} md={3}>
        <CustomTextField
          fullWidth
          label='Postal Code'
          name='postalCode'
          value={formData.postalCode}
          onChange={handleChange}
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <CustomTextField
          fullWidth
          label='Covered Location'
          name='coveredLocation'
          value={formData.coveredLocation}
          onChange={handleChange}
        />
      </Grid>

      {/* PO Details */}
      <Grid item xs={12}>
        <Divider sx={{ my: 1 }}> PO & Schedule </Divider>
      </Grid>

      <Grid item xs={12} md={4}>
        <CustomTextField
          fullWidth
          label='PO Number'
          name='poNumber'
          value={formData.poNumber}
          onChange={handleChange}
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <AppReactDatepicker
          selected={formData.poExpiry}
          onChange={date => handleDateChange('poExpiry', date)}
          customInput={<CustomTextField fullWidth label='PO Expiry Date' />}
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <AppReactDatepicker
          selected={formData.preferredTime}
          onChange={date => handleDateChange('preferredTime', date)}
          showTimeSelect
          showTimeSelectOnly
          timeIntervals={15}
          dateFormat='h:mm aa'
          customInput={<CustomTextField fullWidth label='Preferred Time' />}
        />
      </Grid>

      {/* Contact Info */}
      <Grid item xs={12} md={6}>
        <CustomTextField
          fullWidth
          label='Service Report Email'
          name='reportEmail'
          value={formData.reportEmail}
          onChange={handleChange}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <CustomTextField
          fullWidth
          label='Site Contact Person Name'
          name='contactPerson'
          value={formData.contactPerson}
          onChange={handleChange}
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <CustomTextField
          fullWidth
          label='Site Incharge Phone Number'
          name='sitePhone'
          value={formData.sitePhone}
          onChange={handleChange}
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <CustomTextField fullWidth label='Mobile' name='mobile' value={formData.mobile} onChange={handleChange} />
      </Grid>

      <Grid item xs={12} md={4}>
        <GlobalAutocomplete
          label='Call Type'
          options={dropdowns?.callTypes || []}
          value={formData.callType}
          onChange={(e, v) => handleAutocompleteChange('callType', v)}
        />
      </Grid>

      {/* New Fields & Moved Fields */}
      <Grid item xs={12} md={4}>
        <CustomTextField fullWidth label='Category' name='category' value={formData.category} onChange={handleChange} />
      </Grid>

      <Grid item xs={12} md={4}>
        <AppReactDatepicker
          selected={formData.startDate}
          onChange={date => handleDateChange('startDate', date)}
          customInput={<CustomTextField fullWidth label='Start Date' />}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <AppReactDatepicker
          selected={formData.endDate}
          onChange={date => handleDateChange('endDate', date)}
          customInput={<CustomTextField fullWidth label='End Date' />}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <AppReactDatepicker
          selected={formData.reminderDate}
          onChange={date => handleDateChange('reminderDate', date)}
          customInput={<CustomTextField fullWidth label='Reminder Date' />}
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <GlobalAutocomplete
          label='Industry'
          options={dropdowns?.industries || []}
          value={formData.industry}
          onChange={(e, v) => handleAutocompleteChange('industry', v)}
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <GlobalAutocomplete
          label='Payment Term'
          options={['0 days', '30 days']}
          value={formData.paymentTerm}
          onChange={(e, v) => handleAutocompleteChange('paymentTerm', v)}
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <GlobalAutocomplete
          label='Sales Person'
          options={dropdowns?.salesPersons || []}
          value={formData.salesPerson}
          onChange={(e, v) => handleAutocompleteChange('salesPerson', v)}
        />
      </Grid>

      {/* Lat/Long */}
      <Grid item xs={12} md={4}>
        <CustomTextField fullWidth label='Latitude' name='latitude' value={formData.latitude} onChange={handleChange} />
      </Grid>
      <Grid item xs={12} md={4}>
        <CustomTextField
          fullWidth
          label='Longitude'
          name='longitude'
          value={formData.longitude}
          onChange={handleChange}
        />
      </Grid>
    </Grid>
  )
}

export default Step2CustomerInfo
