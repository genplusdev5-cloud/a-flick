'use client'

import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import classnames from 'classnames'
import ChevronRight from '@menu/svg/ChevronRight'
import { useRouter } from 'next/navigation'

import {
  Box,
  Button,
  Card,
  CardHeader,
  FormControl,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  RadioGroup,
  FormControlLabel,
  Radio,
  IconButton,
  Chip // 🔥 Import Chip
} from '@mui/material'

import SearchIcon from '@mui/icons-material/Search'
import RefreshIcon from '@mui/icons-material/Refresh'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ProgressCircularCustomization from '@/components/common/ProgressCircularCustomization'

import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import GlobalTextField from '@/components/common/GlobalTextField'
import axios from 'axios'

import { getDashboardList } from '@/api/dashboard'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender
} from '@tanstack/react-table'

import styles from '@core/styles/table.module.css'

let cancelSource = null

export default function DashboardList() {
  const [rows, setRows] = useState([])
  const [count, setCount] = useState(0)
  const [sorting, setSorting] = useState([])

  const [filterType, setFilterType] = useState('Contract')

  const router = useRouter()

  const [radioFilter, setRadioFilter] = useState('')
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [loading, setLoading] = useState(false)
  const runOnce = useRef(false)

  const [appliedSearchText, setAppliedSearchText] = useState('')
  const [appliedRadioFilter, setAppliedRadioFilter] = useState('')

  const handleRadioToggle = value => {
    setRadioFilter(prev => (prev === value ? '' : value))
  }

  const columnHelper = createColumnHelper()

  // ----------------------------
  // CUSTOMER COLUMNS
  // ----------------------------
  const customerColumns = [
    columnHelper.accessor('sno', {
      header: 'S.No',
      enableSorting: false
    }),

    columnHelper.display({
      id: 'actions',
      header: 'Action',
      cell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            size='small'
            color='primary'
            onClick={() => router.push(`/admin/attendance/attendance/edit/${row.original.id}`)}
          >
            <i className='tabler-edit' />
          </IconButton>
          {/* Delete */}
          <IconButton size='small' color='error' onClick={() => setDeleteDialog({ open: true, row: row.original })}>
            <i className='tabler-trash text-red-600 text-lg' />
          </IconButton>
        </Box>
      )
    }),
    columnHelper.accessor('origin', { header: 'Origin' }),
    columnHelper.accessor('customer_code', { header: 'Customer Code' }),
    columnHelper.accessor('commence_date', { header: 'Commence Date' }),
    columnHelper.accessor('billing_name', { header: 'Billing Name' }),
    columnHelper.accessor('business_name', { header: 'Business Name' }),
    columnHelper.accessor('contract_amount', { header: 'Contract Amount' }),
    columnHelper.accessor('output_value', { header: 'Output Value' }),
    columnHelper.accessor('contracts', { header: 'Contracts' }),
    columnHelper.accessor('contract_person_name', { header: 'Contract Person Name' }),
    columnHelper.accessor('contract_person_phone', { header: 'Contract Person Phone Number' }),
    columnHelper.display({
      id: 'contract_status',
      header: 'Contract Status',
      cell: ({ row }) => {
        const status = row.original.contract_status
        return (
          <Chip
            size='small'
            label={status || '-'}
            color={status === 'Active' ? 'success' : status === 'Expired' ? 'error' : 'default'}
            variant='tonal'
          />
        )
      }
    }),
    columnHelper.accessor('contact_person', { header: 'Contact Person' }),
    columnHelper.accessor('contact_email', { header: 'Contact Email' }),
    columnHelper.accessor('contact_phone', { header: 'Contact Phone' }),
    columnHelper.accessor('billing_address', { header: 'Billing Address' }),
    columnHelper.accessor('postal_code', { header: 'Postal Code' })
  ]

  // ----------------------------
  // CONTRACT COLUMNS
  // ----------------------------
  const contractColumns = [
    columnHelper.accessor('sno', {
      header: 'S.No'
    }),

    columnHelper.display({
      id: 'actions',
      header: 'Action',
      cell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            size='small'
            color='primary'
            onClick={() => router.push(`/admin/attendance/attendance/edit/${row.original.id}`)}
          >
            <i className='tabler-edit' />
          </IconButton>
          {/* Delete */}
          <IconButton size='small' color='error' onClick={() => setDeleteDialog({ open: true, row: row.original })}>
            <i className='tabler-trash text-red-600 text-lg' />
          </IconButton>
        </Box>
      )
    }),

    columnHelper.display({
      id: 'operate',
      header: 'Operate',
      cell: ({ row }) => {
        const id = row.original.customerId || row.original.customer_id
        const encodedId = id ? btoa(id.toString()) : ''
        const name =
          row.original.customer ||
          row.original.business_name ||
          row.original.billing_name ||
          row.original.customer_name ||
          ''

        return (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column', // 🔥 one by one
              gap: 1,
              alignItems: 'flex-start'
            }}
          >
            <Button
              variant='outlined'
              size='small'
              color='primary'
              onClick={() =>
                router.push(`/admin/contracts?customer_id=${row.original.customerId || row.original.customer_id}`)
              }
              sx={{ fontSize: '0.75rem', padding: '4px 10px', minWidth: 'auto' }}
            >
              Contract
            </Button>
            <Button
              variant='outlined'
              size='small'
              color='secondary'
              onClick={() =>
                router.push(
                  `/admin/service-request?customer_id=${row.original.customerId || row.original.customer_id}`
                )
              }
              sx={{ fontSize: '0.75rem', padding: '4px 10px', minWidth: 'auto' }}
            >
              Service
            </Button>
            <Button
              variant='outlined'
              size='small'
              color='info'
              onClick={() =>
                router.push(`/admin/call-log?customer_id=${row.original.customerId || row.original.customer_id}`)
              }
              sx={{ fontSize: '0.75rem', padding: '4px 10px', minWidth: 'auto' }}
            >
              Call Log
            </Button>
          </Box>
        )
      }
    }),
    columnHelper.accessor('customer', { header: 'Customer' }),
    columnHelper.accessor('contractCode', { header: 'Contract Code' }),
    columnHelper.accessor('type', { header: 'Type' }),
    columnHelper.accessor('contract_amount', { header: 'Contract Amount' }),
    columnHelper.accessor('output_value', { header: 'Output Value' }),
    columnHelper.accessor('serviceAddress', { header: 'Service Address' }),
    columnHelper.accessor('postalCode', { header: 'Postal Code' }),
    columnHelper.accessor('startDate', { header: 'Start Date' }),
    columnHelper.accessor('endDate', { header: 'End Date' }),
    columnHelper.accessor('pests', { header: 'Pests' }),
    columnHelper.accessor('contract_person_name', { header: 'Contract Person Name' }),
    columnHelper.accessor('contract_person_phone', { header: 'Contract Person Phone Number' }),
    columnHelper.display({
      id: 'contract_status',
      header: 'Contract Status',
      cell: ({ row }) => {
        const rawStatus = row.original.contract_status || '-'
        const status = String(rawStatus).toLowerCase()

        const statusColorMap = {
          current: 'success', // 🟢 Green
          renewed: 'info', // 🔵 Blue
          hold: 'warning', // 🟠 Orange
          terminated: 'error', // 🔴 Red
          expired: 'error' // 🔴 Red
        }

        return (
          <Chip
            size='small'
            label={rawStatus}
            color={statusColorMap[status] || 'default'}
            variant='tonal'
            sx={{
              fontWeight: 600,
              minWidth: 90,
              textTransform: 'capitalize'
            }}
          />
        )
      }
    })
  ]

  // ----------------------------
  // DYNAMIC COLUMNS
  // ----------------------------
  const columns = useMemo(() => {
    return filterType === 'Customer' ? customerColumns : contractColumns
  }, [filterType])

  // ----------------------------
  // LOAD DATA
  // ----------------------------
  const loadList = useCallback(async () => {
    if (!filterType) return

    try {
      setLoading(true)

      if (cancelSource) cancelSource.cancel()
      cancelSource = axios.CancelToken.source()

      const type = filterType.toLowerCase()

      const res = await getDashboardList(
        type,
        pagination.pageIndex + 1,
        pagination.pageSize,
        cancelSource.token,
        appliedRadioFilter,
        appliedSearchText
      )

      if (res.status === 'success') {
        let formatted = []

        if (filterType === 'Customer') {
          formatted = res.table.map((item, idx) => ({
            sno: idx + 1 + pagination.pageIndex * pagination.pageSize,
            id: item.id,
            origin: item.origin || '-',
            customer_code: item.customer_code || '-',
            commence_date: item.commence_date || '-',
            billing_name: item.billing_name || '-',
            business_name: item.business_name || '-',
            contracts: item.contracts || '-',
            contact_person: item.contact_person || '-',
            contact_email: item.contact_email || '-',
            contact_phone: item.contact_phone || '-',
            billing_address: item.billing_address || '-',
            postal_code: item.postal_code || '-',
            // New Fields Mapped (Customer View)
            contract_amount: item.contract_amount ?? item.contract_value ?? item.amount ?? '-',
            output_value: item.output_value ?? item.prod_value ?? '-',
            contract_person_name: item.contract_person_name || item.contact_person || '-',
            contract_person_phone: item.contract_person_phone || item.contact_phone || '-',
            contract_status: item.contract_status || item.status || '-'
          }))
        } else {
          formatted = res.table.map((item, idx) => ({
            sno: idx + 1 + pagination.pageIndex * pagination.pageSize,
            id: item.id,
            customerId: item.customer_id || item.customerId,
            // Correct mapping based on provided JSON
            customer: item.customer || item.business_name || item.billing_name || '-',
            contractCode: item.contract_code || '-',
            type: item.type || '-',
            serviceAddress: item.service_address || item.billing_address || '-',
            postalCode: item.postal_code || '-',
            startDate: item.start_date || item.commence_date || '-',
            endDate: item.end_date || '-',
            pests: item.pests || '-',
            // New Fields Mapped (Contract View)
            contract_amount: item.contract_value ?? item.contract_amount ?? item.amount ?? '-',
            output_value: item.prod_value ?? item.output_value ?? '-',
            contract_person_name: item.contact_person_name || item.contract_person_name || item.contact_person || '-',
            contract_person_phone:
              item.contact_person_phone || item.contract_person_phone || item.contact_phone || '-',
            contract_status: item.contract_status || item.status || '-'
          }))
        }

        setRows(formatted)
        setCount(res.count)
      }
    } catch (err) {
      console.error('❌ Dashboard List Load Error:', err)
    } finally {
      setLoading(false)
    }
  }, [filterType, pagination.pageIndex, pagination.pageSize, appliedRadioFilter, appliedSearchText])

  const handleRefresh = () => {
    setAppliedSearchText(searchText)
    setAppliedRadioFilter(radioFilter)

    setPagination(p => ({
      ...p,
      pageIndex: 0
    }))
  }

  useEffect(() => {
    loadList()
  }, [loadList])

  // ----------------------------
  // RADIO BUTTONS (DYNAMIC)
  // ----------------------------
  const customerRadios = (
    <>
      <FormControlLabel
        value='business_name'
        control={<Radio />}
        label='Business Name'
        onClick={() => handleRadioToggle('business_name')}
      />
      <FormControlLabel
        value='billing_name'
        control={<Radio />}
        label='Billing Name'
        onClick={() => handleRadioToggle('billing_name')}
      />
      <FormControlLabel
        value='billing_address'
        control={<Radio />}
        label='Billing Address'
        onClick={() => handleRadioToggle('billing_address')}
      />
      <FormControlLabel
        value='billing_postal'
        control={<Radio />}
        label='Billing Postal'
        onClick={() => handleRadioToggle('billing_postal')}
      />
      <FormControlLabel
        value='billing_contact'
        control={<Radio />}
        label='Billing Contact'
        onClick={() => handleRadioToggle('billing_contact')}
      />
      <FormControlLabel
        value='billing_phone'
        control={<Radio />}
        label='Billing Phone'
        onClick={() => handleRadioToggle('billing_phone')}
      />
    </>
  )

  const contractRadios = (
    <>
      <FormControlLabel
        value='contract_no'
        control={<Radio />}
        label='Contract No.'
        onClick={() => handleRadioToggle('contract_no')}
      />
      <FormControlLabel
        value='service_address'
        control={<Radio />}
        label='Service Address'
        onClick={() => handleRadioToggle('service_address')}
      />
      <FormControlLabel
        value='service_postal'
        control={<Radio />}
        label='Service Postal'
        onClick={() => handleRadioToggle('service_postal')}
      />
      <FormControlLabel
        value='service_contact'
        control={<Radio />}
        label='Service Contact'
        onClick={() => handleRadioToggle('service_contact')}
      />
      <FormControlLabel
        value='service_phone'
        control={<Radio />}
        label='Service Phone'
        onClick={() => handleRadioToggle('service_phone')}
      />
    </>
  )

  const table = useReactTable({
    data: rows,
    columns,
    manualPagination: true,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  return (
    <Box>
      {loading && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            bgcolor: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <ProgressCircularCustomization size={60} thickness={5} />
        </Box>
      )}

      <Card sx={{ p: 3 }}>
        <CardHeader title='Dashboard Summary' />

        {/* TOP FILTER ROW */}
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
            {/* FILTER TYPE */}
            <GlobalAutocomplete
              size='small'
              sx={{ width: 200 }}
              options={['Customer', 'Contract']}
              value={filterType}
              onChange={value => {
                if (typeof value === 'string') {
                  setFilterType(value)
                } else if (value?.value) {
                  setFilterType(value.value)
                } else if (value?.label) {
                  setFilterType(value.label)
                }
              }}
              label=''
            />

            {/* SEARCH */}
            <GlobalTextField
              size='small'
              sx={{ width: 300 }}
              placeholder='Search...'
              value={searchText}
              onChange={e => {
                setSearchText(e.target.value)
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />

            {/* REFRESH */}
            <Button
              variant='contained'
              onClick={handleRefresh}
              startIcon={<RefreshIcon />}
              disabled={loading}
              size='medium'
              sx={{
                height: 40, // same as textfield height
                paddingX: 3, // better spacing
                borderRadius: '4px' // clean modern shape
              }}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </Box>

          {/* PAGE SIZE */}
          <FormControl size='small'>
            <Select
              value={pagination.pageSize}
              onChange={e =>
                setPagination(p => ({
                  ...p,
                  pageSize: Number(e.target.value),
                  pageIndex: 0
                }))
              }
            >
              {[25, 50, 75, 100].map(n => (
                <MenuItem key={n} value={n}>
                  {n} entries
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* RADIO FILTERS */}
        <RadioGroup row value={radioFilter} sx={{ mb: 4, flexWrap: 'wrap', gap: 2 }}>
          {filterType === 'Customer' ? customerRadios : contractRadios}
        </RadioGroup>

        {/* TABLE */}
        <StickyTableWrapper rowCount={rows.length}>
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

                        {{
                          asc: <ChevronRight fontSize='1.25rem' className='-rotate-90' />,
                          desc: <ChevronRight fontSize='1.25rem' className='rotate-90' />
                        }[h.column.getIsSorted()] ?? null}
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
        </StickyTableWrapper>

        {/* PAGINATION */}
        <TablePaginationComponent totalCount={count} pagination={pagination} setPagination={setPagination} />
      </Card>
    </Box>
  )
}
