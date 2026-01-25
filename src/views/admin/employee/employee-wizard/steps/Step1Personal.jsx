'use client'

import React from 'react'
import { Grid, Typography, Divider } from '@mui/material'
import MenuItem from '@mui/material/MenuItem'
import CustomTextField from '@core/components/mui/TextField'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

const Step1Personal = ({ form, setField, handlePhoneChange, emailError, mode }) => {
  return (
    <Grid container spacing={4}>
      <Grid item xs={12}>
        <Divider sx={{ my: 1 }}> Personal Information </Divider>
      </Grid>
      
      {/* Name & Nickname */}
      <Grid item xs={12} md={6}>
        <CustomTextField
          fullWidth
          label='Full Name'
          value={form.name}
          onChange={e => setField('name', e.target.value)}
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <CustomTextField
          fullWidth
          label='Nick Name'
          value={form.nickname}
          onChange={e => setField('nickname', e.target.value)}
        />
      </Grid>

      {/* Email & Phone */}
      <Grid item xs={12} md={4}>
        <CustomTextField
          label='Email'
          value={form.email}
          onChange={e => {
            setField('email', e.target.value)
             // Parent handles validation or we can trigger it
          }}
          error={emailError}
          helperText={emailError ? 'Invalid Email!' : ''}
          fullWidth
          required
        />
      </Grid>
        {mode === 'add' && (
        <Grid item xs={12} md={4}>
            <CustomTextField
            label='Password'
            type='password'
            value={form.password}
            onChange={e => setField('password', e.target.value)}
            fullWidth
            required
            />
        </Grid>
        )}
      <Grid item xs={12} md={4}>
        <CustomTextField label='Phone' value={form.phone} onChange={handlePhoneChange} fullWidth />
      </Grid>

      {/* Dates */}
      <Grid item xs={12} md={4}>
        <AppReactDatepicker
          selected={form.dob}
          onChange={date => setField('dob', date)}
          dateFormat='dd/MM/yyyy'
          customInput={<CustomTextField label='DOB' fullWidth />}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <CustomTextField
          label='Nationality'
          value={form.nationality}
          onChange={e => setField('nationality', e.target.value)}
          fullWidth
        />
      </Grid>
      
        <Grid item xs={12} md={4}>
        <CustomTextField
          label='Finger Print ID'
          value={form.fingerPrintId}
          onChange={e => setField('fingerPrintId', e.target.value)}
          fullWidth
        />
      </Grid>

    </Grid>
  )
}

export default Step1Personal
