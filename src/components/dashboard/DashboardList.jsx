'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
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
  IconButton
} from '@mui/material'

import SearchIcon from '@mui/icons-material/Search'
import RefreshIcon from '@mui/icons-material/Refresh'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'

import Autocomplete from '@mui/material/Autocomplete'
import axios from 'axios'

import { getDashboardList } from '@/api/dashboard'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import { useReactTable, getCoreRowModel, createColumnHelper, flexRender } from '@tanstack/react-table'
import styles from '@core/styles/table.module.css'

let cancelSource = null

export default function DashboardList() {
  const [rows, setRows] = useState([])
  const [count, setCount] = useState(0)

  const [filterType, setFilterType] = useState('Customer') // Customer | Contract
  const [radioFilter, setRadioFilter] = useState('')
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [loading, setLoading] = useState(false)
  const runOnce = useRef(false);


  const columnHelper = createColumnHelper()

  // ----------------------------
  // CUSTOMER COLUMNS
  // ----------------------------
  const customerColumns = [
    columnHelper.accessor('id', { header: 'ID' }),
    columnHelper.display({
      id: 'actions',
      header: 'Action',
      cell: () => (
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
    columnHelper.accessor('origin', { header: 'Origin' }),
    columnHelper.accessor('customer_code', { header: 'Customer Code' }),
    columnHelper.accessor('commence_date', { header: 'Commence Date' }),
    columnHelper.accessor('billing_name', { header: 'Billing Name' }),
    columnHelper.accessor('business_name', { header: 'Business Name' }),
    columnHelper.accessor('contracts', { header: 'Contracts' }),
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
    columnHelper.accessor('id', { header: 'ID' }),
    columnHelper.display({
      id: 'actions',
      header: 'Action',
      cell: () => (
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
const loadList = async () => {
  try {
    setLoading(true);

    if (cancelSource) cancelSource.cancel();
    cancelSource = axios.CancelToken.source();

    const type = filterType.toLowerCase();

    const res = await getDashboardList(
      type,
      pagination.pageIndex + 1,
      pagination.pageSize,
      cancelSource.token,
      radioFilter,
      searchText
    );

    if (res.status === 'cancelled') return;

    if (res.status === 'success') {
      let formatted = [];

      if (filterType === 'Customer') {
        formatted = res.table.map((item, idx) => ({
          id: item.id || idx + 1,
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
          postal_code: item.postal_code || '-'
        }));
      } else {
        formatted = res.table.map((item, idx) => ({
          id: item.id || idx + 1,
          customer: item.business_name || item.billing_name || '-',
          contractCode: item.contract_code || '-',
          type: item.type || '-',
          serviceAddress: item.billing_address || '-',
          postalCode: item.postal_code || '-',
          startDate: item.commence_date || '-',
          endDate: item.end_date || '-',
          pests: item.pests || '-'
        }));
      }

      setRows(formatted);
      setCount(res.count);
    }

  } catch {
    // 🔥 FIX: DO NOT LOG RAW ERROR OBJECT
    console.error("❌ Dashboard List Load Error");
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  if (runOnce.current) return;
  runOnce.current = true;

  loadList();
}, [filterType, pagination.pageIndex, pagination.pageSize, radioFilter, searchText]);



  const handleRefresh = () => loadList()

  // ----------------------------
  // RADIO BUTTONS (DYNAMIC)
  // ----------------------------
  const customerRadios = (
    <>
      <FormControlLabel value='business_name' control={<Radio />} label='Business Name' />
      <FormControlLabel value='billing_name' control={<Radio />} label='Billing Name' />
      <FormControlLabel value='billing_address' control={<Radio />} label='Billing Address' />
      <FormControlLabel value='billing_postal' control={<Radio />} label='Billing Postal' />
      <FormControlLabel value='billing_contact' control={<Radio />} label='Billing Contact' />
      <FormControlLabel value='billing_phone' control={<Radio />} label='Billing Phone' />
    </>
  )

  const contractRadios = (
    <>
      <FormControlLabel value='contract_no' control={<Radio />} label='Contract No.' />
      <FormControlLabel value='service_address' control={<Radio />} label='Service Address' />
      <FormControlLabel value='service_postal' control={<Radio />} label='Service Postal' />
      <FormControlLabel value='service_contact' control={<Radio />} label='Service Contact' />
      <FormControlLabel value='service_phone' control={<Radio />} label='Service Phone' />
    </>
  )

  const table = useReactTable({
    data: rows,
    columns,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel()
  })

  return (
    <Box>
      <Card sx={{ p: 3 }}>
        <CardHeader title='Dashboard Summary' />

        {/* TOP FILTER ROW */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {/* FILTER TYPE */}
            <Autocomplete
              size='small'
              sx={{ width: 200 }}
              options={['Customer', 'Contract']}
              value={filterType}
              onChange={(e, v) => setFilterType(v)}
              renderInput={params => <TextField {...params} label='Filter Type' />}
            />

            {/* SEARCH */}
            <TextField
              size='small'
              sx={{ width: 300 }}
              placeholder='Search...'
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />

            {/* REFRESH */}
            <Button variant='contained' onClick={handleRefresh} startIcon={<RefreshIcon />} disabled={loading}>
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
              {[10, 25, 50, 100].map(n => (
                <MenuItem key={n} value={n}>
                  {n} entries
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* RADIO FILTERS */}
        <RadioGroup
          row
          value={radioFilter}
          onChange={e => setRadioFilter(e.target.value)}
          sx={{ mb: 4, flexWrap: 'wrap', gap: 2 }}
        >
          {filterType === 'Customer' ? customerRadios : contractRadios}
        </RadioGroup>

        {/* TABLE */}
        <div className='overflow-x-auto'>
          <table className={styles.table}>
            <thead>
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(h => (
                    <th key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</th>
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

        {/* PAGINATION */}
        <TablePaginationComponent totalCount={count} pagination={pagination} setPagination={setPagination} />
      </Card>
    </Box>
  )
}
