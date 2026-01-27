'use client'

import React from 'react'
import { Grid, Typography, Divider } from '@mui/material'
import MenuItem from '@mui/material/MenuItem'
import CustomTextField from '@core/components/mui/TextField'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

const Step2Professional = ({ form, setField, dropdowns }) => {
  const requiredFieldSx = {
    '& .MuiFormLabel-asterisk': {
      color: '#e91e63 !important',
      fontWeight: 700
    },
    '& .MuiInputLabel-root.Mui-required': {
      color: 'inherit'
    }
  }

  const renderAC = (name, label, list, required = false) => (
    <Grid item xs={12} md={4}>
      <GlobalAutocomplete
        options={list}
        getOptionLabel={o => o?.label || ''}
        isOptionEqualToValue={(a, b) => Number(a?.id) === Number(b?.id)}
        value={form[name] || null}
        onChange={v => setField(name, v)}
        required={required}
        sx={required ? requiredFieldSx : {}}
        label={label}
      />
    </Grid>
  )

  return (
    <Grid container spacing={4}>
      <Grid item xs={12}>
        <Divider sx={{ my: 1 }}> Professional Details </Divider>
      </Grid>

      {/* Role & Code */}
      {renderAC(
        'employeeRole',
        'Employee Role',
        [
          { id: 1, label: 'Admin' },
          { id: 2, label: 'Sales' },
          { id: 3, label: 'Technician' },
          { id: 4, label: 'Confirmed Sales' },
          { id: 5, label: 'Quotation' }
        ],
        true
      )}
      <Grid item xs={12} md={4}>
        <CustomTextField
          label='Employee Code'
          value={form.employeeCode}
          onChange={e => setField('employeeCode', e.target.value)}
          fullWidth
          required
          sx={requiredFieldSx}
        />
      </Grid>

      {/* Hierarchy */}
      {renderAC('department', 'Department', dropdowns.departments, true)}
      {renderAC('designation', 'Designation', dropdowns.designations, true)}
      {renderAC('userRole', 'User Role', dropdowns.roles, true)}
      {renderAC('scheduler', 'Scheduler', dropdowns.schedulers, true)}
      {renderAC('supervisor', 'Supervisor', dropdowns.supervisors, true)}

      {/* Join/Resign Dates */}
      <Grid item xs={12} md={4}>
        <AppReactDatepicker
          selected={form.joinDate}
          onChange={date => setField('joinDate', date)}
          dateFormat='dd/MM/yyyy'
          customInput={<CustomTextField label='Join Date' fullWidth required sx={requiredFieldSx} />}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <AppReactDatepicker
          selected={form.resignDate}
          onChange={date => setField('resignDate', date)}
          dateFormat='dd/MM/yyyy'
          placeholderText='Select Resign Date'
          customInput={<CustomTextField label='Resign Date' fullWidth />}
        />
      </Grid>

    </Grid>
  )
}

export default Step2Professional
