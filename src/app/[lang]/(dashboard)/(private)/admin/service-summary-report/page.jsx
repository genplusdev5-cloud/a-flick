'use client'

import { useState, useEffect, forwardRef } from 'react'
import { Box, Card, Grid, Typography, Checkbox } from '@mui/material'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Link from 'next/link'
import { format } from 'date-fns'

import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import CustomTextField from '@core/components/mui/TextField'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import GlobalButton from '@/components/common/GlobalButton'
import GlobalDateRange from '@/components/common/GlobalDateRange'

import { getReportDropdown, generateServiceSummary } from '@/api/serviceSummary'
import { showToast } from '@/components/common/Toasts'

/* -----------------------------------
   📅 DATE RANGE PICKER
----------------------------------- */
const DateRangePickerField = ({ startDate, endDate, setDates }) => {
  const handleChange = dates => {
    const [start, end] = dates
    setDates({ startDate: start, endDate: end })
  }

  const CustomInput = forwardRef((props, ref) => {
    const { label, start, end, ...rest } = props

    return (
      <CustomTextField
        fullWidth
        inputRef={ref}
        label={label}
        {...rest}
        value={`${start ? format(start, 'MM/dd/yyyy') : ''}${end ? ' - ' + format(end, 'MM/dd/yyyy') : ''}`}
      />
    )
  })

  return (
    <AppReactDatepicker
      selectsRange
      startDate={startDate}
      endDate={endDate}
      selected={startDate}
      onChange={handleChange}
      shouldCloseOnSelect={false}
      customInput={<CustomInput label='Date Filter' start={startDate} end={endDate} />}
    />
  )
}

/* -----------------------------------
   📌 MAIN PAGE
----------------------------------- */
export default function ServiceSummaryReportPage() {
  const [dropdown, setDropdown] = useState({})
  const [enableDateFilter, setEnableDateFilter] = useState(true)
  const [fromDate, setFromDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const [filters, setFilters] = useState({
    customer_id: '',
    contract_id: '',
    group_code: '',
    pest_level: ''
  })

  const [dates, setDates] = useState({
    startDate: new Date(),
    endDate: new Date()
  })

  /* LOAD INITIAL DROPDOWNS */
  const loadDropdowns = async () => {
    const res = await getReportDropdown()
    if (res.status === 'success') {
      setDropdown(res.data)
    } else {
      showToast('error', res.message)
    }
  }

  useEffect(() => {
    loadDropdowns()
  }, [])

  const handleGenerate = async () => {
    const payload = {}

    if (enableDateFilter && fromDate) payload.from_date = fromDate
    if (enableDateFilter && toDate) payload.to_date = toDate
    if (filters.customer_id) payload.customer_id ? (payload.customer_id = Number(filters.customer_id)) : null
    if (filters.contract_id) payload.contract_id = Number(filters.contract_id)
    if (filters.group_code) payload.group_code = Number(filters.group_code)
    if (filters.pest_level) payload.pest_level = Number(filters.pest_level)

    console.log('Final JSON payload →', payload) // இத பாரு console-ல

    const res = await generateServiceSummary(payload) // இப்போ JSON ஆ போகும்

    if (res.status === 'success') {
      const url = window.URL.createObjectURL(new Blob([res.file]))
      const link = document.createElement('a')
      link.href = url
      link.download = 'service_summary.xlsx'
      link.click()
      window.URL.revokeObjectURL(url)
      showToast('success', 'Report generated!')
    } else {
      showToast('error', res.message)
    }
  }

  return (
    <Box>
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 2 }}>
        <Link href='/' style={{ textDecoration: 'none' }}>
          Dashboard
        </Link>
        <Typography color='text.primary'>Service Request Summary</Typography>
      </Breadcrumbs>

      <Card
        sx={{
          p: 4,
          borderRadius: 2,
          boxShadow: '0px 4px 20px rgba(0,0,0,0.08)',
          minHeight: 170,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Grid container spacing={3} alignItems='center'>
          {/* DATE RANGE */}
          {/* DATE RANGE */}
          <Grid item xs={12} md={3.2}>
            <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              {/* Checkbox + Label */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Checkbox
                  checked={enableDateFilter}
                  onChange={e => {
                    const checked = e.target.checked
                    setEnableDateFilter(checked)

                    if (!checked) {
                      setFromDate('')
                      setToDate('')
                    }
                  }}
                  size='small'
                />

                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Date Range</Typography>
              </Box>

              {/* Global Date Range Picker */}
              <GlobalDateRange
                label=''
                start={fromDate}
                end={toDate}
                onSelectRange={({ start, end }) => {
                  setFromDate(start ? format(new Date(start), 'yyyy-MM-dd') : '')
                  setToDate(end ? format(new Date(end), 'yyyy-MM-dd') : '')
                }}
                disabled={!enableDateFilter}
              />
            </Box>
          </Grid>

          {/* CUSTOMER */}
          <Grid item xs={12} md={2.2}>
            <GlobalAutocomplete
              label='Customer'
              value={
                filters.customer_id
                  ? {
                      label: (dropdown?.customer?.name || []).find(c => c.id === filters.customer_id)?.name || '',
                      value: filters.customer_id
                    }
                  : null
              }
              options={(dropdown?.customer?.name || []).map(c => ({
                label: c.name,
                value: c.id
              }))}
              onChange={async selected => {
                const value = selected?.value || ''

                setFilters(prev => ({
                  ...prev,
                  customer_id: value
                }))

                // Load dependent dropdowns
                const dependent = await getReportDropdown({ customer_id: value })

                setDropdown(prev => ({
                  ...prev,
                  contract_list: dependent.data.contract_list || {},
                  group_code: dependent.data.group_code || {}
                }))
              }}
            />
          </Grid>

          {/* CONTRACT */}
          <Grid item xs={12} md={2.2}>
            <GlobalAutocomplete
              label='Contract'
              value={
                filters.contract_id
                  ? {
                      label:
                        (dropdown?.contract_list?.label || []).find(c => c.id === filters.contract_id)?.label || '',
                      value: filters.contract_id
                    }
                  : null
              }
              options={(dropdown?.contract_list?.label || []).map(c => ({
                label: c.label,
                value: c.id
              }))}
              onChange={selected =>
                setFilters(prev => ({
                  ...prev,
                  contract_id: selected?.value || ''
                }))
              }
            />
          </Grid>

          {/* GROUP CODE */}
          <Grid item xs={12} md={2.2}>
            <GlobalAutocomplete
              label='Group Code'
              value={
                filters.group_code
                  ? {
                      label:
                        (dropdown?.group_code?.category || []).find(g => g.id === filters.group_code)?.category ||
                        'No Category',
                      value: filters.group_code
                    }
                  : null
              }
              options={(dropdown?.group_code?.category || []).map(g => ({
                label: g.category || 'No Category',
                value: g.id
              }))}
              onChange={selected =>
                setFilters(prev => ({
                  ...prev,
                  group_code: selected?.value || ''
                }))
              }
            />
          </Grid>

          {/* PEST LEVEL */}
          <Grid item xs={12} md={1.8}>
            <GlobalAutocomplete
              label='Pest Level'
              options={(dropdown?.pest_level?.name || []).map(p => ({
                label: p.name,
                value: p.id
              }))}
              onChange={v => setFilters(prev => ({ ...prev, pest_level: v?.value || '' }))}
            />
          </Grid>

          {/* GENERATE */}
          <Grid item xs={12} md={1.4}>
            <GlobalButton
              variant='contained'
              color='primary'
              fullWidth
              onClick={handleGenerate}
              sx={{ height: 45, fontWeight: 700 }}
            >
              GENERATE
            </GlobalButton>
          </Grid>
        </Grid>
      </Card>
    </Box>
  )
}
