'use client'

import React from 'react'
import { Grid, Typography, Divider } from '@mui/material'
import MenuItem from '@mui/material/MenuItem'
import CustomTextField from '@core/components/mui/TextField'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

const Step2Professional = ({ form, setField, dropdowns }) => {
    
  const renderAC = (name, label, list, required = false) => (
    <Grid item xs={12} md={4}>
      <GlobalAutocomplete
        options={list}
        getOptionLabel={o => o?.label || ''}
        isOptionEqualToValue={(a, b) => a?.id === b?.id}
        value={form[name] || null}
        onChange={v => setField(name, v)}
        renderInput={params => (
          <CustomTextField {...params} label={label} fullWidth />
        )}
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
        />
        </Grid>
      
      {/* Hierarchy */}
      {renderAC('department', 'Department', dropdowns.departments)}
      {renderAC('designation', 'Designation', dropdowns.designations)}
      {renderAC('userRole', 'User Role', dropdowns.roles, true)}
      {renderAC('scheduler', 'Scheduler', dropdowns.schedulers)}
      {renderAC('supervisor', 'Supervisor', dropdowns.supervisors)}
      
       {/* Join/Resign Dates */}
       <Grid item xs={12} md={4}>
          <AppReactDatepicker
            selected={form.joinDate}
            onChange={date => setField('joinDate', date)}
            dateFormat='dd/MM/yyyy'
            customInput={<CustomTextField label='Join Date' fullWidth />}
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
