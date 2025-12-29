'use client'

import { useState, useEffect } from 'react'
import { Box, Card, Grid, Typography, Checkbox, CardHeader , Divider } from '@mui/material'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Link from 'next/link'
import { format } from 'date-fns'

import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import GlobalButton from '@/components/common/GlobalButton'
import GlobalDateRange from '@/components/common/GlobalDateRange'

import { getRICDropdowns } from '@/api/ricFollowup/dropdowns'
import { generateRICReport } from '@/api/ricFollowup/generate'
import PermissionGuard from '@/components/auth/PermissionGuard'

/* ------------------------------------------------
   📌 MAIN PAGE — Updated to EXACT Service Summary UI
-------------------------------------------------- */
const RicFollowUpReportPageContent = () => {
  const [enableDateFilter, setEnableDateFilter] = useState(true)
  const [filters, setFilters] = useState({
    customer_id: '',
    contract_id: '',
    group_code: '',
    purpose: '',
    technician: ''
  })

  const [dropdown, setDropdown] = useState({})

  const [fromDate, setFromDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  useEffect(() => {
    loadDropdowns()
  }, [])

  const loadDropdowns = async () => {
    const res = await getRICDropdowns()
    if (res.status === 'success') {
      setDropdown(res.data.data) // ⬅️ FIXED
    } else {
      console.error(res.message)
    }
  }

  const handleGenerate = async () => {
    const payload = { ...filters }

    if (enableDateFilter) {
      payload.from_date = fromDate
      payload.to_date = toDate
    }

    const res = await generateRICReport(payload)

    if (res.status === 'success') {
      const url = window.URL.createObjectURL(new Blob([res.file]))
      const link = document.createElement('a')
      link.href = url
      link.download = 'ric_followup_report.xlsx'
      link.click()
      window.URL.revokeObjectURL(url)
    } else {
      alert('Error: ' + res.message)
    }
  }

  return (
    <Box sx={{ p: 1 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 2 }}>
        <Link href='/' style={{ textDecoration: 'none' }}>
          Dashboard
        </Link>
        <Typography color='text.primary'>RIC Follow-up Report</Typography>
      </Breadcrumbs>

      {/* FILTER CARD – SAME UI AS SERVICE SUMMARY PAGE */}
      <Card
        sx={{
          borderRadius: 2,
          boxShadow: '0px 4px 20px rgba(0,0,0,0.08)'
        }}
      >
        {/* 🔥 CARD HEADER – SAME AS SERVICE SUMMARY */}
        <CardHeader
          sx={{ px: 4, pb: 2 }}
          title={
            <Typography variant='h5' fontWeight={600}>
              RIC Follow-up Report
            </Typography>
          }
        />

        <Divider />

        {/* 🔥 CARD CONTENT */}
        <Box sx={{ p: 4 }}>
          <Grid
            container
            spacing={3}
            alignItems='flex-start'
            sx={{
              '& .MuiInputBase-root': {
                height: 40,
                fontSize: 15
              }
            }}
          >
            {/* DATE RANGE */}
            <Grid item xs={12} md={3}>
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
            <Grid item xs={12} md={3}>
              <GlobalAutocomplete
                label='Customer'
                placeholder='Select Customer'
                fullWidth
                options={(dropdown?.customer?.name || []).map(item => ({
                  label: item.name,
                  value: item.id
                }))}
                onChange={async v => {
                  const customerId = v?.value || ''
                  setFilters(prev => ({ ...prev, customer_id: customerId }))

                  const res = await getRICDropdowns({ customer_id: customerId })
                  if (res.status === 'success') {
                    setDropdown(prev => ({
                      ...prev,
                      contract_list: res.data.data.contract_list || {},
                      group_code: res.data.data.group_code || {}
                    }))
                  }
                }}
              />
            </Grid>

            {/* CONTRACT */}
            <Grid item xs={12} md={3}>
              <GlobalAutocomplete
                label='Contract'
                placeholder='Select Contract'
                fullWidth
                options={(dropdown?.contract_list?.label || []).map(item => ({
                  label: item.label,
                  value: item.id
                }))}
                onChange={v => setFilters(prev => ({ ...prev, contract_id: v?.value || '' }))}
              />
            </Grid>

            {/* GROUP CODE */}
            <Grid item xs={12} md={3}>
              <GlobalAutocomplete
                label='Group Code'
                placeholder='Select Group Code'
                fullWidth
                options={(dropdown?.group_code?.category || []).map(item => ({
                  label: item.category ?? 'No Category',
                  value: item.id
                }))}
                onChange={v => setFilters(prev => ({ ...prev, group_code: v?.value || '' }))}
              />
            </Grid>

            {/* PURPOSE */}
            <Grid item xs={12} md={3}>
              <GlobalAutocomplete
                label='Purpose'
                placeholder='Select Purpose'
                fullWidth
                options={(dropdown?.purpose?.name || []).map(item => ({
                  label: item.name,
                  value: item.id
                }))}
                onChange={v => setFilters(prev => ({ ...prev, purpose: v?.value || '' }))}
              />
            </Grid>

            {/* TECHNICIAN */}
            <Grid item xs={12} md={3}>
              <GlobalAutocomplete
                label='Technician'
                placeholder='Select Technician'
                fullWidth
                options={(dropdown?.technician?.name || []).map(item => ({
                  label: item.name,
                  value: item.id
                }))}
                onChange={v => setFilters(prev => ({ ...prev, technician: v?.value || '' }))}
              />
            </Grid>

            {/* GENERATE BUTTON */}
            <Grid item xs={12} md={1.4} alignSelf='flex-end'>
              <GlobalButton
                variant='contained'
                color='primary'
                fullWidth
                sx={{ height: 45, fontWeight: 700 }}
                onClick={handleGenerate}
              >
                GENERATE
              </GlobalButton>
            </Grid>
          </Grid>
        </Box>
      </Card>

      <Box sx={{ mt: 6 }}></Box>
    </Box>
  )
}

// Wrapper for RBAC
export default function RicFollowUpReportPage() {
  return (
    <PermissionGuard permission='RIC Followup Report'>
      <RicFollowUpReportPageContent />
    </PermissionGuard>
  )
}
