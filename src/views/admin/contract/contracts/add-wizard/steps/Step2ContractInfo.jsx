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

  const requiredFieldSx = {
    '& .MuiFormLabel-asterisk': {
      color: '#e91e63 !important',
      fontWeight: 700
    },
    '& .MuiInputLabel-root.Mui-required': {
      color: 'inherit'
    }
  }

  const renderTF = (name, label, ref, xs = 12, md = 4) => (
    <Grid item xs={xs} md={md}>
      <CustomTextField
        fullWidth
        label={label}
        name={name}
        value={formData[name]}
        onChange={handleChange}
        inputRef={ref}
        onKeyDown={e => handleKeyDown(e, ref)}
        required
        sx={requiredFieldSx}
      />
    </Grid>
  )

  const renderDP = (name, label, ref, xs = 12, md = 4, showTime = false) => (
    <Grid item xs={xs} md={md}>
      <AppReactDatepicker
        selected={formData[name]}
        onChange={date => handleDateChange(name, date)}
        showTimeSelect={showTime}
        showTimeSelectOnly={showTime}
        timeIntervals={15}
        dateFormat={showTime ? 'h:mm aa' : 'dd/MM/yyyy'}
        customInput={
          <CustomTextField
            fullWidth
            label={label}
            inputRef={ref}
            onKeyDown={e => handleKeyDown(e, ref)}
            required
            sx={requiredFieldSx}
          />
        }
      />
    </Grid>
  )

  const renderAC = (name, label, options, ref, md = 4) => (
    <Grid item xs={12} md={md}>
      <GlobalAutocomplete
        label={label}
        options={options}
        value={formData[name.includes('Id') ? name : `${name}Id`]}
        onChange={v => handleAutocompleteChange(name.replace('Id', ''), v, ref)}
        inputRef={ref}
        required
        sx={requiredFieldSx}
      />
    </Grid>
  )

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
              }}
            />
          }
          label='Copy from Customer'
        />
      </Grid>

      {renderTF('serviceAddress', 'Service Address', refs.serviceAddressRef, 12, 6)}
      {renderTF('postalCode', 'Postal Code', refs.postalCodeRef, 12, 3)}
      {renderTF('coveredLocation', 'Covered Location', refs.coveredLocationRef, 12, 3)}
      
       {/* PO Details */}
      <Grid item xs={12}>
        <Divider sx={{ my: 1 }}> PO & Schedule </Divider>
      </Grid>

      {renderTF('poNumber', 'PO Number', refs.poNumberRef)}
      {renderDP('poExpiry', 'PO Expiry Date', refs.poExpiryRef)}
      {renderDP('preferredTime', 'Preferred Time', refs.preferredTimeRef, 12, 4, true)}

       {/* Contact Info */}
      {renderTF('reportEmail', 'Service Report Email', refs.reportEmailRef, 12, 6)}
      {renderTF('contactPerson', 'Site Contact Person Name', refs.contactPersonRef, 12, 6)}
      {renderTF('sitePhone', 'Site Incharge Phone Number', refs.sitePhoneRef, 12, 3)}
      {renderTF('mobile', 'Mobile', refs.mobileRef, 12, 3)}
      
      {renderAC('callType', 'Call Type', dropdowns.callTypes || [], refs.callTypeRef, 3)}

       {/* Dates & Last Row */}
      {renderDP('startDate', 'Start Date', refs.startDateRef)}
      {renderDP('endDate', 'End Date', refs.endDateRef)}
      {renderDP('reminderDate', 'Reminder Date', refs.reminderDateRef)}
      
      {renderAC('industry', 'Industry', dropdowns.industries || [], refs.industryRef)}
      {renderAC('paymentTerm', 'Payment Term', ['0 days', '30 days'], refs.paymentTermRef)}
      {renderAC('salesPerson', 'Sales Person', dropdowns.salesPersons || [], refs.salesPersonRef)}
      
      {/* Lat/Long */}
      {renderTF('latitude', 'Latitude', refs.latitudeRef)}
      {renderTF('longitude', 'Longitude', refs.longitudeRef)}

    </Grid>
  )
}

export default Step2ContractInfo
