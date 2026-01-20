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

import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

import { getProductivityList } from '@/api/report_group/productivity/list'

import RefreshIcon from '@mui/icons-material/Refresh'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import PrintIcon from '@mui/icons-material/Print'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import SearchIcon from '@mui/icons-material/Search'
import TableChartIcon from '@mui/icons-material/TableChart'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import FileCopyIcon from '@mui/icons-material/FileCopy'

import { showToast } from '@/components/common/Toasts'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import StickyListLayout from '@/components/common/StickyListLayout'
import GlobalButton from '@/components/common/GlobalButton'
import PermissionGuard from '@/components/auth/PermissionGuard'

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

// Format number
const fmt = n =>
  Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

const ProductivityReportPage = () => {
  const [allRows, setAllRows] = useState([])
  const [rows, setRows] = useState([])
  const [rowCount, setRowCount] = useState(0)

  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [loading, setLoading] = useState(false)
  const [exportAnchorEl, setExportAnchorEl] = useState(null)

  // Export Functions
  const exportOpen = Boolean(exportAnchorEl)

  const exportCSV = () => {
    const headers = [
      'S.No',
      'Employee',
      'Completed Morn',
      'Completed Day',
      'Completed Night',
      'Completed Subtotal',
      'Pending Morn',
      'Pending Day',
      'Pending Night',
      'Pending Subtotal',
      'Total'
    ]

    const csv = [
      headers.join(','),
      ...allRows.map((r, i) =>
        [
          i + 1,
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

    const link = document.createElement('a')
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    link.download = 'ProductivityReport.csv'
    link.click()

    showToast('success', 'CSV downloaded')
  }

  const exportPrint = () => {
    const w = window.open('', '_blank')
    const html = `
      <html><head><title>Productivity Report</title><style>
      body{font-family:Arial;padding:24px;}
      table{width:100%;border-collapse:collapse;}
      th,td{border:1px solid #ccc;padding:8px;text-align:left;}
      th{background:#f4f4f4;}
      </style></head><body>
      <h2>Productivity Report</h2>
      <table><thead><tr>
      <th>S.No</th><th>Employee</th><th>Comp Morn</th><th>Comp Day</th><th>Comp Night</th><th>Comp Subtotal</th>
      <th>Pend Morn</th><th>Pend Day</th><th>Pend Night</th><th>Pend Subtotal</th><th>Total</th>
      </tr></thead><tbody>
      ${allRows
        .map(
          (r, i) =>
            `<tr><td>${i + 1}</td><td>${r.employee}</td><td>${fmt(r.comp_morn)}</td><td>${fmt(r.comp_day)}</td><td>${fmt(r.comp_night)}</td><td>${fmt(r.comp_sub)}</td><td>${fmt(r.pend_morn)}</td><td>${fmt(r.pend_day)}</td><td>${fmt(r.pend_night)}</td><td>${fmt(r.pend_sub)}</td><td>${fmt(r.total)}</td></tr>`
        )
        .join('')}
      </tbody></table></body></html>`
    w.document.write(html)
    w.document.close()
    w.print()
  }

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      allRows.map((r, i) => ({
        'S.No': i + 1,
        Employee: r.employee,
        'Completed Morn': r.comp_morn,
        'Completed Day': r.comp_day,
        'Completed Night': r.comp_night,
        'Completed Subtotal': r.comp_sub,
        'Pending Morn': r.pend_morn,
        'Pending Day': r.pend_day,
        'Pending Night': r.pend_night,
        'Pending Subtotal': r.pend_sub,
        Total: r.total
      }))
    )
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Productivity')
    XLSX.writeFile(wb, 'ProductivityReport.xlsx')
    showToast('success', 'Excel downloaded')
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.text('Productivity Report', 14, 20)
    doc.autoTable({
      startY: 30,
      head: [
        [
          'S.No',
          'Employee',
          'Comp Morn',
          'Comp Day',
          'Comp Night',
          'Comp Sub',
          'Pend Morn',
          'Pend Day',
          'Pend Night',
          'Pend Sub',
          'Total'
        ]
      ],
      body: allRows.map((r, i) => [
        i + 1,
        r.employee,
        fmt(r.comp_morn),
        fmt(r.comp_day),
        fmt(r.comp_night),
        fmt(r.comp_sub),
        fmt(r.pend_morn),
        fmt(r.pend_day),
        fmt(r.pend_night),
        fmt(r.pend_sub),
        fmt(r.total)
      ])
    })
    doc.save('ProductivityReport.pdf')
    showToast('success', 'PDF downloaded')
  }

  const exportCopy = () => {
    const headers = [
      'S.No',
      'Employee',
      'Completed Morn',
      'Completed Day',
      'Completed Night',
      'Completed Subtotal',
      'Pending Morn',
      'Pending Day',
      'Pending Night',
      'Pending Subtotal',
      'Total'
    ]

    const tsv = [
      headers.join('\t'),
      ...allRows.map((r, i) =>
        [
          i + 1,
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
        ].join('\t')
      )
    ].join('\n')

    navigator.clipboard
      .writeText(tsv)
      .then(() => {
        showToast('success', 'Copied to clipboard')
      })
      .catch(err => {
        console.error('Failed to copy: ', err)
        showToast('error', 'Failed to copy')
      })
  }

  // Fetch data
  const fetchProductivity = async () => {
    setLoading(true)
    try {
      const res = await getProductivityList()
      if (res?.status !== 'success') throw new Error(res?.message || 'Failed')

      const list = Array.isArray(res.data) ? res.data : []

      const normalized = list.map((item, i) => ({
        id: i + 1,
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
    } catch (err) {
      console.error(err)
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

  // Filter + Paginate
  useEffect(() => {
    let data = [...allRows]
    if (searchText.trim()) {
      const q = searchText.toLowerCase()
      data = data.filter(r => r.employee?.toLowerCase().includes(q))
    }

    const start = pagination.pageIndex * pagination.pageSize
    const end = start + pagination.pageSize

    setRows(data.slice(start, end))
    setRowCount(data.length)
  }, [allRows, pagination.pageIndex, pagination.pageSize, searchText])

  // Totals
  const totals = useMemo(() => {
    return allRows.reduce(
      (acc, r) => {
        acc.comp_morn += Number(r.comp_morn || 0)
        acc.comp_day += Number(r.comp_day || 0)
        acc.comp_night += Number(r.comp_night || 0)
        acc.comp_sub += Number(r.comp_sub || 0)
        acc.pend_morn += Number(r.pend_morn || 0)
        acc.pend_day += Number(r.pend_day || 0)
        acc.pend_night += Number(r.pend_night || 0)
        acc.pend_sub += Number(r.pend_sub || 0)
        acc.total += Number(r.total || 0)
        return acc
      },
      {
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
    )
  }, [allRows])

  return (
    <StickyListLayout
      header={
        <Box sx={{ mb: 2 }}>
          <Breadcrumbs sx={{ mb: 2 }}>
            <Link href='/'>Dashboard</Link>
            <Typography color='text.primary'>Productivity Report</Typography>
          </Breadcrumbs>
        </Box>
      }
    >
      <Card sx={{ display: 'flex', flexDirection: 'column', maxHeight: '100%', minHeight: 0, position: 'relative' }}>
        <CardHeader
          title={
            <Box display='flex' alignItems='center' gap={2}>
              <Typography variant='h5' sx={{ fontWeight: 600 }}>
                Productivity Summary
              </Typography>

              <GlobalButton
                onClick={fetchProductivity}
                variant='contained'
                color='primary'
                startIcon={<RefreshIcon />}
                disabled={loading}
                sx={{ textTransform: 'none', height: 36 }}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </GlobalButton>
            </Box>
          }
          action={
            <Box display='flex' alignItems='center' gap={2}>
              <GlobalButton
                color='secondary'
                endIcon={<ArrowDropDownIcon />}
                onClick={e => setExportAnchorEl(e.currentTarget)}
                sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
              >
                Export
              </GlobalButton>
              <Menu anchorEl={exportAnchorEl} open={exportOpen} onClose={() => setExportAnchorEl(null)}>
                <MenuItem
                  onClick={() => {
                    setExportAnchorEl(null)
                    exportPrint()
                  }}
                >
                  <PrintIcon fontSize='small' sx={{ mr: 1 }} /> Print
                </MenuItem>

                <MenuItem
                  onClick={() => {
                    setExportAnchorEl(null)
                    exportCSV()
                  }}
                >
                  <FileDownloadIcon fontSize='small' sx={{ mr: 1 }} /> CSV
                </MenuItem>

                <MenuItem
                  onClick={() => {
                    setExportAnchorEl(null)
                    exportExcel()
                  }}
                >
                  <TableChartIcon fontSize='small' sx={{ mr: 1 }} /> Excel
                </MenuItem>

                <MenuItem
                  onClick={() => {
                    setExportAnchorEl(null)
                    exportPDF()
                  }}
                >
                  <PictureAsPdfIcon fontSize='small' sx={{ mr: 1 }} /> PDF
                </MenuItem>

                <MenuItem
                  onClick={() => {
                    setExportAnchorEl(null)
                    exportCopy()
                  }}
                >
                  <FileCopyIcon fontSize='small' sx={{ mr: 1 }} /> Copy
                </MenuItem>
              </Menu>
            </Box>
          }
          sx={{
            px: 10,
            pt: 5,
            pb: 1.5,
            '& .MuiCardHeader-action': {
              alignSelf: 'center'
            }
          }}
        />

        <Divider />

        <Box sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Filters */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 4,
              gap: 2,
              flexShrink: 0
            }}
          >
            {/* LEFT SIDE — ENTRIES */}
            <FormControl size='small' sx={{ width: 150 }}>
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

            {/* RIGHT SIDE — SEARCH */}
            <DebouncedInput
              value={searchText}
              onChange={v => {
                setSearchText(v)
                setPagination(p => ({ ...p, pageIndex: 0 }))
              }}
              placeholder='Search employee...'
              size='small'
              sx={{ width: 350 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Box>

          {/* Table with Sticky Top Header + Sticky Bottom Total */}
          <Box sx={{ flexGrow: 1, overflow: 'auto', position: 'relative', maxHeight: 'calc(100vh - 280px)' }}>
            <StickyTableWrapper rowCount={rows.length}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  minWidth: 1100,
                  fontSize: '0.95rem',
                  tableLayout: 'fixed'
                }}
              >
                {/* Sticky Top Header */}
                <thead style={{ position: 'sticky', top: 0, zIndex: 20, backgroundColor: '#fff' }}>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th rowSpan={2} style={{ padding: '12px', border: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>
                      S.No
                    </th>
                    <th rowSpan={2} style={{ padding: '12px', border: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>
                      Employee
                    </th>
                    <th colSpan={4} style={{ backgroundColor: '#e8f5e9', padding: '8px', border: '1px solid #ddd' }}>
                      COMPLETED
                    </th>
                    <th colSpan={4} style={{ backgroundColor: '#fffde7', padding: '8px', border: '1px solid #ddd' }}>
                      PENDING
                    </th>
                    <th
                      rowSpan={2}
                      style={{ backgroundColor: '#1565c0', color: 'white', padding: '12px', border: '1px solid #ddd' }}
                    >
                      TOTAL
                    </th>
                  </tr>
                  <tr>
                    {['MORN', 'DAY', 'NIGHT', 'SUBTOTAL'].map((t, i) => (
                      <th
                        key={t}
                        style={{
                          backgroundColor: i === 3 ? '#c8e6c9' : '#e8f5e9',
                          padding: '8px',
                          border: '1px solid #ddd',
                          fontWeight: i === 3 ? 700 : 500
                        }}
                      >
                        {t}
                      </th>
                    ))}
                    {['MORN', 'DAY', 'NIGHT', 'SUBTOTAL'].map((t, i) => (
                      <th
                        key={t}
                        style={{
                          backgroundColor: i === 3 ? '#fff59d' : '#fffde7',
                          padding: '8px',
                          border: '1px solid #ddd',
                          fontWeight: i === 3 ? 700 : 500
                        }}
                      >
                        {t}
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Body */}
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={11} style={{ padding: 30, textAlign: 'center', color: '#777' }}>
                        {loading ? 'Loading...' : 'No records found'}
                      </td>
                    </tr>
                  ) : (
                    rows.map((r, index) => (
                      <tr key={r.id}>
                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                          {pagination.pageIndex * pagination.pageSize + index + 1}
                        </td>
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{r.employee}</td>

                        <td
                          style={{
                            textAlign: 'right',
                            padding: '10px',
                            border: '1px solid #ddd',
                            backgroundColor: '#f1f8e9'
                          }}
                        >
                          {fmt(r.comp_morn)}
                        </td>
                        <td
                          style={{
                            textAlign: 'right',
                            padding: '10px',
                            border: '1px solid #ddd',
                            backgroundColor: '#f1f8e9'
                          }}
                        >
                          {fmt(r.comp_day)}
                        </td>
                        <td
                          style={{
                            textAlign: 'right',
                            padding: '10px',
                            border: '1px solid #ddd',
                            backgroundColor: '#f1f8e9'
                          }}
                        >
                          {fmt(r.comp_night)}
                        </td>
                        <td
                          style={{
                            textAlign: 'right',
                            padding: '10px',
                            border: '1px solid #ddd',
                            backgroundColor: '#c8e6c9',
                            fontWeight: 600
                          }}
                        >
                          {fmt(r.comp_sub)}
                        </td>

                        <td
                          style={{
                            textAlign: 'right',
                            padding: '10px',
                            border: '1px solid #ddd',
                            backgroundColor: '#fffde7'
                          }}
                        >
                          {fmt(r.pend_morn)}
                        </td>
                        <td
                          style={{
                            textAlign: 'right',
                            padding: '10px',
                            border: '1px solid #ddd',
                            backgroundColor: '#fffde7'
                          }}
                        >
                          {fmt(r.pend_day)}
                        </td>
                        <td
                          style={{
                            textAlign: 'right',
                            padding: '10px',
                            border: '1px solid #ddd',
                            backgroundColor: '#fffde7'
                          }}
                        >
                          {fmt(r.pend_night)}
                        </td>
                        <td
                          style={{
                            textAlign: 'right',
                            padding: '10px',
                            border: '1px solid #ddd',
                            backgroundColor: '#fff59d',
                            fontWeight: 600
                          }}
                        >
                          {fmt(r.pend_sub)}
                        </td>

                        <td
                          style={{
                            textAlign: 'right',
                            padding: '10px',
                            border: '1px solid #ddd',
                            backgroundColor: '#1565c0',
                            color: 'white',
                            fontWeight: 700
                          }}
                        >
                          {fmt(r.total)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {/* Sticky Bottom TOTAL Row */}
                <tfoot>
                  <tr
                    style={{
                      position: 'sticky',
                      bottom: 0,
                      zIndex: 10,
                      backgroundColor: '#f5f5f5',
                      fontWeight: 700
                    }}
                  >
                    <td colSpan={2} style={{ padding: '12px', border: '1px solid #ddd' }}>
                      TOTAL
                    </td>

                    <td
                      style={{
                        textAlign: 'right',
                        padding: '12px',
                        border: '1px solid #ddd',
                        backgroundColor: '#f1f8e9'
                      }}
                    >
                      {fmt(totals.comp_morn)}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        padding: '12px',
                        border: '1px solid #ddd',
                        backgroundColor: '#f1f8e9'
                      }}
                    >
                      {fmt(totals.comp_day)}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        padding: '12px',
                        border: '1px solid #ddd',
                        backgroundColor: '#f1f8e9'
                      }}
                    >
                      {fmt(totals.comp_night)}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        padding: '12px',
                        border: '1px solid #ddd',
                        backgroundColor: '#c8e6c9'
                      }}
                    >
                      {fmt(totals.comp_sub)}
                    </td>

                    <td
                      style={{
                        textAlign: 'right',
                        padding: '12px',
                        border: '1px solid #ddd',
                        backgroundColor: '#fffde7'
                      }}
                    >
                      {fmt(totals.pend_morn)}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        padding: '12px',
                        border: '1px solid #ddd',
                        backgroundColor: '#fffde7'
                      }}
                    >
                      {fmt(totals.pend_day)}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        padding: '12px',
                        border: '1px solid #ddd',
                        backgroundColor: '#fffde7'
                      }}
                    >
                      {fmt(totals.pend_night)}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        padding: '12px',
                        border: '1px solid #ddd',
                        backgroundColor: '#fff59d'
                      }}
                    >
                      {fmt(totals.pend_sub)}
                    </td>

                    <td
                      style={{
                        textAlign: 'right',
                        padding: '12px',
                        border: '1px solid #ddd',
                        backgroundColor: '#1565c0',
                        color: 'white'
                      }}
                    >
                      {fmt(totals.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </StickyTableWrapper>
          </Box>

          {/* Pagination */}
          <TablePaginationComponent totalCount={rowCount} pagination={pagination} setPagination={setPagination} />
        </Box>
      </Card>
    </StickyListLayout>
  )
}

// Wrapper for RBAC
export default function ProductivityReportPageWrapper() {
  return (
    <PermissionGuard permission='Productivity Finder'>
      <ProductivityReportPage />
    </PermissionGuard>
  )
}
