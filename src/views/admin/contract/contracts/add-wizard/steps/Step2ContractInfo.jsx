'use client'

import React, { useState } from 'react'
import { Grid, Typography, FormControlLabel, Checkbox, Divider } from '@mui/material'
import MenuItem from '@mui/material/MenuItem'
import CustomTextField from '@core/components/mui/TextField'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

const Step2ContractInfo = ({ formData, setFormData, dropdowns, refs, handleAutocompleteChange, handleKeyDown, handleDateChange }) => {
  const [copyCustomerAddress, setCopyCustomerAddress] = useState(false)
  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const copyFromCustomer = async () => {
       // Logic to copy customer details (will be implemented in index if needed or passed down)
       // For UI parity we show the checkbox
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
              onChange={e => {
                  setCopyCustomerAddress(e.target.checked)
                  // Trigger copy logic if needed
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
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <CustomTextField
          fullWidth
          label='Covered Location'
          name='coveredLocation'
          value={formData.coveredLocation}
          onChange={handleChange}
          inputRef={refs.coveredLocationRef} // Ensure this Ref exists in index
          onKeyDown={e => handleKeyDown(e, refs.coveredLocationRef)} // Ensure Ref exists
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
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <AppReactDatepicker
          selected={formData.poExpiry}
          onChange={date => handleDateChange('poExpiry', date)}
          customInput={
            <CustomTextField
              fullWidth
              label='PO Expiry Date'
              inputRef={refs.poExpiryRef} // Ensure Ref exists
              onKeyDown={e => handleKeyDown(e, refs.poExpiryRef)}
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
              inputRef={refs.preferredTimeRef} // Ensure Ref exists
              onKeyDown={e => handleKeyDown(e, refs.preferredTimeRef)}
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
        />
      </Grid>

      <Grid item xs={12} md={3}>
        <CustomTextField
          fullWidth
          label='Site Incharge Phone Number'
          name='sitePhone'
          value={formData.sitePhone}
          onChange={handleChange}
          inputRef={refs.sitePhoneRef} // Ensure Ref exists
          onKeyDown={e => handleKeyDown(e, refs.sitePhoneRef)}
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
        />
      </Grid>
      
      <Grid item xs={12} md={3}>
        <GlobalAutocomplete
          label='Call Type'
          options={dropdowns.callTypes || []}
          value={formData.callTypeId}
          onChange={v => handleAutocompleteChange('callType', v, refs.callTypeRef)} // Ensure Ref
          inputRef={refs.callTypeRef}
        />
      </Grid>

       {/* Dates & Last Row */}
      <Grid item xs={12} md={4}>
        <AppReactDatepicker
          selected={formData.startDate}
          onChange={date => handleDateChange('startDate', date)}
          customInput={
            <CustomTextField
              fullWidth
              label='Start Date *'
              inputRef={refs.startDateRef} // Ensure Ref
              onKeyDown={e => handleKeyDown(e, refs.startDateRef)}
            />
          }
        />
      </Grid>
      <Grid item xs={12} md={4}>
         <AppReactDatepicker
          selected={formData.endDate}
          onChange={date => handleDateChange('endDate', date)}
          customInput={
            <CustomTextField
              fullWidth
              label='End Date *'
              inputRef={refs.endDateRef} // Ensure Ref
               onKeyDown={e => handleKeyDown(e, refs.endDateRef)}
            />
          }
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <AppReactDatepicker
          selected={formData.reminderDate}
          onChange={date => handleDateChange('reminderDate', date)}
          customInput={
            <CustomTextField
              fullWidth
              label='Reminder Date'
               inputRef={refs.reminderDateRef} // Ensure Ref
               onKeyDown={e => handleKeyDown(e, refs.reminderDateRef)}
            />
          }
        />
      </Grid>
      
       <Grid item xs={12} md={4}>
        <GlobalAutocomplete
          label='Industry'
          options={dropdowns.industries || []}
          value={formData.industryId}
          onChange={v => handleAutocompleteChange('industry', v, refs.industryRef)} // Ensure Ref
          inputRef={refs.industryRef}
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <GlobalAutocomplete
          label='Payment Term'
          options={['0 days', '30 days']}
          value={formData.paymentTerm}
          onChange={v => handleAutocompleteChange('paymentTerm', v, refs.paymentTermRef)} // Ensure Ref
          inputRef={refs.paymentTermRef}
        />
      </Grid>

      <Grid item xs={12} md={4}>
         <GlobalAutocomplete
          label='Sales Person'
          options={dropdowns.salesPersons || []}
          value={formData.salesPersonId}
          onChange={v => handleAutocompleteChange('salesPerson', v, refs.salesPersonRef)} // Ensure Ref
          inputRef={refs.salesPersonRef}
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
          inputRef={refs.latitudeRef} // Ensure Ref
          onKeyDown={e => handleKeyDown(e, refs.latitudeRef)}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <CustomTextField
          fullWidth
          label='Longitude'
          name='longitude'
          value={formData.longitude}
          onChange={handleChange}
           inputRef={refs.longitudeRef} // Ensure Ref
           onKeyDown={e => handleKeyDown(e, refs.longitudeRef)}
        />
      </Grid>

    </Grid>
  )
}

export default Step2ContractInfo
