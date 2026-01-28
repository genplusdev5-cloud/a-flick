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
  Breadcrumbs,
  Checkbox,
  Pagination,
  InputAdornment,
  FormControl,
  Select,
  MenuItem,
  FormControlLabel
} from '@mui/material'

import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import StickyListLayout from '@/components/common/StickyListLayout'
import PermissionGuard from '@/components/auth/PermissionGuard'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import StatusChip from '@/components/common/StatusChip'

import { getStockSummary } from '@/api/stock/stock_summary'
import { exportOpeningStockTemplate, importOpeningStock } from '@/api/stock/stock_summary/opening_stock'
import { getPurchaseFilters } from '@/api/purchase/purchase_inward'

import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import CustomTextField from '@core/components/mui/TextField'
import CustomAutocomplete from '@core/components/mui/Autocomplete'
import GlobalDateRange from '@/components/common/GlobalDateRange'

import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  createColumnHelper,
  flexRender
} from '@tanstack/react-table'

import classnames from 'classnames'
import styles from '@core/styles/table.module.css'
import ChevronRight from '@menu/svg/ChevronRight'
import { showToast } from '@/components/common/Toasts'

// ──────────────────────────────────────────────────────────────
// Debounced Input
// ──────────────────────────────────────────────────────────────
const DebouncedInput = ({ value: initialValue, onChange, debounce = 500, ...props }) => {
  const [value, setValue] = useState(initialValue)
  const isFirstRender = useRef(true)

  useEffect(() => setValue(initialValue), [initialValue])

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const t = setTimeout(() => onChange(value), debounce)
    return () => clearTimeout(t)
  }, [value])

  return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

const StockSummaryPageContent = () => {
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
  const [appliedOrigin, setAppliedOrigin] = useState(null) // ✅ Applied Filter State

  const [sorting, setSorting] = useState([])
  const fileInputRef = useRef(null)

  const handleSampleDownload = async () => {
    try {
      showToast('info', 'Downloading sample template...')
      const response = await exportOpeningStockTemplate()

      // The response is a blob because of responseType: 'blob' in axios config
      const blob = response.data || response // axios with responseType blob usually puts it in .data

      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url

      const now = new Date()
      const timestamp =
        now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') +
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0') +
        String(now.getSeconds()).padStart(2, '0')

      link.download = `OpeningStockTemplate_${timestamp}.xlsx`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      showToast('success', 'Template downloaded successfully')
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to download sample template')
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async e => {
    const file = e.target.files[0]
    if (!file) return

    if (!selectedOrigin?.id) {
      showToast('error', 'Please select an Origin first!')
      return
    }

    const now = new Date()
    const currentYear = now.getFullYear()
    const formattedDate = format(now, 'yyyy-MM-dd')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('company_id', selectedOrigin.id)
    formData.append('year', currentYear)
    formData.append('opening_date', formattedDate)

    try {
      showToast('info', `Importing ${file.name}...`)
      const response = await importOpeningStock(formData)

      if (response?.data?.status === 'success' || response?.data?.success || response?.success) {
        showToast('success', 'Opening Stock imported successfully!')
        // After import, we should ideally refresh with the same date we just sent
        // But the user might want to see it in the current filter context
        loadData(false)
      } else {
        showToast('error', `Error importing Opening Stock: ${response?.data?.message || 'Unknown error'}`)
      }
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to import Opening Stock Excel!')
    } finally {
      // Reset file input
      if (e.target) e.target.value = ''
    }
  }

  const loadData = async (showToastMsg = false) => {
    setLoading(true)
    try {
      const { enableDateFilter, startDate, endDate, searchText } = appliedFilters

      const params = {
        page,
        page_size: pageSize,
        search: searchText || undefined,
        company_id: appliedOrigin?.id || undefined // ✅ Use Applied Origin
      }

      if (enableDateFilter && startDate && endDate) {
        params.from_date = format(startDate, 'yyyy-MM-dd')
        params.to_date = format(endDate, 'yyyy-MM-dd')
      }

      const response = await getStockSummary(params)

      const resData = response?.data?.data || response?.data || response

      // ✅ Robust extraction: Handle nested data (results.data) or direct array
      const items = Array.isArray(resData?.results?.data)
        ? resData.results.data
        : Array.isArray(resData?.results)
          ? resData.results
          : Array.isArray(resData)
            ? resData
            : []

      setTotalCount(resData?.count || resData?.results?.count || items.length || 0)

      const mapped = items.map((r, i) => ({
        id: r.item_id || i,
        chemicalName: r.item_name || '-',
        uom: r.uom || '-',
        openingDate: r.opening_date ? format(new Date(r.opening_date), 'dd/MM/yyyy') : '-',
        openingStock: r.opening_stock ?? 0,
        purchaseIn: r.purchase_in ?? 0,
        purchaseReturn: r.purchase_return ?? 0,
        transferIn: r.transfer_in ?? 0,
        transferOut: r.transfer_out ?? 0,
        materialUsage: r.material_usage ?? 0,
        currentStock: r.current_stock ?? 0
      }))

      const withSno = mapped.map((row, i) => ({
        ...row,
        sno: (page - 1) * pageSize + i + 1
      }))

      setRows(withSno)
      if (showToastMsg) showToast('info', 'Stock summary refreshed')
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to load stock summary')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchOrigins = async () => {
      try {
        const res = await getPurchaseFilters()
        const companies = res?.data?.data?.company?.name || []
        const options = companies.map(c => ({
          label: c.name,
          value: c.name,
          id: c.id
        }))
        setOriginOptions(options)
        if (options.length > 0) {
          setSelectedOrigin(options[0])
        }
      } catch (err) {
        console.error('Failed to fetch origins', err)
      }
    }
    fetchOrigins()
  }, [])

  useEffect(() => {
    loadData(false)
  }, [page, appliedFilters, appliedOrigin, pageSize]) // ✅ Depend on appliedOrigin

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
    link.download = 'stock_summary.csv'
    link.click()
    showToast('success', 'CSV downloaded')
  }

  const exportExcel = async () => {
    try {
      showToast('info', 'Generating Excel...')
      const XLSX = await import('xlsx')
      const headers = columns.map(c => c.header).filter(h => typeof h === 'string')
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
      XLSX.utils.book_append_sheet(wb, ws, 'Stock Summary')
      XLSX.writeFile(wb, 'stock_summary.xlsx')
      showToast('success', 'Excel downloaded')
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to export Excel')
    }
  }

  const exportPDF = async () => {
    try {
      showToast('info', 'Generating PDF...')
      const { jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default
      const doc = new jsPDF('l', 'mm', 'a4')

      doc.text('Stock Summary List', 14, 15)

      const headers = columns.map(c => c.header).filter(h => typeof h === 'string')
      const body = rows.map(r =>
        columns.filter(c => typeof c.header === 'string').map(col => r[col.accessorKey ?? col.id] ?? '')
      )

      autoTable(doc, {
        startY: 25,
        head: [headers],
        body: body,
        theme: 'striped',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [80, 80, 80] }
      })

      doc.save('stock_summary.pdf')
      showToast('success', 'PDF exported')
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to export PDF')
    }
  }

  const exportCopy = () => {
    try {
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
    } catch (err) {
      console.error(err)
      showToast('error', 'Failed to copy')
    }
  }

  const exportPrint = () => {
    const w = window.open('', '_blank')
    const html = `
      <html><head><title>Stock Summary</title>
      <style>
        body{font-family:Arial;padding:24px;}
        table{border-collapse:collapse;width:100%;font-size:11px;}
        th,td{border:1px solid #ccc;padding:6px;text-align:left;}
        th{background:#f4f4f4;}
      </style></head><body>
      <h2>Stock Summary List</h2>
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
              .map(col => {
                const val = r[col.accessorKey ?? col.id] ?? ''
                return `<td>${val}</td>`
              })
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
      columnHelper.accessor('chemicalName', { header: 'Chemical Name', size: 200 }),
      columnHelper.accessor('uom', { header: 'UOM', size: 100 }),
      columnHelper.accessor('openingDate', { header: 'Opening Date', size: 130 }),
      columnHelper.accessor('openingStock', { header: 'Opening Stock', size: 130 }),
      columnHelper.accessor('purchaseIn', { header: 'Purchase In', size: 130 }),
      columnHelper.accessor('purchaseReturn', { header: 'Purchase Return', size: 150 }),
      columnHelper.accessor('transferIn', { header: 'Transfer In', size: 130 }),
      columnHelper.accessor('transferOut', { header: 'Transfer Out', size: 130 }),
      columnHelper.accessor('materialUsage', { header: 'Material Usage', size: 150 }),
      columnHelper.accessor('currentStock', { header: 'Current Stock', size: 130 })
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
          / <Typography component='span'>Stock Summary</Typography>
        </Box>
      }
    >
      <Card
        sx={{
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '100%',
          minHeight: 0,
          position: 'relative'
        }}
      >
        <CardHeader
          title={
            <Box display='flex' alignItems='center' gap={2}>
              <Typography variant='h5' sx={{ fontWeight: 600 }}>
                Stock Summary List
              </Typography>
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
          sx={{
            pb: 1.5,
            pt: 5,
            px: 10,
            '& .MuiCardHeader-action': { m: 0, alignItems: 'center' },
            '& .MuiCardHeader-title': { fontWeight: 600, fontSize: '1.125rem' }
          }}
        />

        <Divider />

        <Box sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Filters */}
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, mb: 3, flexWrap: 'nowrap', flexShrink: 0 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <FormControlLabel
                control={
                  <Checkbox checked={uiEnableDateFilter} onChange={e => setUiEnableDateFilter(e.target.checked)} />
                }
                label='Date Filter'
              />
              <Box sx={{ width: 220 }}>
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

            <Button
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
                setPage(1)
                setAppliedOrigin(selectedOrigin) // ✅ Apply Origin on Refresh
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

          <Divider sx={{ mb: 3 }} />

          {/* Toolbar */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
              mb: 3,
              flexShrink: 0
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
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
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position='start'>
                      <SearchIcon />
                    </InputAdornment>
                  )
                }
              }}
            />
          </Box>

          <Box sx={{ position: 'relative', flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <StickyTableWrapper rowCount={rows.length}>
              <table className={styles.table} style={{ width: 'max-content', minWidth: '100%', tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: 60 }} />
                  <col style={{ width: 200 }} />
                  <col style={{ width: 100 }} />
                  <col style={{ width: 130 }} />
                  <col style={{ width: 130 }} />
                  <col style={{ width: 130 }} />
                  <col style={{ width: 150 }} />
                  <col style={{ width: 130 }} />
                  <col style={{ width: 130 }} />
                  <col style={{ width: 150 }} />
                  <col style={{ width: 130 }} />
                </colgroup>
                <thead>
                  {table.getHeaderGroups().map(hg => (
                    <tr key={hg.id}>
                      {hg.headers.map(header => (
                        <th
                          key={header.id}
                          style={{ width: header.getSize(), minWidth: header.getSize(), maxWidth: header.getSize() }}
                        >
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

          <Box sx={{ mt: 'auto', flexShrink: 0, pt: 4 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2
              }}
            >
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

export default function StockSummaryPage() {
  return (
    <PermissionGuard permission='Stock Summary'>
      <StockSummaryPageContent />
    </PermissionGuard>
  )
}
