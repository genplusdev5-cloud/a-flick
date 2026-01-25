'use client'

import React from 'react'
import { Grid, Typography, Divider } from '@mui/material'
import MenuItem from '@mui/material/MenuItem'
import CustomTextField from '@core/components/mui/TextField'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import GlobalTextarea from '@/components/common/GlobalTextarea'

const Step3Operations = ({ form, setField, dropdowns }) => {
    
  const renderAC = (name, label, list) => (
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
        <Divider sx={{ my: 1 }}> Operations & Logistics </Divider>
      </Grid>
      
       {/* Targets */}
        <Grid item xs={12} md={4}>
        <CustomTextField
            label='Target Day'
            value={form.targetDay}
            onChange={e => setField('targetDay', e.target.value)}
            fullWidth
        />
        </Grid>
        <Grid item xs={12} md={4}>
        <CustomTextField
            label='Target Night'
            value={form.targetNight}
            onChange={e => setField('targetNight', e.target.value)}
            fullWidth
        />
        </Grid>
        <Grid item xs={12} md={4}>
        <CustomTextField
            label='Target Saturday'
            value={form.targetSaturday}
            onChange={e => setField('targetSaturday', e.target.value)}
            fullWidth
        />
        </Grid>

         {/* Vehicle & Color */}
         {renderAC('vehicleNumber', 'Vehicle No', dropdowns.vehicles)}
          <Grid item xs={12} md={4}>
              <CustomTextField
                type='color'
                label='Color'
                value={form.color}
                InputLabelProps={{ shrink: true }}
                onChange={e => setField('color', e.target.value)}
                fullWidth
              />
          </Grid>
          
           {/* Lunch Time */}
           <Grid item xs={12} md={4}>
              <AppReactDatepicker
                selected={form.lunchTime}
                onChange={date => setField('lunchTime', date)}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                timeCaption='Time'
                dateFormat='h:mm aa'
                placeholderText='Select Lunch Time'
                customInput={<CustomTextField label='Lunch Time' fullWidth />}
              />
            </Grid>
            
             {/* Description */}
            <Grid item xs={12}>
              <GlobalTextarea
                label='Description'
                value={form.description}
                onChange={e => setField('description', e.target.value)}
                multiline
                rows={3}
                fullWidth
              />
            </Grid>

    </Grid>
  )
}

export default Step3Operations
