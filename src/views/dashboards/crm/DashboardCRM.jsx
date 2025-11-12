'use client'

// ✅ MUI Imports
import Grid from '@mui/material/Grid2'
import { useState, useEffect } from 'react'

import { getFullDashboardData } from '@/api/dashboard'


// ✅ Component Imports
import CardStatVertical from '@/components/card-statistics/Vertical'
import DashboardList from '@/components/dashboard/DashboardList'

const DashboardCRM = () => {
  // ✅ hooks MUST BE INSIDE COMPONENT
  const [dashboard, setDashboard] = useState({
    customers: 0,
    active_contracts: 0,
    active_jobs: 0,
    active_warranties: 0,
    due_for_renewal: 0,
    yearly_terminations: 0
  })

  useEffect(() => {
    loadDashboard()
  }, [])

const loadDashboard = async () => {
  const response = await getFullDashboardData()
  if (response?.status === 'success') {
    const cardData = response.cards || {}
    setDashboard({
      customers: cardData.customers || 0,
      active_contracts: cardData.active_contracts || 0,
      active_jobs: cardData.active_jobs || 0,
      active_warranties: cardData.active_warranties || 0,
      due_for_renewal: cardData.due_for_renewal || 0,
      yearly_terminations: cardData.yearly_terminations || 0
    })
  } else {
    setDashboard({
      customers: 0,
      active_contracts: 0,
      active_jobs: 0,
      active_warranties: 0,
      due_for_renewal: 0,
      yearly_terminations: 0
    })
  }
}


  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <CardStatVertical
          title='Customers'
          subtitle='Total'
          stats={dashboard.customers}
          avatarColor='primary'
          avatarIcon='tabler-users'
          avatarSkin='light'
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <CardStatVertical
          title='Active Contracts'
          subtitle='Total'
          stats={dashboard.active_contracts}
          avatarColor='info'
          avatarIcon='tabler-file-text'
          avatarSkin='light'
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <CardStatVertical
          title='Active Jobs'
          subtitle='Total'
          stats={dashboard.active_jobs}
          avatarColor='success'
          avatarIcon='tabler-briefcase'
          avatarSkin='light'
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <CardStatVertical
          title='Active Warranties'
          subtitle='Total'
          stats={dashboard.active_warranties}
          avatarColor='warning'
          avatarIcon='tabler-shield-check'
          avatarSkin='light'
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <CardStatVertical
          title='Due For Renewal'
          subtitle='Total'
          stats={dashboard.due_for_renewal}
          avatarColor='error'
          avatarIcon='tabler-refresh'
          avatarSkin='light'
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <CardStatVertical
          title='Yearly Terminations'
          subtitle='Total'
          stats={dashboard.yearly_terminations}
          avatarColor='secondary'
          avatarIcon='tabler-calendar-x'
          avatarSkin='light'
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <DashboardList data={dashboard} />
      </Grid>
    </Grid>
  )
}

export default DashboardCRM
