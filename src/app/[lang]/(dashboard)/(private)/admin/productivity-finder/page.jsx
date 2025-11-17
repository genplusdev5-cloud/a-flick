'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import Link from 'next/link'

import {
  Box,
  Card,
  CardHeader,
  Typography,
  Menu,
  MenuItem,
  Divider,
  TextField,
  Select,
  FormControl,
  InputAdornment,
  Popover,
  Button,
  Breadcrumbs
} from '@mui/material'


import RefreshIcon from '@mui/icons-material/Refresh'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import PrintIcon from '@mui/icons-material/Print'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import SearchIcon from '@mui/icons-material/Search'

import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import ProgressCircularCustomization from '@/components/common/ProgressCircularCustomization'
import { showToast } from '@/components/common/Toasts'

import styles from '@core/styles/table.module.css'

import classnames from 'classnames'

// Debounced input (same pattern)
const DebouncedInput = ({ value: initialValue, onChange, debounce = 400, ...props }) => {
  const [value, setValue] = useState(initialValue || '')
  useEffect(() => setValue(initialValue || ''), [initialValue])
  useEffect(() => {
    const t = setTimeout(() => onChange(value), debounce)
    return () => clearTimeout(t)
  }, [value])
  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

// Very small helper to format numbers like your screenshot (2 decimals, comma thousands)
const fmt = v => {
  if (v == null) return '0.00'
  const num = Number(v) || 0
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Dummy dataset (employees). Add or modify as needed.
const BASE_EMPLOYEES = [
  { id: 1, employee: 'LESLIE', completed: { morn: 0, day: 0, night: 0 }, pending: { morn: 0, day: 1097.5, night: 180 }, total: 1277.5 },
  { id: 2, employee: 'JEFF', completed: { morn: 0, day: 3974.78, night: 0 }, pending: { morn: 120, day: 5711.33, night: 0 }, total: 9686.11 },
  { id: 3, employee: 'ANAND', completed: { morn: 0, day: 1150, night: 0 }, pending: { morn: 0, day: 0, night: 0 }, total: 1150 },
  { id: 4, employee: 'FARID', completed: { morn: 0, day: 4873.44, night: 180 }, pending: { morn: 0, day: 3049.03, night: 0 }, total: 8102.47 },
  { id: 5, employee: 'HAMDAN', completed: { morn: 120, day: 1409.23, night: 403.75 }, pending: { morn: 0, day: 4060.58, night: 0 }, total: 6113.56 },
  { id: 6, employee: 'MAXIM', completed: { morn: 120, day: 1409.23, night: 403.75 }, pending: { morn: 120, day: 1274.62, night: 67.6 }, total: 3395.2 },
  { id: 7, employee: 'MUTHU', completed: { morn: 0, day: 1268.75, night: 400 }, pending: { morn: 0, day: 356.25, night: 533.32 }, total: 2558.32 },
  { id: 8, employee: 'BAKHTIAR', completed: { morn: 0, day: 4308.34, night: 180 }, pending: { morn: 0, day: 5179.36, night: 493.33 }, total: 10161.03 },
  { id: 9, employee: 'ALIAIDIL', completed: { morn: 0, day: 0, night: 95 }, pending: { morn: 0, day: 0, night: 0 }, total: 95 },
  { id: 10, employee: 'SAFARI', completed: { morn: 0, day: 2325.07, night: 400 }, pending: { morn: 0, day: 1389.61, night: 567.12 }, total: 4681.8 },
  // ... add more if you want
]

// Helper to expand dataset so pagination looks realistic
const makeRows = (base, multiplier = 1) => {
  const rows = []
  for (let i = 0; i < multiplier; i++) {
    base.forEach((r, idx) => {
      rows.push({
        ...r,
        id: r.id + i * 100,
        sno: rows.length + 1
      })
    })
  }
  return rows
}

// Custom single-input RangePicker using popover + two native date inputs
function RangePickerSingle({ value, onChange, label = 'Date Filter' }) {
  const anchorRef = useRef(null)
  const [anchorEl, setAnchorEl] = useState(null)
  const [localFrom, setLocalFrom] = useState(value?.from || '')
  const [localTo, setLocalTo] = useState(value?.to || '')

  useEffect(() => {
    setLocalFrom(value?.from || '')
    setLocalTo(value?.to || '')
  }, [value])

  const open = Boolean(anchorEl)
  const display = localFrom && localTo ? `${localFrom} - ${localTo}` : ''

  return (
    <>
      <GlobalTextField
        inputRef={anchorRef}
        label={label}
        value={display}
        onClick={e => setAnchorEl(e.currentTarget)}
        size='small'
        placeholder='Select range'
        sx={{ width: 320 }}
        InputProps={{
          endAdornment: (
            <InputAdornment position='end'>
              <svg width='14' height='14' viewBox='0 0 24 24'><path fill='currentColor' d='M7 10h5v5H7z' /></svg>
            </InputAdornment>
          )
        }}
        readOnly
      />

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        PaperProps={{ sx: { p: 2, minWidth: 340 } }}
      >
        <Typography sx={{ mb: 1, fontWeight: 600 }}>Select Date Range</Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            type='date'
            label='From'
            value={localFrom}
            onChange={e => setLocalFrom(e.target.value)}
            size='small'
            sx={{ width: '50%' }}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            type='date'
            label='To'
            value={localTo}
            onChange={e => setLocalTo(e.target.value)}
            size='small'
            sx={{ width: '50%' }}
            InputLabelProps={{ shrink: true }}
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            onClick={() => {
              setLocalFrom('')
              setLocalTo('')
              onChange({ from: '', to: '' })
              setAnchorEl(null)
            }}
            size='small'
          >
            Clear
          </Button>
          <Button
            variant='contained'
            onClick={() => {
              onChange({ from: localFrom, to: localTo })
              setAnchorEl(null)
            }}
            size='small'
          >
            Apply
          </Button>
        </Box>
      </Popover>
    </>
  )
}

export default function ProductivityFinderPage() {
  // master (dummy) rows
  const [master] = useState(() => makeRows(BASE_EMPLOYEES, 2)) // multiplier 2 to 20 rows
  const [rows, setRows] = useState([])
  const [rowCount, setRowCount] = useState(master.length)

  // UI state
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [searchText, setSearchText] = useState('')
  const [dateRange, setDateRange] = useState({ from: '', to: '' }) // managed by RangePickerSingle
  const [loading, setLoading] = useState(false)
  const [exportAnchorEl, setExportAnchorEl] = useState(null)

  // sorting is not added to reduce complexity — you can add later using tanstack
  // Refresh behavior
  const loadData = () => {
    setLoading(true)
    try {
      // start with master
      let filtered = [...master]

      // apply dateRange filter here if your data had dates (dummy has none).
      // For demo we won't filter by dateRange since dataset doesn't include service dates.
      // But we keep the UI and hooking place for when API exists.

      // apply search
      if (searchText && searchText.trim()) {
        const q = searchText.trim().toLowerCase()
        filtered = filtered.filter(r => r.employee.toLowerCase().includes(q))
      }

      // compute totals row later from filtered (entire filtered set)
      // sort (latest first by id)
      filtered.sort((a, b) => b.id - a.id)

      // pagination
      const start = pagination.pageIndex * pagination.pageSize
      const end = start + pagination.pageSize
      const page = filtered.slice(start, end).map((r, idx) => ({ ...r, sno: start + idx + 1 }))

      setRows(page)
      setRowCount(filtered.length)
    } finally {
      setTimeout(() => setLoading(false), 180)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.pageIndex, pagination.pageSize, searchText, dateRange])

  // Compute totals (from the entire filtered data set, not just page)
  const totals = useMemo(() => {
    // re-build filtered for totals
    let filtered = [...master]
    if (searchText && searchText.trim()) {
      const q = searchText.trim().toLowerCase()
      filtered = filtered.filter(r => r.employee.toLowerCase().includes(q))
    }

    // totals accumulators
    const acc = {
      comp_morn: 0,
      comp_day: 0,
      comp_night: 0,
      comp_sub: 0,
      pend_morn: 0,
      pend_day: 0,
      pend_night: 0,
      pend_sub: 0,
      grand_total: 0
    }

    filtered.forEach(r => {
      const cm = Number(r.completed.morn || 0)
      const cd = Number(r.completed.day || 0)
      const cn = Number(r.completed.night || 0)
      const pm = Number(r.pending.morn || 0)
      const pd = Number(r.pending.day || 0)
      const pn = Number(r.pending.night || 0)
      const comp_sub = cm + cd + cn
      const pend_sub = pm + pd + pn
      const total = comp_sub + pend_sub

      acc.comp_morn += cm
      acc.comp_day += cd
      acc.comp_night += cn
      acc.comp_sub += comp_sub
      acc.pend_morn += pm
      acc.pend_day += pd
      acc.pend_night += pn
      acc.pend_sub += pend_sub
      acc.grand_total += total
    })

    return acc
  }, [master, searchText])

  const exportCSV = () => {
    const headers = [
      'ID',
      'Employee',
      'COMP-MORN',
      'COMP-DAY',
      'COMP-NIGHT',
      'COMP-SUBTOTAL',
      'PEND-MORN',
      'PEND-DAY',
      'PEND-NIGHT',
      'PEND-SUBTOTAL',
      'TOTAL'
    ]
    const csv = [
      headers.join(','),
      ...(
        // use full filtered set for CSV
        (function () {
          let filtered = [...master]
          if (searchText && searchText.trim()) {
            const q = searchText.trim().toLowerCase()
            filtered = filtered.filter(r => r.employee.toLowerCase().includes(q))
          }
          return filtered.map(r => {
            const comp_sub = (r.completed.morn || 0) + (r.completed.day || 0) + (r.completed.night || 0)
            const pend_sub = (r.pending.morn || 0) + (r.pending.day || 0) + (r.pending.night || 0)
            const tot = comp_sub + pend_sub
            return [
              r.id,
              `"${r.employee}"`,
              r.completed.morn || 0,
              r.completed.day || 0,
              r.completed.night || 0,
              comp_sub,
              r.pending.morn || 0,
              r.pending.day || 0,
              r.pending.night || 0,
              pend_sub,
              tot
            ].join(',')
          })
        })()
      )
    ].join('\n')

    const link = document.createElement('a')
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    link.download = 'productivity_summary.csv'
    link.click()
    showToast('success', 'CSV downloaded (UI only)')
    setExportAnchorEl(null)
  }

  const exportPrint = () => {
    const w = window.open('', '_blank')
    const html = `
      <html><head><title>Productivity Summary</title>
      <style>body{font-family:Arial;padding:16px}table{border-collapse:collapse;width:100%}th,td{padding:8px;border:1px solid #e6e6e6;text-align:left}</style>
      </head><body>
      <h3>Productivity Summary</h3>
      <table>
        <thead>
          <tr>
            <th rowspan="2">ID</th>
            <th rowspan="2">Employee</th>
            <th colspan="4">COMPLETED</th>
            <th colspan="4">PENDING</th>
            <th rowspan="2">TOTAL</th>
          </tr>
          <tr>
            <th>MORN</th><th>DAY</th><th>NIGHT</th><th>SUBTOTAL</th>
            <th>MORN</th><th>DAY</th><th>NIGHT</th><th>SUBTOTAL</th>
          </tr>
        </thead>
        <tbody>
        ${
          master.map(r => {
            const comp_sub = (r.completed.morn||0) + (r.completed.day||0) + (r.completed.night||0)
            const pend_sub = (r.pending.morn||0) + (r.pending.day||0) + (r.pending.night||0)
            const tot = comp_sub + pend_sub
            return `<tr>
              <td>${r.id}</td><td>${r.employee}</td>
              <td>${fmt(r.completed.morn)}</td><td>${fmt(r.completed.day)}</td><td>${fmt(r.completed.night)}</td><td>${fmt(comp_sub)}</td>
              <td>${fmt(r.pending.morn)}</td><td>${fmt(r.pending.day)}</td><td>${fmt(r.pending.night)}</td><td>${fmt(pend_sub)}</td>
              <td>${fmt(tot)}</td>
            </tr>`
          }).join('')
        }
        </tbody>
      </table>
      </body></html>
    `
    w.document.write(html)
    w.document.close()
    w.print()
    setExportAnchorEl(null)
  }

  // Render
  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link href='/'>Dashboard</Link>
        <Typography>Productivity Summary</Typography>
      </Breadcrumbs>

      <Card sx={{ p: 3 }}>
        {/* Filters box - date range & refresh */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <RangePickerSingle
              value={dateRange}
              onChange={v => {
                setDateRange(v)
                setPagination(p => ({ ...p, pageIndex: 0 }))
              }}
            />
            <GlobalButton
              variant='contained'
              color='primary'
              startIcon={
                <RefreshIcon
                  sx={{
                    animation: loading ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' }
                    }
                  }}
                />
              }
              disabled={loading}
              onClick={() => {
                setPagination(p => ({ ...p, pageIndex: 0 }))
                loadData()
              }}
              sx={{ textTransform: 'none', height: 36 }}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </GlobalButton>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Controls: entries + export + search */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            <FormControl size='small' sx={{ width: 120 }}>
              <Select
                value={pagination.pageSize}
                onChange={e => setPagination(p => ({ ...p, pageSize: Number(e.target.value), pageIndex: 0 }))}
              >
                {[10, 25, 50, 100].map(n => (
                  <MenuItem key={n} value={n}>
                    {n} entries
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <GlobalButton
              variant='outlined'
              color='secondary'
              endIcon={<ArrowDropDownIcon />}
              onClick={e => setExportAnchorEl(e.currentTarget)}
              disabled={!rows.length}
            >
              Export
            </GlobalButton>

            <Menu open={Boolean(exportAnchorEl)} anchorEl={exportAnchorEl} onClose={() => setExportAnchorEl(null)}>
              <MenuItem onClick={exportPrint}><PrintIcon sx={{ mr: 1 }} /> Print</MenuItem>
              <MenuItem onClick={exportCSV}><FileDownloadIcon sx={{ mr: 1 }} /> CSV</MenuItem>
            </Menu>
          </Box>

          <DebouncedInput
            value={searchText}
            onChange={v => {
              setSearchText(String(v))
              setPagination(p => ({ ...p, pageIndex: 0 }))
            }}
            placeholder='Search employee...'
            sx={{ width: 300 }}
            size='small'
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
        </Box>

        {/* Table (grouped header with colored blocks) */}
        <div className='overflow-x-auto'>
          <table className={styles.table} style={{ minWidth: 1100 }}>
            <thead>
              <tr>
                <th rowSpan={2} style={{ width: 60 }}>ID</th>
                <th rowSpan={2} style={{ width: 180 }}>Employee</th>

                <th colSpan={4} style={{ background: '#9edc9e', textAlign: 'center' }}>
                  <strong>COMPLETED</strong>
                </th>

                <th colSpan={4} style={{ background: '#ffe85c', textAlign: 'center' }}>
                  <strong>PENDING</strong>
                </th>

                <th rowSpan={2} style={{ background: '#1031ff', color: '#fff', textAlign: 'center', width: 120 }}>
                  <strong>TOTAL</strong>
                </th>
              </tr>

              <tr>
                {/* Completed sub-headers */}
                <th style={{ background: '#bff0b5', textAlign: 'center' }}>MORN</th>
                <th style={{ background: '#bff0b5', textAlign: 'center' }}>DAY</th>
                <th style={{ background: '#bff0b5', textAlign: 'center' }}>NIGHT</th>
                <th style={{ background: '#1b7c1b', color: '#fff', textAlign: 'center' }}>SUBTOTAL</th>

                {/* Pending sub-headers */}
                <th style={{ background: '#fff06b', textAlign: 'center' }}>MORN</th>
                <th style={{ background: '#fff06b', textAlign: 'center' }}>DAY</th>
                <th style={{ background: '#fff06b', textAlign: 'center' }}>NIGHT</th>
                <th style={{ background: '#f6e500', color: '#000', textAlign: 'center' }}>SUBTOTAL</th>
              </tr>
            </thead>

            <tbody>
              {rows.length ? (
                rows.map(r => {
                  const comp_sub = (r.completed.morn || 0) + (r.completed.day || 0) + (r.completed.night || 0)
                  const pend_sub = (r.pending.morn || 0) + (r.pending.day || 0) + (r.pending.night || 0)
                  const tot = comp_sub + pend_sub
                  return (
                    <tr key={r.id}>
                      <td>{r.sno}</td>
                      <td>{r.employee}</td>

                      <td style={{ textAlign: 'right' }}>{fmt(r.completed.morn)}</td>
                      <td style={{ textAlign: 'right' }}>{fmt(r.completed.day)}</td>
                      <td style={{ textAlign: 'right' }}>{fmt(r.completed.night)}</td>
                      <td style={{ textAlign: 'right', background: '#0a6b0a', color: '#fff' }}>{fmt(comp_sub)}</td>

                      <td style={{ textAlign: 'right' }}>{fmt(r.pending.morn)}</td>
                      <td style={{ textAlign: 'right' }}>{fmt(r.pending.day)}</td>
                      <td style={{ textAlign: 'right' }}>{fmt(r.pending.night)}</td>
                      <td style={{ textAlign: 'right', background: '#f6e500' }}>{fmt(pend_sub)}</td>

                      <td style={{ textAlign: 'right', background: '#1031ff', color: '#fff' }}>{fmt(tot)}</td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: 20 }}>
                    {loading ? <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center' }}><ProgressCircularCustomization /><Typography>Loading...</Typography></Box> : 'No results found'}
                  </td>
                </tr>
              )}
            </tbody>

            {/* TOTAL row */}
            <tfoot>
              <tr>
                <td></td>
                <td style={{ background: '#e9eef0', fontWeight: 700, textAlign: 'center' }}>Total</td>

                <td style={{ background: '#0f8f0f', color: '#fff', textAlign: 'right' }}>{fmt(totals.comp_morn)}</td>
                <td style={{ background: '#0f8f0f', color: '#fff', textAlign: 'right' }}>{fmt(totals.comp_day)}</td>
                <td style={{ background: '#0f8f0f', color: '#fff', textAlign: 'right' }}>{fmt(totals.comp_night)}</td>
                <td style={{ background: '#0b610b', color: '#fff', textAlign: 'right' }}>{fmt(totals.comp_sub)}</td>

                <td style={{ background: '#f3e84f', textAlign: 'right' }}>{fmt(totals.pend_morn)}</td>
                <td style={{ background: '#f3e84f', textAlign: 'right' }}>{fmt(totals.pend_day)}</td>
                <td style={{ background: '#f3e84f', textAlign: 'right' }}>{fmt(totals.pend_night)}</td>
                <td style={{ background: '#f1d800', textAlign: 'right' }}>{fmt(totals.pend_sub)}</td>

                <td style={{ background: '#1031ff', color: '#fff', textAlign: 'right' }}>{fmt(totals.grand_total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* bottom pagination text & component */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 3 }}>
          <TablePaginationComponent totalCount={rowCount} pagination={pagination} setPagination={setPagination} />
        </Box>
      </Card>
    </Box>
  )
}
