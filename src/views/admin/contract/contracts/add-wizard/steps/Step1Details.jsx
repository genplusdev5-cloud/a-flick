'use client'

import React from 'react'
import { Grid, Typography, Divider } from '@mui/material'
import MenuItem from '@mui/material/MenuItem'
import CustomTextField from '@core/components/mui/TextField'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import DirectionalIcon from '@components/DirectionalIcon'
import { styled } from '@mui/material/styles'

const Step1Details = ({ formData, setFormData, dropdowns, refs, handleAutocompleteChange, handleKeyDown }) => {
  const handleChange = (e) => {
       setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const requiredFieldSx = {
    '& .MuiFormLabel-asterisk': {
      color: '#e91e63 !important',
      fontWeight: 700
    },
    '& .MuiInputLabel-root.Mui-required': {
      color: 'inherit'
    }
  }

  const renderAC = (name, label, options, ref, isFreeSolo = false) => (
    <Grid item xs={12} md={3}>
      <GlobalAutocomplete
        label={label}
        freeSolo={isFreeSolo}
        options={options}
        value={formData[name]}
        onChange={(e, value) => handleAutocompleteChange(name.replace('Id', ''), value, ref)}
        inputRef={ref}
        required
        sx={requiredFieldSx}
      />
    </Grid>
  )

  const renderTF = (name, label, ref, xs = 12, md = 4, extraSx = {}) => (
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
        sx={{ ...requiredFieldSx, ...extraSx }}
      />
    </Grid>
  )

  return (
    <Grid container spacing={4}>
      <Grid item xs={12}>
        <Divider sx={{ my: 1 }}> Contract Information </Divider>
      </Grid>
      
      {/* Origin */}
      {renderAC('companyId', 'Origin', dropdowns.companies || [], refs.companyRef, true)}

      {/* Customer */}
      {renderAC('customerId', 'Customer', dropdowns.customers || [], refs.customerRef)}
      
       {/* Contract Type */}
       <Grid item xs={12} md={3}>
        <GlobalAutocomplete
          label='Contract Type'
          options={dropdowns.contractTypes || ['Continuous Contract', 'Limited Contract', 'Continuous Job', 'Job', 'Warranty']}
          value={formData.contractType}
          onChange={(e, value) => handleAutocompleteChange('contractType', value, refs.contractTypeInputRef)}
          inputRef={refs.contractTypeInputRef}
          onKeyDown={e => handleKeyDown(e, refs.contractTypeInputRef)}
          required
          sx={requiredFieldSx}
        />
      </Grid>

       {/* Contract Name */}
       {renderTF('name', 'Contract Name', refs.nameRef, 12, 3, { '& .MuiInputBase-root': { bgcolor: '#fffde7' } })}
      
      {/* --- ROW 3: Billing Info --- */}
      <Grid item xs={12}>
        <Divider sx={{ my: 1 }}> Billing Details </Divider>
      </Grid>

      {renderTF('billingName', 'Billing Name', refs.billingNameRef)}
      {renderTF('billingAddress', 'Billing Address', refs.billingAddressRef)}
      {renderTF('billingPostalCode', 'Billing Postal Code', refs.billingPostalCodeRef)}

       {/* --- ROW 4: Codes --- */}
      {renderTF('customerCode', 'Cust. Code', refs.customerCodeRef)}
      {renderTF('groupCode', 'Group Code', refs.groupCodeRef)}
      {renderTF('accCode', 'Acc. Code', refs.accCodeRef)}

       {/* --- ROW 5: PIC Contact --- */}
      <Grid item xs={12}>
        <Divider sx={{ my: 1 }}> PIC Contact Details </Divider>
      </Grid>

      {renderTF('picContactName', 'PIC Contact Name', refs.picContactNameRef)}
      {renderTF('picEmail', 'PIC Email', refs.picEmailRef)}
      {renderTF('picPhone', 'PIC Phone', refs.picPhoneRef)}
      
       {/* --- ROW 6: Billing Contact --- */}
      <Grid item xs={12}>
        <Divider sx={{ my: 1 }}> Billing Contact Details </Divider>
      </Grid>

      {renderTF('billingContactName', 'Billing Contact Name', refs.billingContactNameRef)}
      {renderTF('billingEmail', 'Billing Email', refs.billingEmailRef)}
      {renderTF('billingPhone', 'Billing Phone', refs.billingPhoneRef)}

    </Grid>
  )
}

export default Step1Details
