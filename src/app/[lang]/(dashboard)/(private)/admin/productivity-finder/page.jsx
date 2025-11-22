'use client'

import { useEffect, useMemo, useState } from 'react'
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
import { getProductivityList } from '@/api/productivity/list'

// Debounce
const DebouncedInput = ({ value: init, onChange, debounce = 400, ...props }) => {
  const [value, setValue] = useState(init)
  useEffect(() => setValue(init), [init])
  useEffect(() => {
    const t = setTimeout(() => onChange(value), debounce)
    return () => clearTimeout(t)
  }, [value])
  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

// number formatting
const fmt = n =>
  Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

export default function ProductivityReportPage() {
  const [allRows, setAllRows] = useState([])
  const [rows, setRows] = useState([])
  const [rowCount, setRowCount] = useState(0)

  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [loading, setLoading] = useState(false)
  const [exportAnchorEl, setExportAnchorEl] = useState(null)

  // -------------------------
  // FETCH API DATA
  // -------------------------
  const fetchProductivity = async () => {
    setLoading(true)

    try {
      const res = await getProductivityList()

      if (res?.status === 'success') {
        let list = Array.isArray(res.data) ? res.data : []

        // Remove empty placeholder
        list = list.filter(item => item.employee)

        const normalized = list.map((item, i) => ({
          id: i + 1,
          sno: i + 1,
          employee: item.employee,
          comp_morn: item.completed_morn,
          comp_day: item.completed_day,
          comp_night: item.completed_night,
          comp_sub: item.completed_subtotal,

          pend_morn: item.pending_morn,
          pend_day: item.pending_day,
          pend_night: item.pending_night,
          pend_sub: item.pending_subtotal,

          total: item.total
        }))

        setAllRows(normalized)
        setRowCount(normalized.length)
        setPagination(prev => ({ ...prev, pageIndex: 0 }))
      } else {
        setAllRows([])
        setRowCount(0)
      }
    } catch (err) {
      showToast('error', 'Error loading productivity report')
      setAllRows([])
      setRowCount(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProductivity()
  }, [])

  // -------------------------
  // FILTER + PAGINATION
  // -------------------------
  const loadData = () => {
    let data = [...allRows]

    if (searchText) {
      const q = searchText.toLowerCase()
      data = data.filter(r => r.employee?.toLowerCase().includes(q))
    }

    data.sort((a, b) => b.id - a.id)

    const start = pagination.pageIndex * pagination.pageSize
    const end = start + pagination.pageSize

    const paginated = data.slice(start, end)
    setRows(paginated)
    setRowCount(data.length)
  }

  useEffect(() => {
    loadData()
  }, [allRows, pagination.pageIndex, pagination.pageSize, searchText])

  // -------------------------
  // EXPORT CSV
  // -------------------------
  const exportCSV = () => {
    const headers = [
      'Employee',
      'COMP Morn',
      'COMP Day',
      'COMP Night',
      'COMP Subtotal',
      'PEND Morn',
      'PEND Day',
      'PEND Night',
      'PEND Subtotal',
      'TOTAL'
    ]

    const csv = [
      headers.join(','),
      ...rows.map(r =>
        [
          r.employee,
          r.comp_morn,
          r.comp_day,
          r.comp_night,
          r.comp_sub,
          r.pend_morn,
          r.pend_day,
          r.pend_night,
          r.pend_sub,
          r.total
        ].join(',')
      )
    ].join('\n')

    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = 'productivity_report.csv'
    a.click()
    setExportAnchorEl(null)
  }

  // -------------------------
  // EXPORT PRINT
  // -------------------------
  const exportPrint = () => {
    const w = window.open('', '_blank')
    const html = `
      <html><body>
      <h2>Productivity Report</h2>
      <table border="1" style="width:100%;border-collapse:collapse;">
        <tr>
          <th>Employee</th>
          <th>COMP MORN</th><th>COMP DAY</th><th>COMP NIGHT</th><th>COMP SUBTOTAL</th>
          <th>PEND MORN</th><th>PEND DAY</th><th>PEND NIGHT</th><th>PEND SUBTOTAL</th>
          <th>TOTAL</th>
        </tr>
        ${rows
          .map(
            r => `
          <tr>
            <td>${r.employee}</td>
            <td>${fmt(r.comp_morn)}</td>
            <td>${fmt(r.comp_day)}</td>
            <td>${fmt(r.comp_night)}</td>
            <td>${fmt(r.comp_sub)}</td>
            <td>${fmt(r.pend_morn)}</td>
            <td>${fmt(r.pend_day)}</td>
            <td>${fmt(r.pend_night)}</td>
            <td>${fmt(r.pend_sub)}</td>
            <td>${fmt(r.total)}</td>
          </tr>
        `
          )
          .join('')}
      </table>
      </body></html>
    `
    w.document.write(html)
    w.document.close()
    w.print()
    setExportAnchorEl(null)
  }

  // -------------------------
  // COMPUTE TOTALS
  // -------------------------
  const totals = useMemo(() => {
    const acc = {
      comp_morn: 0,
      comp_day: 0,
      comp_night: 0,
      comp_sub: 0,
      pend_morn: 0,
      pend_day: 0,
      pend_night: 0,
      pend_sub: 0,
      total: 0
    }

    allRows.forEach(r => {
      acc.comp_morn += r.comp_morn
      acc.comp_day += r.comp_day
      acc.comp_night += r.comp_night
      acc.comp_sub += r.comp_sub

      acc.pend_morn += r.pend_morn
      acc.pend_day += r.pend_day
      acc.pend_night += r.pend_night
      acc.pend_sub += r.pend_sub

      acc.total += r.total
    })

    return acc
  }, [allRows])

  // -------------------------
  // RENDER UI
  // -------------------------
  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link href='/'>Dashboard</Link>
        <Typography>Productivity Report</Typography>
      </Breadcrumbs>

      <Card sx={{ p: 3 }}>
        <CardHeader
          title='Productivity Summary'
          action={
            <GlobalButton
              variant='contained'
              color='primary'
              startIcon={
                <RefreshIcon
                  sx={{
                    animation: loading ? 'spin 1s linear infinite' : 'none'
                  }}
                />
              }
              onClick={() => fetchProductivity()}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </GlobalButton>
          }
        />

        <Divider sx={{ mb: 3 }} />

        {/* Top Filters */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end', // ⭐ FIX: Align by bottom (input line)
            mb: 4,
            gap: 2,
            flexWrap: 'nowrap'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-end', // ⭐ FIX: Align bottom of all fields
              gap: 2,
              flexWrap: 'nowrap'
            }}
          >
            <FormControl size='small' sx={{ width: 120 }}>
              <Select
                value={pagination.pageSize}
                onChange={e =>
                  setPagination({
                    pageIndex: 0,
                    pageSize: Number(e.target.value)
                  })
                }
              >
                {[10, 25, 50, 100].map(n => (
                  <MenuItem key={n} value={n}>
                    {n} entries
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <DebouncedInput
              value={searchText}
              onChange={v => setSearchText(v)}
              placeholder='Search employee...'
              size='small'
              sx={{ width: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Box>

          <GlobalButton
            variant='outlined'
            color='secondary'
            endIcon={<ArrowDropDownIcon />}
            onClick={e => setExportAnchorEl(e.currentTarget)}
          >
            Export
          </GlobalButton>

          <Menu anchorEl={exportAnchorEl} open={Boolean(exportAnchorEl)} onClose={() => setExportAnchorEl(null)}>
            <MenuItem onClick={exportPrint}>
              <PrintIcon sx={{ mr: 1 }} /> Print
            </MenuItem>
            <MenuItem onClick={exportCSV}>
              <FileDownloadIcon sx={{ mr: 1 }} /> CSV
            </MenuItem>
          </Menu>
        </Box>

        {/* TABLE */}
        <div className='overflow-x-auto'>
          <table className={styles.table} style={{ minWidth: 1100 }}>
            <thead>
              <tr>
                <th rowSpan={2}>Employee</th>
                <th colSpan={4} style={{ background: '#9edc9e' }}>
                  COMPLETED
                </th>
                <th colSpan={4} style={{ background: '#ffe85c' }}>
                  PENDING
                </th>
                <th rowSpan={2} style={{ background: '#1031ff', color: '#fff' }}>
                  TOTAL
                </th>
              </tr>

              <tr>
                <th>MORN</th>
                <th>DAY</th>
                <th>NIGHT</th>
                <th>SUBTOTAL</th>
                <th>MORN</th>
                <th>DAY</th>
                <th>NIGHT</th>
                <th>SUBTOTAL</th>
              </tr>
            </thead>

            <tbody>
              {rows.length ? (
                rows.map(r => (
                  <tr key={r.id}>
                    <td>{r.employee}</td>

                    <td style={{ textAlign: 'right' }}>{fmt(r.comp_morn)}</td>
                    <td style={{ textAlign: 'right' }}>{fmt(r.comp_day)}</td>
                    <td style={{ textAlign: 'right' }}>{fmt(r.comp_night)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(r.comp_sub)}</td>

                    <td style={{ textAlign: 'right' }}>{fmt(r.pend_morn)}</td>
                    <td style={{ textAlign: 'right' }}>{fmt(r.pend_day)}</td>
                    <td style={{ textAlign: 'right' }}>{fmt(r.pend_night)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(r.pend_sub)}</td>

                    <td style={{ textAlign: 'right', background: '#1031ff', color: '#fff' }}>{fmt(r.total)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: 20 }}>
                    {loading ? <ProgressCircularCustomization /> : 'No results found'}
                  </td>
                </tr>
              )}
            </tbody>

            {/* TOTAL ROW */}
            <tfoot>
              <tr>
                <td style={{ fontWeight: 700 }}>TOTAL</td>

                <td style={{ textAlign: 'right' }}>{fmt(totals.comp_morn)}</td>
                <td style={{ textAlign: 'right' }}>{fmt(totals.comp_day)}</td>
                <td style={{ textAlign: 'right' }}>{fmt(totals.comp_night)}</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(totals.comp_sub)}</td>

                <td style={{ textAlign: 'right' }}>{fmt(totals.pend_morn)}</td>
                <td style={{ textAlign: 'right' }}>{fmt(totals.pend_day)}</td>
                <td style={{ textAlign: 'right' }}>{fmt(totals.pend_night)}</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(totals.pend_sub)}</td>

                <td style={{ textAlign: 'right', background: '#1031ff', color: '#fff', fontWeight: 700 }}>
                  {fmt(totals.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <Box sx={{ mt: 3 }}>
          <TablePaginationComponent totalCount={rowCount} pagination={pagination} setPagination={setPagination} />
        </Box>
      </Card>
    </Box>
  )
}
