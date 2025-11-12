'use client'

import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'

const DashboardList = ({ data }) => {
  const [filterType, setFilterType] = useState('customer')
  const [keyword, setKeyword] = useState('')
  const [radioFilter, setRadioFilter] = useState('contract_no')

  const handleRefresh = () => {
    console.log('Filter Type:', filterType)
    console.log('Keyword:', keyword)
    console.log('Radio Filter:', radioFilter)

  }

  return (
    <Card>
      <CardHeader title="Dashboard Summary" subheader="Full Overview" />

      <CardContent className="flex flex-col gap-6">

        {/* 🔹 FILTER SECTION */}
        <Grid container spacing={4}>

          {/* Dropdown */}
          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              label="Filter Type"
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
            >
              <MenuItem value='customer'>Customer</MenuItem>
              <MenuItem value='contract'>Contract</MenuItem>
            </TextField>
          </Grid>

          {/* Search Box */}
          <Grid item xs={12} sm={7}>
            <TextField
              fullWidth
              label="Search Keyword"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
            />
          </Grid>

          {/* Refresh Button */}
          <Grid item xs={12} sm={2}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              sx={{ height: '100%' }}
              onClick={handleRefresh}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>

        {/* 🔹 RADIO BUTTONS */}
        <RadioGroup
          row
          value={radioFilter}
          onChange={(e) => setRadioFilter(e.target.value)}
          sx={{ paddingX: 1 }}
        >
          <FormControlLabel value="contract_no" control={<Radio />} label="Contract No." />
          <FormControlLabel value="service_address" control={<Radio />} label="Service Address" />
          <FormControlLabel value="service_postal" control={<Radio />} label="Service Postal" />
          <FormControlLabel value="service_contact" control={<Radio />} label="Service Contact" />
          <FormControlLabel value="service_phone" control={<Radio />} label="Service Phone" />
        </RadioGroup>

        {/* 🔹 SUMMARY LIST */}
        <div className="flex flex-col gap-4">
          <Item label="Customers" value={data.customers} />
          <Item label="Active Contracts" value={data.active_contracts} />
          <Item label="Active Jobs" value={data.active_jobs} />
          <Item label="Active Warranties" value={data.active_warranties} />
          <Item label="Due For Renewal" value={data.due_for_renewal} />
          <Item label="Yearly Terminations" value={data.yearly_terminations} />
        </div>

      </CardContent>
    </Card>
  )
}

const Item = ({ label, value }) => (
  <div className="flex justify-between items-center border-b pb-2">
    <Typography variant="body1" color="text.primary">
      {label}
    </Typography>
    <Typography variant="h6" color="text.primary">
      {value}
    </Typography>
  </div>
)

export default DashboardList
