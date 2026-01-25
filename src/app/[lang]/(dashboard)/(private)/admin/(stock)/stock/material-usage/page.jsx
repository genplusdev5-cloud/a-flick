'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  Box,
  Button,
  Card,
  CardHeader,
  Typography,
  Divider,
  Checkbox,
  Pagination,
  InputAdornment,
  FormControl,
  Select,
  MenuItem,
  FormControlLabel,
  Chip
} from '@mui/material'

import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import StickyListLayout from '@/components/common/StickyListLayout'
import PermissionGuard from '@/components/auth/PermissionGuard'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import CustomTextField from '@core/components/mui/TextField'
import GlobalDateRange from '@/components/common/GlobalDateRange'

import { showToast } from '@/components/common/Toasts'

import { getPurchaseFilters } from '@/api/purchase/purchase_inward'
import { getAllEmployees } from '@/api/employee/getAllEmployees'
import { getCustomerList } from '@/api/customer_group/customer/list'
import { getSupplierList } from '@/api/stock/supplier/list'
import { getChemicalsList } from '@/api/master/chemicals/list'

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender
} from '@tanstack/react-table'

import classnames from 'classnames'
import styles from '@core/styles/table.module.css'
import ChevronRight from '@menu/svg/ChevronRight'

// ──────────────────────────────────────────────────────────────
// Debounced Input
// ──────────────────────────────────────────────────────────────
const DebouncedInput = ({ value: initialValue, onChange, debounce = 500, ...props }) => {
  const [value, setValue] = useState(initialValue)
  useEffect(() => setValue(initialValue), [initialValue])
  useEffect(() => {
    const t = setTimeout(() => onChange(value), debounce)
    return () => clearTimeout(t)
  }, [value])
  return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

const DUMMY_ROWS = [
  {
    id: 1,
    date: '2026-01-06',
    material: 'Samsung Galaxy A15',
    usedQty: 1,
    reference: 'Service Request',
    remarks: 'Installation'
  },
  {
    id: 2,
    date: '2026-01-05',
    material: 'iPhone 14',
    usedQty: 1,
    reference: 'Transfer Out',
    remarks: 'Branch Transfer'
  }
]

const MaterialUsagePageContent = () => {
  const [pageSize, setPageSize] = useState(25)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // -- UI FILTER STATES --
  const [uiEnableDateFilter, setUiEnableDateFilter] = useState(false)
  const [uiStartDate, setUiStartDate] = useState(new Date())
  const [uiEndDate, setUiEndDate] = useState(new Date())
  const [uiSearchText, setUiSearchText] = useState('')

  // -- APPLIED FILTER STATES --
  const [appliedFilters, setAppliedFilters] = useState({
    enableDateFilter: false,
    startDate: new Date(),
    endDate: new Date(),
    searchText: ''
  })

  // -- FILTER OPTIONS --
  const [originOptions, setOriginOptions] = useState([])
  const [selectedOrigin, setSelectedOrigin] = useState(null)

  const [employeeOptions, setEmployeeOptions] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState(null)

  const [customerOptions, setCustomerOptions] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  const [supplierOptions, setSupplierOptions] = useState([])
  const [selectedSupplier, setSelectedSupplier] = useState(null)

  const [chemicalOptions, setChemicalOptions] = useState([])
  const [selectedChemical, setSelectedChemical] = useState(null)

  const [sorting, setSorting] = useState([])
  const fileInputRef = useRef(null)

  const handleSampleDownload = () => {
    showToast('info', 'Downloading sample template...')
    // Logic for sample download
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = e => {
    const file = e.target.files?.[0]
    if (file) {
      showToast('info', `Importing ${file.name}...`)
      // Logic for file import
    }
  }

  const loadData = async (showToastMsg = false) => {
    setLoading(true)
    try {
      // In a real app, this would be an API call
      // const params = { page, page_size: pageSize, search: appliedFilters.searchText, ... }
      // const res = await getMaterialUsage(params)

      // Using dummy data for now
      let filtered = [...DUMMY_ROWS]

      if (appliedFilters.searchText) {
        filtered = filtered.filter(
          r =>
            r.material.toLowerCase().includes(appliedFilters.searchText.toLowerCase()) ||
            r.reference.toLowerCase().includes(appliedFilters.searchText.toLowerCase())
        )
      }

      const mapped = filtered.map((r, i) => ({
        ...r,
        sno: (page - 1) * pageSize + i + 1
      }))

      setRows(mapped)
      setTotalCount(filtered.length)
      if (showToastMsg) showToast('info', 'Material usage refreshed')
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to load material usage')
    } finally {
      setLoading(false)
    }
  }

  const fetchFilterOptions = async () => {
    try {
      const [originRes, empRes, custRes, suppRes, chemRes] = await Promise.all([
        getPurchaseFilters(),
        getAllEmployees(),
        getCustomerList({ page_size: 1000 }),
        getSupplierList(),
        getChemicalsList()
      ])

      const companies = originRes?.data?.data?.company?.name || []
      setOriginOptions(
        companies.map(c => ({
          label: c.name,
          value: c.name,
          id: c.id
        }))
      )

      setEmployeeOptions(empRes.map(e => ({ id: e.id, label: e.name })))
      if (custRes?.status === 'success') {
        setCustomerOptions(custRes.data.results.map(c => ({ id: c.id, label: c.customer_name })))
      }
      const suppData = suppRes?.data?.data?.results || suppRes?.data?.results || []
      setSupplierOptions(suppData.map(s => ({ id: s.id, label: s.supplier_name })))
      if (chemRes?.success) {
        setChemicalOptions((chemRes.data.results || []).map(c => ({ id: c.id, label: c.name })))
      }
    } catch (err) {
      console.error('Failed to fetch filter options:', err)
    }
  }

  useEffect(() => {
    fetchFilterOptions()
  }, [])

  useEffect(() => {
    loadData(false)
  }, [page, appliedFilters, selectedOrigin, selectedEmployee, selectedCustomer, selectedSupplier, selectedChemical, pageSize])

  const exportCSV = () => {
    const headers = columns.map(c => c.header).filter(h => typeof h === 'string')
    const csv = [
      headers.join(','),
      ...rows.map(r =>
        columns
          .filter(c => typeof c.header === 'string')
          .map(col => `"${(r[col.accessorKey ?? col.id] ?? '').toString().replace(/"/g, '""')}"`)
          .join(',')
      )
    ].join('\r\n')
    const link = document.createElement('a')
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    link.download = 'material_usage.csv'
    link.click()
    showToast('success', 'CSV downloaded')
  }

  const exportExcel = async () => {
    try {
      showToast('info', 'Generating Excel...')
      const XLSX = await import('xlsx')
      const data = rows.map(r => {
        const row = {}
        columns
          .filter(c => typeof c.header === 'string')
          .forEach(col => {
            row[col.header] = r[col.accessorKey ?? col.id]
          })
        return row
      })
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Material Usage')
      XLSX.writeFile(wb, 'material_usage.xlsx')
      showToast('success', 'Excel downloaded')
    } catch (err) {
      showToast('error', 'Failed to export Excel')
    }
  }

  const exportPDF = async () => {
    try {
      showToast('info', 'Generating PDF...')
      const { jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default
      const doc = new jsPDF('l', 'mm', 'a4')
      doc.text('Material Usage List', 14, 15)
      const headers = columns.map(c => c.header).filter(h => typeof h === 'string')
      const body = rows.map(r =>
        columns.filter(c => typeof c.header === 'string').map(col => r[col.accessorKey ?? col.id] ?? '')
      )
      autoTable(doc, {
        startY: 25,
        head: [headers],
        body: body,
        theme: 'striped',
        headStyles: { fillColor: [80, 80, 80] }
      })
      doc.save('material_usage.pdf')
      showToast('success', 'PDF exported')
    } catch (err) {
      showToast('error', 'Failed to export PDF')
    }
  }

  const exportCopy = () => {
    const headers = columns.map(c => c.header).filter(h => typeof h === 'string')
    const text = [
      headers.join('\t'),
      ...rows.map(r =>
        columns
          .filter(c => typeof c.header === 'string')
          .map(col => r[col.accessorKey ?? col.id] ?? '')
          .join('\t')
      )
    ].join('\n')
    navigator.clipboard.writeText(text)
    showToast('info', 'Copied to clipboard')
  }

  const exportPrint = () => {
    const w = window.open('', '_blank')
    const html = `
      <html><head><title>Material Usage</title>
      <style>
        body{font-family:Arial;padding:24px;}
        table{border-collapse:collapse;width:100%;font-size:11px;}
        th,td{border:1px solid #ccc;padding:6px;text-align:left;}
        th{background:#f4f4f4;}
      </style></head><body>
      <h2>Material Usage List</h2>
      <table><thead><tr>
      ${columns
        .filter(c => typeof c.header === 'string')
        .map(c => `<th>${c.header}</th>`)
        .join('')}
      </tr></thead><tbody>
      ${rows
        .map(
          r =>
            `<tr>${columns
              .filter(c => typeof c.header === 'string')
              .map(col => `<td>${r[col.accessorKey ?? col.id] ?? ''}</td>`)
              .join('')}</tr>`
        )
        .join('')}
      </tbody></table></body></html>`
    w?.document.write(html)
    w?.document.close()
    w?.print()
  }

  const columnHelper = createColumnHelper()
  const columns = useMemo(
    () => [
      columnHelper.accessor('sno', { header: 'S.No', size: 60 }),
      columnHelper.accessor('date', { header: 'Date', size: 120 }),
      columnHelper.accessor('material', { header: 'Material / Item', size: 250 }),
      columnHelper.accessor('usedQty', { header: 'Used Qty', size: 100 }),
      columnHelper.accessor('reference', {
        header: 'Reference',
        size: 150,
        cell: i => <Chip label={i.getValue()} size='small' color='info' variant='tonal' />
      }),
      columnHelper.accessor('remarks', { header: 'Remarks', size: 250 })
    ],
    []
  )

  const table = useReactTable({
    data: rows,
    columns,
    manualPagination: true,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  return (
    <StickyListLayout
      header={
        <Box sx={{ mb: 2 }}>
          <Link href='/admin/dashboards' className='text-primary'>
            Dashboard
          </Link>{' '}
          / <Typography component='span'>Material Usage</Typography>
        </Box>
      }
    >
      <Card sx={{ display: 'flex', flexDirection: 'column', maxHeight: '100%', minHeight: 0 }}>
        <CardHeader
          title={
            <Box display='flex' alignItems='center' gap={2}>
              <Typography variant='h5' sx={{ fontWeight: 600 }}>
                Material Usage List
              </Typography>
              <Button
                variant='contained'
                color='primary'
                startIcon={<RefreshIcon sx={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />}
                disabled={loading}
                onClick={() => {
                  setPage(1)
                  setAppliedFilters({
                    enableDateFilter: uiEnableDateFilter,
                    startDate: uiStartDate,
                    endDate: uiEndDate,
                    searchText: uiSearchText
                  })
                  showToast('info', 'Refreshing data...')
                }}
                sx={{ textTransform: 'none', fontWeight: 500, px: 2.5, height: 36 }}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </Box>
          }
          action={
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                variant='contained'
                color='secondary'
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  px: 4,
                  height: 36,
                  backgroundColor: '#808080',
                  '&:hover': { backgroundColor: '#696969' }
                }}
                onClick={handleSampleDownload}
              >
                Sample
              </Button>
              <Button
                variant='contained'
                color='primary'
                sx={{ textTransform: 'none', fontWeight: 500, px: 4, height: 36 }}
                onClick={handleImportClick}
              >
                Import
              </Button>
              <input
                type='file'
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept='.csv, .xlsx, .xls'
                onChange={handleFileChange}
              />
            </Box>
          }
          sx={{ pb: 1.5, pt: 5, px: 10 }}
        />

        <Divider />

        <Box sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Filters Row */}
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, mb: 3, flexWrap: 'wrap', flexShrink: 0 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <FormControlLabel
                control={
                  <Checkbox checked={uiEnableDateFilter} onChange={e => setUiEnableDateFilter(e.target.checked)} />
                }
                label='Date Filter'
              />
              <Box sx={{ width: 180 }}>
                <GlobalDateRange
                  start={uiStartDate}
                  end={uiEndDate}
                  onSelectRange={({ start, end }) => {
                    setUiStartDate(start)
                    setUiEndDate(end)
                  }}
                  disabled={!uiEnableDateFilter}
                />
              </Box>
            </Box>
            <Box sx={{ width: 220 }}>
              <GlobalAutocomplete
                label='Origin'
                placeholder='Select Origin'
                options={originOptions}
                value={selectedOrigin}
                onChange={val => setSelectedOrigin(val)}
              />
            </Box>
            <Box sx={{ width: 220 }}>
              <GlobalAutocomplete
                label='Employee'
                placeholder='Select Employee'
                options={employeeOptions}
                value={selectedEmployee}
                onChange={val => setSelectedEmployee(val)}
              />
            </Box>
            <Box sx={{ width: 220 }}>
              <GlobalAutocomplete
                label='Customer'
                placeholder='Select Customer'
                options={customerOptions}
                value={selectedCustomer}
                onChange={val => setSelectedCustomer(val)}
              />
            </Box>
            <Box sx={{ width: 220 }}>
              <GlobalAutocomplete
                label='Stock Supplier'
                placeholder='Select Supplier'
                options={supplierOptions}
                value={selectedSupplier}
                onChange={val => setSelectedSupplier(val)}
              />
            </Box>
            <Box sx={{ width: 220 }}>
              <GlobalAutocomplete
                label='Chemical'
                placeholder='Select Chemical'
                options={chemicalOptions}
                value={selectedChemical}
                onChange={val => setSelectedChemical(val)}
              />
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Toolbar */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexShrink: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControl size='small' sx={{ width: 140 }}>
                <Select
                  value={pageSize}
                  onChange={e => {
                    setPageSize(Number(e.target.value))
                    setPage(1)
                  }}
                >
                  {[5, 10, 25, 50, 100].map(s => (
                    <MenuItem key={s} value={s}>
                      {s} entries
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                {['Copy', 'CSV', 'Excel', 'PDF', 'Print'].map(label => (
                  <Button
                    key={label}
                    variant='contained'
                    sx={{
                      backgroundColor: '#5A5A5A',
                      color: 'white',
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: '0.8rem',
                      px: 2,
                      py: 0.7,
                      borderRadius: 1,
                      minWidth: 68,
                      boxShadow: 'none',
                      '&:hover': { backgroundColor: '#4b4b4b' }
                    }}
                    onClick={() => {
                      if (label === 'CSV') exportCSV()
                      else if (label === 'Print') exportPrint()
                      else if (label === 'Excel') exportExcel()
                      else if (label === 'PDF') exportPDF()
                      else if (label === 'Copy') exportCopy()
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </Box>
            </Box>
            <DebouncedInput
              size='small'
              placeholder='Search any field...'
              value={uiSearchText}
              onChange={v => {
                setUiSearchText(String(v))
                setAppliedFilters(prev => ({ ...prev, searchText: String(v) }))
                setPage(1)
              }}
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

          <Box sx={{ position: 'relative', flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <StickyTableWrapper rowCount={rows.length}>
              <table className={styles.table} style={{ width: 'max-content', minWidth: '100%', tableLayout: 'fixed' }}>
                <thead>
                  {table.getHeaderGroups().map(hg => (
                    <tr key={hg.id}>
                      {hg.headers.map(header => (
                        <th key={header.id} style={{ width: header.getSize() }}>
                          <div
                            className={classnames({
                              'flex items-center': header.column.getIsSorted(),
                              'cursor-pointer select-none': header.column.getCanSort()
                            })}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getIsSorted() === 'asc' && (
                              <ChevronRight className='-rotate-90' fontSize='small' />
                            )}
                            {header.column.getIsSorted() === 'desc' && (
                              <ChevronRight className='rotate-90' fontSize='small' />
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={columns.length} className='text-center py-4'>
                        Loading...
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className='text-center py-4'>
                        No data available
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map(row => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id} style={{ width: cell.column.getSize() }}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </StickyTableWrapper>
          </Box>

          <Box sx={{ mt: 'auto', pt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography color='text.disabled'>
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} entries
              </Typography>
              <Pagination
                shape='rounded'
                color='primary'
                variant='tonal'
                count={Math.ceil(totalCount / pageSize) || 1}
                page={page}
                onChange={(_, p) => setPage(p)}
                showFirstButton
                showLastButton
              />
            </Box>
          </Box>
        </Box>
      </Card>
    </StickyListLayout>
  )
}

export default function MaterialUsagePage() {
  return (
    <PermissionGuard permission='Material Usage'>
      <MaterialUsagePageContent />
    </PermissionGuard>
  )
}
