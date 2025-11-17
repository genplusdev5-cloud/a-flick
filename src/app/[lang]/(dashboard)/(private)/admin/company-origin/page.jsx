'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

// MUI
import {
  Box,
  Card,
  CardHeader,
  Typography,
  Button,
  MenuItem,
  Select,
  IconButton,
  InputAdornment,
  Pagination,
  Divider
} from '@mui/material'

import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'

// Table
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender
} from '@tanstack/react-table'

import CustomTextField from '@core/components/mui/TextField'
import tableStyles from '@core/styles/table.module.css'

// ----------------------------------------------------------------------

export default function CompanyOriginListPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  const pageIndex = pagination.pageIndex
  const pageSize = pagination.pageSize

  // API (Replace with real API)
// safeLoadData.js — copy/paste into your page component and call instead of older fetch
const loadData = async () => {
  setLoading(true)
  try {
    const res = await fetch('/api/company-origin') // <-- confirm this URL is correct
    const contentType = res.headers.get('content-type') || ''

    // Grab raw text so we can show it if it's HTML/error
    const raw = await res.text()

    if (!res.ok) {
      // Server returned non-2xx — show useful debug info
      console.error('API error', res.status, raw)
      throw new Error(`API error: ${res.status} - see console (response body)`)
    }

    // If it's JSON, parse it; else show what was returned
    if (contentType.includes('application/json')) {
      const data = JSON.parse(raw) // safe: content type said JSON
      setRows(Array.isArray(data) ? data : data.data || [])
    } else {
      // Probably HTML or text (index.html or error page) — helpful for debugging
      console.error('Expected JSON but got:', raw.slice(0, 1000))
      throw new Error('Server returned non-JSON (check network response and server route).')
    }
  } catch (err) {
    console.error('Failed to load company origins:', err)
    // showToast or fallback
    showToast('error', String(err.message || err))
  } finally {
    setLoading(false)
  }
}

  useEffect(() => {
    loadData()
  }, [])

  // Filtering
  const filteredRows = rows.filter(r => {
    if (!searchText) return true
    const t = searchText.toLowerCase()
    return (
      r.companyCode?.toLowerCase().includes(t) ||
      r.name?.toLowerCase().includes(t) ||
      r.phone?.toLowerCase().includes(t) ||
      r.email?.toLowerCase().includes(t) ||
      r.address?.toLowerCase().includes(t)
    )
  })

  const paginated = filteredRows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)

  const columnHelper = createColumnHelper()

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'sno',
        header: 'S.No',
        cell: ({ row }) => pageIndex * pageSize + row.index + 1
      }),

      columnHelper.display({
        id: 'action',
        header: 'Action',
        cell: ({ row }) => (
          <Box display='flex' alignItems='center' gap={1}>
            <IconButton color='primary' size='small'>
              <EditIcon fontSize='small' />
            </IconButton>

            <IconButton color='error' size='small'>
              <DeleteIcon fontSize='small' />
            </IconButton>
          </Box>
        )
      }),

      columnHelper.accessor('companyCode', { header: 'Company Code' }),
      columnHelper.accessor('name', { header: 'Name' }),
      columnHelper.accessor('phone', { header: 'Phone' }),
      columnHelper.accessor('email', { header: 'Email' }),
      columnHelper.accessor('address', { header: 'Address' }),
      columnHelper.accessor('status', { header: 'Status' })
    ],
    [pageIndex, pageSize]
  )

  const table = useReactTable({
   data: filteredRows,

    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  const pageCount = Math.ceil(filteredRows.length / pageSize) || 1

  return (
    <Card sx={{ p: 3 }}>
      {/* ================================================= */}
      {/*                 BREADCRUMB FIXED                  */}
      {/* ================================================= */}
      <Box mb={2}>
        <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary' }}>
          <Link href='/admin/dashboard'>Home</Link> / <b>Company Origin List</b>
        </Typography>
      </Box>

      {/* ================================================= */}
      {/*             HEADER → Refresh + Add Button         */}
      {/* ================================================= */}
      <CardHeader
        title={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* LEFT */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant='h5' sx={{ fontWeight: 600 }}>
                Company Origin List
              </Typography>

              <Button
                variant='contained'
                startIcon={<RefreshIcon />}
                onClick={loadData}
                disabled={loading}
                sx={{ textTransform: 'none' }}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </Box>

            {/* RIGHT: ADD COMPANY */}
            <Button
              variant='contained'
              color='secondary'
              href='/admin/company-origin/add'
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Add Company
            </Button>
          </Box>
        }
        sx={{ pb: 1 }}
      />

      <Divider sx={{ mb: 3 }} />

      {/* ================================================= */}
      {/*     PAGE ENTRIES + SEARCH → Same Row (Right)     */}
      {/* ================================================= */}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2, mb: 3 }}>
        {/* Entries */}
        <Select
          size='small'
          value={pageSize}
          onChange={e => setPagination({ pageIndex: 0, pageSize: Number(e.target.value) })}
          sx={{ width: 130 }}
        >
          {[5, 10, 25, 50].map(s => (
            <MenuItem key={s} value={s}>
              {s} entries
            </MenuItem>
          ))}
        </Select>

        {/* Search */}
        <CustomTextField
          size='small'
          placeholder='Search...'
          value={searchText}
          onChange={e => {
            setSearchText(e.target.value)
            setPagination({ ...pagination, pageIndex: 0 })
          }}
          sx={{ width: 300 }}
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

      {/* ================================================= */}
      {/*                     TABLE                         */}
      {/* ================================================= */}

      <div className='overflow-x-auto'>
        <table className={tableStyles.table}>
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map((header, idx) => (
                  <th key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {table.getRowModel().rows.length ? (
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
                  No results found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <Box
        sx={{
          mt: 2,
          borderTop: '1px solid #e0e0e0',
          py: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography color='text.disabled'>
          {`Showing ${
            filteredRows.length === 0 ? 0 : pageIndex * pageSize + 1
          } to ${Math.min((pageIndex + 1) * pageSize, filteredRows.length)} of ${
            filteredRows.length
          } entries`}
        </Typography>

        <Pagination
          shape='rounded'
          color='primary'
          variant='tonal'
          count={Math.max(1, pageCount)}
          page={pageIndex + 1}
          onChange={(_, page) => setPagination({ ...pagination, pageIndex: page - 1 })}
          showFirstButton
          showLastButton
        />
      </Box>
    </Card>
  )
}
