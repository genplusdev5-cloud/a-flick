'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Box,
  Card,
  CardHeader,
  Typography,
  Breadcrumbs,
  Menu,
  MenuItem,
  InputAdornment,
  FormControl,
  Select,
  Chip
} from '@mui/material'

import StickyListLayout from '@/components/common/StickyListLayout'
import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'

import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import PrintIcon from '@mui/icons-material/Print'
import FileDownloadIcon from '@mui/icons-material/FileDownload'

import { useReactTable, getCoreRowModel, flexRender, createColumnHelper } from '@tanstack/react-table'
import PermissionGuard from '@/components/auth/PermissionGuard'

import styles from '@core/styles/table.module.css'

const DUMMY_ROWS = [
  {
    id: 1,
    transferNo: 'TR-001',
    transferDate: '06-01-2026',
    supplyBranch: 'Boys Mobiles B10',
    quantity: 2,
    amount: 32000,
    status: 'Pending'
  }
]

const TransferRequestPage = () => {
  const columnHelper = createColumnHelper()

  const columns = useMemo(
    () => [
      columnHelper.accessor('id', { header: 'ID #' }),
      columnHelper.accessor('transferNo', { header: 'Transfer No' }),
      columnHelper.accessor('transferDate', { header: 'Transfer Date' }),
      columnHelper.accessor('supplyBranch', { header: 'Supply Branch' }),
      columnHelper.accessor('quantity', { header: 'Total Qty' }),
      columnHelper.accessor('amount', {
        header: 'Total Amount',
        cell: i => `₹ ${i.getValue()}`
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: i => <Chip label={i.getValue()} color='warning' size='small' />
      })
    ],
    []
  )

  const [rows] = useState(DUMMY_ROWS)
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [exportAnchorEl, setExportAnchorEl] = useState(null)

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel()
  })

  return (
    <StickyListLayout
      header={
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link href='/'>Dashboard</Link>
          <Typography>Transfer Request</Typography>
        </Breadcrumbs>
      }
    >
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardHeader
          title={<Typography variant='h5'>Transfer Request</Typography>}
          action={
            <Box display='flex' gap={2}>
              <GlobalButton
                color='secondary'
                endIcon={<ArrowDropDownIcon />}
                onClick={e => setExportAnchorEl(e.currentTarget)}
              >
                Export
              </GlobalButton>

              <Menu anchorEl={exportAnchorEl} open={Boolean(exportAnchorEl)} onClose={() => setExportAnchorEl(null)}>
                <MenuItem>
                  <PrintIcon sx={{ mr: 1 }} /> Print
                </MenuItem>
                <MenuItem>
                  <FileDownloadIcon sx={{ mr: 1 }} /> CSV
                </MenuItem>
              </Menu>

              <GlobalButton variant='contained' startIcon={<AddIcon />}>
                Add Transfer Request
              </GlobalButton>
            </Box>
          }
        />

        <Box sx={{ px: 4, py: 3, display: 'flex', gap: 2 }}>
          <GlobalTextField
            size='small'
            placeholder='Search Transfer No'
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon fontSize='small' />
                </InputAdornment>
              )
            }}
          />
          <FormControl size='small' sx={{ width: 200 }}>
            <Select value=''>
              <MenuItem value=''>Supply Branch</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ flexGrow: 1, px: 4 }}>
          <StickyTableWrapper rowCount={rows.length}>
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
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </StickyTableWrapper>
        </Box>

        <Box sx={{ px: 4, py: 2 }}>
          <TablePaginationComponent totalCount={rows.length} pagination={pagination} setPagination={setPagination} />
        </Box>
      </Card>
    </StickyListLayout>
  )
}

export default function TransferRequestPageWrapper() {
  return (
    <PermissionGuard permission='Transfer Request'>
      <TransferRequestPage />
    </PermissionGuard>
  )
}
