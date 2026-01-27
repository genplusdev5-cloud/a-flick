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
  setCopyCustomerAddress,
  handleKeyDown,
  refs
}) => {
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
          inputRef={refs.serviceAddressRef}
          onKeyDown={e => handleKeyDown(e, refs.serviceAddressRef)}
          required
          sx={requiredFieldSx}
        />
      </Grid>

      <Grid item xs={12} md={3}>
        <CustomTextField
          fullWidth
          label='Postal Code'
          name='postalCode'
          value={formData.postalCode}
          onChange={handleChange}
          inputRef={refs.postalCodeRef}
          onKeyDown={e => handleKeyDown(e, refs.postalCodeRef)}
          required
          sx={requiredFieldSx}
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <CustomTextField
          fullWidth
          label='Covered Location'
          name='coveredLocation'
          value={formData.coveredLocation}
          onChange={handleChange}
          inputRef={refs.coveredLocationRef}
          onKeyDown={e => handleKeyDown(e, refs.coveredLocationRef)}
          required
          sx={requiredFieldSx}
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
          inputRef={refs.poNumberRef}
          onKeyDown={e => handleKeyDown(e, refs.poNumberRef)}
          required
          sx={requiredFieldSx}
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <AppReactDatepicker
          selected={formData.poExpiry}
          onChange={date => handleDateChange('poExpiry', date)}
          dateFormat='dd/MM/yyyy'
          customInput={
            <CustomTextField
              fullWidth
              label='PO Expiry Date'
              inputRef={refs.poExpiryRef}
              onKeyDown={e => handleKeyDown(e, refs.poExpiryRef)}
              required
              sx={requiredFieldSx}
            />
          }
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
          customInput={
            <CustomTextField
              fullWidth
              label='Preferred Time'
              inputRef={refs.preferredTimeRef}
              onKeyDown={e => handleKeyDown(e, refs.preferredTimeRef)}
              required
              sx={requiredFieldSx}
            />
          }
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
          inputRef={refs.reportEmailRef}
          onKeyDown={e => handleKeyDown(e, refs.reportEmailRef)}
          required
          sx={requiredFieldSx}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <CustomTextField
          fullWidth
          label='Site Contact Person Name'
          name='contactPerson'
          value={formData.contactPerson}
          onChange={handleChange}
          inputRef={refs.contactPersonRef}
          onKeyDown={e => handleKeyDown(e, refs.contactPersonRef)}
          required
          sx={requiredFieldSx}
        />
      </Grid>

      <Grid item xs={12} md={3}>
        <CustomTextField
          fullWidth
          label='Site Incharge Phone Number'
          name='sitePhone'
          value={formData.sitePhone}
          onChange={handleChange}
          inputRef={refs.sitePhoneRef}
          onKeyDown={e => handleKeyDown(e, refs.sitePhoneRef)}
          required
          sx={requiredFieldSx}
        />
      </Grid>

      <Grid item xs={12} md={3}>
        <CustomTextField
          fullWidth
          label='Mobile'
          name='mobile'
          value={formData.mobile}
          onChange={handleChange}
          inputRef={refs.mobileRef}
          onKeyDown={e => handleKeyDown(e, refs.mobileRef)}
          required
          sx={requiredFieldSx}
        />
      </Grid>

      <Grid item xs={12} md={3}>
        <GlobalAutocomplete
          label='Call Type'
          options={dropdowns?.callTypes || []}
          value={formData.callTypeId}
          onChange={v => handleAutocompleteChange('callType', v, refs.callTypeRef)}
          inputRef={refs.callTypeRef}
          required
          sx={requiredFieldSx}
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <AppReactDatepicker
          selected={formData.startDate}
          onChange={date => handleDateChange('startDate', date)}
          dateFormat='dd/MM/yyyy'
          customInput={
            <CustomTextField
              fullWidth
              label='Start Date'
              inputRef={refs.startDateRef}
              onKeyDown={e => handleKeyDown(e, refs.startDateRef)}
              required
              sx={requiredFieldSx}
            />
          }
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <AppReactDatepicker
          selected={formData.endDate}
          onChange={date => handleDateChange('endDate', date)}
          dateFormat='dd/MM/yyyy'
          customInput={
            <CustomTextField
              fullWidth
              label='End Date'
              inputRef={refs.endDateRef}
              onKeyDown={e => handleKeyDown(e, refs.endDateRef)}
              required
              sx={requiredFieldSx}
            />
          }
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <AppReactDatepicker
          selected={formData.reminderDate}
          onChange={date => handleDateChange('reminderDate', date)}
          dateFormat='dd/MM/yyyy'
          customInput={
            <CustomTextField
              fullWidth
              label='Reminder Date'
              inputRef={refs.reminderDateRef}
              onKeyDown={e => handleKeyDown(e, refs.reminderDateRef)}
              required
              sx={requiredFieldSx}
            />
          }
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <GlobalAutocomplete
          label='Industry'
          options={dropdowns?.industries || []}
          value={formData.industryId}
          onChange={v => handleAutocompleteChange('industry', v, refs.industryRef)}
          inputRef={refs.industryRef}
          required
          sx={requiredFieldSx}
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <GlobalAutocomplete
          label='Payment Term'
          options={['0 days', '30 days']}
          value={formData.paymentTerm}
          onChange={v => handleAutocompleteChange('paymentTerm', v, refs.paymentTermRef)}
          inputRef={refs.paymentTermRef}
          required
          sx={requiredFieldSx}
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <GlobalAutocomplete
          label='Sales Person'
          options={dropdowns?.salesPersons || []}
          value={formData.salesPersonId}
          onChange={v => handleAutocompleteChange('salesPerson', v, refs.salesPersonRef)}
          inputRef={refs.salesPersonRef}
          required
          sx={requiredFieldSx}
        />
      </Grid>

      {/* Lat/Long */}
      <Grid item xs={12} md={4}>
        <CustomTextField
          fullWidth
          label='Latitude'
          name='latitude'
          value={formData.latitude}
          onChange={handleChange}
          inputRef={refs.latitudeRef}
          onKeyDown={e => handleKeyDown(e, refs.latitudeRef)}
          required
          sx={requiredFieldSx}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <CustomTextField
          fullWidth
          label='Longitude'
          name='longitude'
          value={formData.longitude}
          onChange={handleChange}
          inputRef={refs.longitudeRef}
          onKeyDown={e => handleKeyDown(e, refs.longitudeRef)}
          required
          sx={requiredFieldSx}
        />
      </Grid>
    </Grid>
  )
}

export default Step2CustomerInfo
