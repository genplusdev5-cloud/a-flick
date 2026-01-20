'use client'
import { useState, useEffect, forwardRef } from 'react'
import { Box, Card, Grid, Typography, Checkbox, CardHeader, Divider } from '@mui/material'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Link from 'next/link'
import { format } from 'date-fns'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import CustomTextField from '@core/components/mui/TextField'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import GlobalButton from '@/components/common/GlobalButton'
import GlobalDateRange from '@/components/common/GlobalDateRange'
import StickyListLayout from '@/components/common/StickyListLayout'
import { getReportDropdown, getServiceSummaryList } from '@/api/report_group/serviceSummary'
import { showToast } from '@/components/common/Toasts'
import PermissionGuard from '@/components/auth/PermissionGuard'
/* -----------------------------------
   📅 DATE RANGE PICKER
----------------------------------- */
// Unused DateRangePickerField removed
/* -----------------------------------
   📌 MAIN PAGE
----------------------------------- */
const ServiceSummaryReportPageContent = () => {
  const [dropdown, setDropdown] = useState({})
  const [enableDateFilter, setEnableDateFilter] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [filters, setFilters] = useState({
    customer_id: '',
    contract_id: '',
    group_code: '',
    pest_level: ''
  })
  // This state seems unused based on correct implementation, but leaving if needed elsewhere or removal
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
    // Add dates only if filter is enabled and both dates are selected
    if (enableDateFilter && fromDate && toDate) {
      payload.from_date = fromDate
      payload.to_date = toDate
    }
    // Ensure payload excludes empty fields and matches Postman types
    if (filters.customer_id) payload.customer_id = filters.customer_id
    if (filters.contract_id) payload.contract_id = filters.contract_id
    if (filters.group_code) payload.group_code = filters.group_code
    if (filters.pest_level) payload.pest_level = filters.pest_level
    console.log('Final JSON payload →', payload)
    const res = await generateServiceSummary(payload, filters.customer_id)
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
    <StickyListLayout
      header={
        <Box sx={{ mb: 2 }}>
          <Breadcrumbs aria-label='breadcrumb'>
            <Link href='/' style={{ textDecoration: 'none' }}>
              Dashboard
            </Link>
            <Typography color='text.primary'>Service Request Summary</Typography>
          </Breadcrumbs>
        </Box>
      }
    >
      <Card
        sx={{
          borderRadius: 2,
          boxShadow: '0px 4px 20px rgba(0,0,0,0.08)'
        }}
      >
        {/* 🔥 TITLE */}
        <CardHeader
          sx={{ px: 4, pb: 2 }}
          title={
            <Typography variant='h5' fontWeight={600}>
              Service Request Summary
            </Typography>
          }
        />
        <Divider />
        {/* 🔥 CONTENT – auto height, proper padding */}
        <Box sx={{ p: 4 }}>
          <Grid container spacing={3} alignItems='flex-start'>
            {/* DATE RANGE */}
            <Grid item xs={12} md={3.2}>
              <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
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
                <GlobalDateRange
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
                        label: String(
                          (dropdown?.group_code?.category || []).find(g => g.id === filters.group_code)?.category ||
                            filters.group_code
                        ),
                        value: filters.group_code
                      }
                    : null
                }
                options={(dropdown?.group_code?.category || []).map(g => ({
                  label: String(g.category || g.id),
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
                onChange={v =>
                  setFilters(prev => ({
                    ...prev,
                    pest_level: v?.value || ''
                  }))
                }
              />
            </Grid>
            {/* GENERATE */}
            <Grid item xs={12} md={1.4} alignSelf='flex-end'>
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
        </Box>
      </Card>
    </StickyListLayout>
  )
}
// Wrapper for RBAC
export default function ServiceSummaryReportPage() {
  return (
    <PermissionGuard permission='Service Summary Report'>
      <ServiceSummaryReportPageContent />
    </PermissionGuard>
  )
}
