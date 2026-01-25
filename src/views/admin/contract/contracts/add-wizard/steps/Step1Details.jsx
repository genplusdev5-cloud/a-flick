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

  return (
    <Grid container spacing={4}>
      <Grid item xs={12}>
        <Divider sx={{ my: 1 }}> Contract Information </Divider>
      </Grid>
      
      {/* Origin */}
       <Grid item xs={12} md={3}>
        <GlobalAutocomplete
          label='Origin'
          freeSolo
          options={dropdowns.companies || []}
          value={formData.companyId}
          onChange={(e, value) => handleAutocompleteChange('company', value, refs.companyRef)}
          inputRef={refs.companyRef}
        />
      </Grid>

      {/* Customer */}
      <Grid item xs={12} md={3}>
        <GlobalAutocomplete
          label='Customer *'
          options={dropdowns.customers || []}
          value={formData.customerId}
          onChange={(e, value) => handleAutocompleteChange('customer', value, refs.customerRef)}
          inputRef={refs.customerRef}
        />
      </Grid>
      
       {/* Contract Type */}
      <Grid item xs={12} md={3}>
        <GlobalAutocomplete
          label='Contract Type'
          options={dropdowns.contractTypes || ['Continuous Contract', 'Limited Contract', 'Continuous Job', 'Job', 'Warranty']}
          value={formData.contractType}
          onChange={(e, value) => handleAutocompleteChange('contractType', value, refs.contractTypeInputRef)}
          inputRef={refs.contractTypeInputRef}
          onKeyDown={e => handleKeyDown(e, refs.contractTypeInputRef)}
        />
      </Grid>

       {/* Contract Name */}
       <Grid item xs={12} md={3}>
         <CustomTextField
          fullWidth
          label='Contract Name'
          name='name'
          placeholder='Contract Name'
          value={formData.name}
          onChange={handleChange}
          inputRef={refs.nameRef} // Updated Ref Name
          onKeyDown={e => handleKeyDown(e, refs.nameRef)}
          required
          sx={{ '& .MuiInputBase-root': { bgcolor: '#fffde7' } }}
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
          inputRef={refs.billingNameRef}
          onKeyDown={e => handleKeyDown(e, refs.billingNameRef)}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <CustomTextField
          fullWidth
          label='Billing Address'
          name='billingAddress'
          value={formData.billingAddress}
          onChange={handleChange}
          inputRef={refs.billingAddressRef}
          onKeyDown={e => handleKeyDown(e, refs.billingAddressRef)}
        />
      </Grid>
      <Grid item xs={12} md={4}>
         <CustomTextField
          fullWidth
          label='Billing Postal Code'
          name='billingPostalCode'
          value={formData.billingPostalCode}
          onChange={handleChange}
          inputRef={refs.billingPostalCodeRef}
          onKeyDown={e => handleKeyDown(e, refs.billingPostalCodeRef)}
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
          inputRef={refs.customerCodeRef}
          onKeyDown={e => handleKeyDown(e, refs.customerCodeRef)}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <CustomTextField
          fullWidth
          label='Group Code'
          name='groupCode'
          value={formData.groupCode}
          onChange={handleChange}
          inputRef={refs.groupCodeRef}
          onKeyDown={e => handleKeyDown(e, refs.groupCodeRef)}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <CustomTextField
          fullWidth
          label='Acc. Code'
          name='accCode'
          value={formData.accCode}
          onChange={handleChange}
          inputRef={refs.accCodeRef}
          onKeyDown={e => handleKeyDown(e, refs.accCodeRef)}
        />
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
          inputRef={refs.picContactNameRef}
          onKeyDown={e => handleKeyDown(e, refs.picContactNameRef)}
        />
      </Grid>
      <Grid item xs={12} md={4}>
         <CustomTextField
          fullWidth
          label='PIC Email'
          name='picEmail'
          value={formData.picEmail}
          onChange={handleChange}
          inputRef={refs.picEmailRef}
          onKeyDown={e => handleKeyDown(e, refs.picEmailRef)}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <CustomTextField
          fullWidth
          label='PIC Phone'
          name='picPhone'
          value={formData.picPhone}
          onChange={handleChange}
          inputRef={refs.picPhoneRef}
          onKeyDown={e => handleKeyDown(e, refs.picPhoneRef)}
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
           inputRef={refs.billingContactNameRef}
          onKeyDown={e => handleKeyDown(e, refs.billingContactNameRef)}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <CustomTextField
          fullWidth
          label='Billing Email'
          name='billingEmail'
          value={formData.billingEmail}
          onChange={handleChange}
          inputRef={refs.billingEmailRef}
          onKeyDown={e => handleKeyDown(e, refs.billingEmailRef)}
        />
      </Grid>
       <Grid item xs={12} md={4}>
        <CustomTextField
          fullWidth
          label='Billing Phone'
          name='billingPhone'
          value={formData.billingPhone}
          onChange={handleChange}
          inputRef={refs.billingPhoneRef}
          onKeyDown={e => handleKeyDown(e, refs.billingPhoneRef)}
        />
      </Grid>

    </Grid>
  )
}

export default Step1Details
