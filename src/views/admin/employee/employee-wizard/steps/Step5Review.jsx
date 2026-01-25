'use client'

import React from 'react'
import { Grid, Typography, Divider, Box, Paper, Chip } from '@mui/material'

const ReviewRow = ({ label, value }) => (
  <Grid item xs={12} sm={6}>
    <Box>
      <Typography variant='caption' color='text.secondary'>{label}</Typography>
      <Typography variant='body1' sx={{ fontWeight: 500 }}>{value || '-'}</Typography>
    </Box>
  </Grid>
)

const Step5Review = ({ form }) => {
  return (
    <Grid container spacing={4}>
      <Grid item xs={12}>
           <Typography variant='h6' sx={{ mb: 2 }}>Review Details</Typography>
      </Grid>
      
       <Grid item xs={12}>
           <Paper variant='outlined' sx={{ p: 3 }}>
               <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
                   Personal Information
               </Typography>
               <Grid container spacing={2}>
                   <ReviewRow label='Full Name' value={form.name} />
                   <ReviewRow label='Nick Name' value={form.nickname} />
                   <ReviewRow label='Email' value={form.email} />
                   <ReviewRow label='Phone' value={form.phone} />
                   <ReviewRow label='Nationality' value={form.nationality} />
                   <ReviewRow label='DOB' value={form.dob?.toLocaleDateString()} />
               </Grid>
           </Paper>
       </Grid>
       
       <Grid item xs={12}>
           <Paper variant='outlined' sx={{ p: 3 }}>
               <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
                   Professional Details
               </Typography>
               <Grid container spacing={2}>
                   <ReviewRow label='Role' value={form.employeeRole?.label} />
                   <ReviewRow label='Employee Code' value={form.employeeCode} />
                   <ReviewRow label='Department' value={form.department?.label} />
                   <ReviewRow label='Designation' value={form.designation?.label} />
                   <ReviewRow label='Join Date' value={form.joinDate?.toLocaleDateString()} />
               </Grid>
           </Paper>
       </Grid>
       
        <Grid item xs={12}>
           <Paper variant='outlined' sx={{ p: 3 }}>
               <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
                   Permissions
               </Typography>
               <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                   {form.isScheduler && <Chip label='Scheduler' color='success' size='small' variant='outlined' />}
                   {form.isSupervisorFlag && <Chip label='Supervisor' color='success' size='small' variant='outlined' />}
                   {form.isSales && <Chip label='Sales' color='success' size='small' variant='outlined' />}
                   {form.isTechnician && <Chip label='Technician' color='success' size='small' variant='outlined' />}
                   {form.isForeigner && <Chip label='Foreigner' color='warning' size='small' variant='outlined' />}
               </Box>
           </Paper>
       </Grid>

    </Grid>
  )
}

export default Step5Review
