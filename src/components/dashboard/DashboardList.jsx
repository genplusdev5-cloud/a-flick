'use client'
import { useEffect, useState, useMemo } from 'react'
import {
  Box,
  Button,
  Card,
  CardHeader,
  Typography,
  Menu,
  MenuItem,
  Divider,
  FormControl,
  FormControlLabel,
  Select,
  TextField,
  InputAdornment,
  IconButton
} from '@mui/material'

import { getFullDashboardData } from '@/api/dashboard'

import Autocomplete from '@mui/material/Autocomplete'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import PrintIcon from '@mui/icons-material/Print'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import { useRouter } from 'next/navigation'
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper } from '@tanstack/react-table'
import classnames from 'classnames'
import ChevronRight from '@menu/svg/ChevronRight'
import styles from '@core/styles/table.module.css'
import axios from 'axios'

export default function DashboardList() {
  const router = useRouter()
  const [rows, setRows] = useState([])
  const [rowCount, setRowCount] = useState()
  const [loading, setLoading] = useState(false)
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [filterType, setFilterType] = useState('Customer')
  const [radioFilter, setRadioFilter] = useState('contract_no')

  const [cardsData, setCardsData] = useState({})

  const loadDashboardData = async () => {
    setLoading(true)

    try {
      // Cancel the previous request if it’s still running
      if (cancelTokenSource) {
        cancelTokenSource.cancel('Canceled previous dashboard-filter request')
      }

      // Create a new cancel token for the next request
      cancelTokenSource = axios.CancelToken.source()

      const res = await getFullDashboardData(
        filterType?.toLowerCase() || 'contract',
        pagination.pageIndex + 1,
        pagination.pageSize,
        cancelTokenSource.token // ✅ pass token to cancel if needed
      )

      if (res.status === 'success') {
        setCardsData(res.cards)

        const formatted = res.table.map((item, index) => ({
          id: item.id || index + 1,
          customer: item.business_name || item.customer || '-',
          contractCode: item.contract_code || '-',
          type: item.type || '-',
          serviceAddress: item.billing_address || '-',
          postalCode: item.postal_code || '-',
          startDate: item.commence_date || '-',
          endDate: item.end_date || '-',
          pests: item.pests || '-'
        }))

        setRows(formatted)
        setRowCount(res.count)
      }
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error('❌ Error loading dashboard data:', error)
      } else {
        console.log('⚠️ Request canceled:', error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await getFullDashboardData(
          filterType?.toLowerCase() || 'customer',
          pagination.pageIndex + 1,
          pagination.pageSize
        )
        if (isMounted && res.status === 'success') {
          setCardsData(res.cards?.data || {}) // ✅ Fixed
          const formatted = res.table.map((item, index) => ({
            id: item.id || index + 1,
            customer: item.business_name || item.billing_name || '-',
            contractCode: item.customer_code || '-',
            type: item.type || '-',
            serviceAddress: item.billing_address || '-',
            postalCode: item.postal_code || '-',
            startDate: item.commence_date || '-',
            endDate: item.end_date || '-',
            pests: item.pests || '-'
          }))
          setRows(formatted)
          setRowCount(res.count)
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    // ⏳ Small delay to prevent rapid re-triggers
    const delay = setTimeout(fetchData, 400)

    return () => {
      isMounted = false
      clearTimeout(delay)
    }
  }, [filterType, pagination.pageIndex, pagination.pageSize])

  // Simulate loading
  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 600)
  }

  // Table setup
  const columnHelper = createColumnHelper()
  const columns = useMemo(
    () => [
      columnHelper.accessor('id', { header: 'ID' }),
      columnHelper.display({
        id: 'actions',
        header: 'Action',
        cell: info => (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton size='small' color='primary'>
              <EditIcon />
            </IconButton>
            <IconButton size='small' color='error'>
              <DeleteIcon />
            </IconButton>
          </Box>
        )
      }),
      columnHelper.accessor('customer', { header: 'Customer' }),
      columnHelper.accessor('contractCode', { header: 'Contract Code' }),
      columnHelper.accessor('type', { header: 'Type' }),
      columnHelper.accessor('serviceAddress', { header: 'Service Address' }),
      columnHelper.accessor('postalCode', { header: 'Postal Code' }),
      columnHelper.accessor('startDate', { header: 'Start Date' }),
      columnHelper.accessor('endDate', { header: 'End Date' }),
      columnHelper.accessor('pests', { header: 'Pests' })
    ],
    []
  )

  const table = useReactTable({
    data: rows,
    columns,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel()
  })

  // Export handlers
  const exportOpen = Boolean(exportAnchorEl)
  const exportCSV = () => {
    const headers = [
      'ID',
      'Customer',
      'Contract Code',
      'Type',
      'Service Address',
      'Postal Code',
      'Start Date',
      'End Date',
      'Pests'
    ]
    const csv = [
      headers.join(','),
      ...rows.map(r =>
        [
          r.id,
          `"${r.customer}"`,
          r.contractCode,
          r.type,
          `"${r.serviceAddress}"`,
          r.postalCode,
          r.startDate,
          r.endDate,
          r.pests
        ].join(',')
      )
    ].join('\n')

    const link = document.createElement('a')
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    link.download = 'dashboard-summary.csv'
    link.click()
  }

  const exportPrint = () => {
    const w = window.open('', '_blank')
    const html = `
      <html><head><title>Dashboard Summary</title><style>
      body{font-family:Arial;padding:24px;}
      table{width:100%;border-collapse:collapse;}
      th,td{border:1px solid #ccc;padding:8px;text-align:left;}
      th{background:#f4f4f4;}
      </style></head><body>
      <h2>Dashboard Summary</h2>
      <table><thead><tr>
      <th>ID</th><th>Customer</th><th>Contract Code</th><th>Type</th><th>Address</th><th>Postal Code</th><th>Start Date</th><th>End Date</th><th>Pests</th>
      </tr></thead><tbody>
      ${rows
        .map(
          r => `<tr>
          <td>${r.id}</td>
          <td>${r.customer}</td>
          <td>${r.contractCode}</td>
          <td>${r.type}</td>
          <td>${r.serviceAddress}</td>
          <td>${r.postalCode}</td>
          <td>${r.startDate}</td>
          <td>${r.endDate}</td>
          <td>${r.pests}</td>
        </tr>`
        )
        .join('')}
      </tbody></table></body></html>`
    w.document.write(html)
    w.document.close()
    w.print()
  }

  // ───────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────
  return (
    <Box>
      <Card sx={{ p: 3 }}>
        <CardHeader
          title={
            <Box display='flex' alignItems='center' gap={2}>
              <Typography variant='h5' sx={{ fontWeight: 600 }}>
                Dashboard Summary
              </Typography>
            </Box>
          }
        />
        {/* 🔹 TOP FILTER & CONTROL ROW */}
        <Box
          sx={{
            mb: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between', // 🧩 separates left & right
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          {/* 🔸 Left Side - Filter Type, Search, Refresh */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {/* 🔸 Filter Type Dropdown */}
            <Autocomplete
              size='small'
              sx={{ width: 200 }}
              options={['Customer', 'Contract']}
              value={filterType || null}
              onChange={(e, value) => setFilterType(value)}
              renderInput={params => <TextField {...params} label='Filter Type' />}
            />

            {/* 🔸 Search Box */}
            <TextField
              value={searchText}
              onChange={e => {
                setSearchText(e.target.value)
                setPagination(p => ({ ...p, pageIndex: 0 }))
              }}
              placeholder='Enter keyword...'
              variant='outlined'
              size='small'
              sx={{ width: 400 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />

            {/* 🔸 Refresh Button */}
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
              onClick={handleRefresh}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                height: 36,
                bgcolor: '#7a1313',
                '&:hover': { bgcolor: '#a31515' }
              }}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </Box>

          {/* 🔸 Right Side - Entries Dropdown */}
          <Box>
            <FormControl size='small' sx={{ width: 140 }}>
              <Select
                value={pagination.pageSize}
                onChange={e => setPagination(p => ({ ...p, pageSize: Number(e.target.value), pageIndex: 0 }))}
              >
                {[10, 25, 50, 100].map(s => (
                  <MenuItem key={s} value={s}>
                    {s} entries
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* 🔹 RADIO FILTERS ROW */}
        <FormControl sx={{ mb: 8 }}>
          <RadioGroup
            row
            name='dashboard-radio'
            value={radioFilter}
            onChange={e => setRadioFilter(e.target.value)}
            sx={{ flexWrap: 'wrap', gap: 2 }}
          >
            <FormControlLabel value='contract_no' control={<Radio />} label='Contract No.' />
            <FormControlLabel value='service_address' control={<Radio />} label='Service Address' />
            <FormControlLabel value='service_postal' control={<Radio />} label='Service Postal' />
            <FormControlLabel value='service_contact' control={<Radio />} label='Service Contact' />
            <FormControlLabel value='service_phone' control={<Radio />} label='Service Phone' />
          </RadioGroup>
        </FormControl>

        <div className='overflow-x-auto'>
          <table className={styles.table}>
            <thead>
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(h => (
                    <th key={h.id}>
                      <div
                        className={classnames({
                          'flex items-center': h.column.getIsSorted(),
                          'cursor-pointer select-none': h.column.getCanSort()
                        })}
                        onClick={h.column.getToggleSortingHandler()}
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {h.column.getIsSorted() === 'asc' && <ChevronRight fontSize='1.25rem' className='-rotate-90' />}
                        {h.column.getIsSorted() === 'desc' && <ChevronRight fontSize='1.25rem' className='rotate-90' />}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {rows.length ? (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className='text-center py-4'>
                    No data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <TablePaginationComponent totalCount={rowCount} pagination={pagination} setPagination={setPagination} />
      </Card>
    </Box>
  )
}
