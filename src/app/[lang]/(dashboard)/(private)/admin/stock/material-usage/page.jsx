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
  Chip
} from '@mui/material'

import StickyListLayout from '@/components/common/StickyListLayout'
import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'

import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import SearchIcon from '@mui/icons-material/Search'
import PrintIcon from '@mui/icons-material/Print'
import FileDownloadIcon from '@mui/icons-material/FileDownload'

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table'

import PermissionGuard from '@/components/auth/PermissionGuard'

import styles from '@core/styles/table.module.css'

const DUMMY_ROWS = [
  {
    id: 1,
    date: '06-01-2026',
    material: 'Samsung Galaxy A15',
    usedQty: 1,
    reference: 'Service Request',
    remarks: 'Installation'
  },
  {
    id: 2,
    date: '05-01-2026',
    material: 'iPhone 14',
    usedQty: 1,
    reference: 'Transfer Out',
    remarks: 'Branch Transfer'
  }
]

const MaterialUsagePage = () => {
  const columnHelper = createColumnHelper()

  const columns = useMemo(
    () => [
      columnHelper.accessor('date', { header: 'Date' }),
      columnHelper.accessor('material', { header: 'Material / Item' }),
      columnHelper.accessor('usedQty', { header: 'Used Qty' }),
      columnHelper.accessor('reference', {
        header: 'Reference',
        cell: i => <Chip label={i.getValue()} size='small' color='info' />
      }),
      columnHelper.accessor('remarks', { header: 'Remarks' })
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
          <Typography>Material Usage</Typography>
        </Breadcrumbs>
      }
    >
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardHeader
          title={<Typography variant='h5' fontWeight={600}>Material Usage</Typography>}
          action={
            <GlobalButton
              color='secondary'
              endIcon={<ArrowDropDownIcon />}
              onClick={e => setExportAnchorEl(e.currentTarget)}
            >
              Export
            </GlobalButton>
          }
        />

        <Menu
          anchorEl={exportAnchorEl}
          open={Boolean(exportAnchorEl)}
          onClose={() => setExportAnchorEl(null)}
        >
          <MenuItem><PrintIcon sx={{ mr: 1 }} /> Print</MenuItem>
          <MenuItem><FileDownloadIcon sx={{ mr: 1 }} /> CSV</MenuItem>
        </Menu>

        <Box sx={{ px: 4, py: 3 }}>
          <GlobalTextField
            size='small'
            placeholder='Search material usage'
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon fontSize='small' />
                </InputAdornment>
              )
            }}
            sx={{ width: 280 }}
          />
        </Box>

        {/* Table */}
        <Box sx={{ flexGrow: 1, px: 4 }}>
          <StickyTableWrapper rowCount={rows.length}>
            <table className={styles.table}>
              <thead>
                {table.getHeaderGroups().map(hg => (
                  <tr key={hg.id}>
                    {hg.headers.map(h => (
                      <th key={h.id}>
                        {flexRender(h.column.columnDef.header, h.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </StickyTableWrapper>
        </Box>

        <Box sx={{ px: 4, py: 2 }}>
          <TablePaginationComponent
            totalCount={rows.length}
            pagination={pagination}
            setPagination={setPagination}
          />
        </Box>
      </Card>
    </StickyListLayout>
  )
}

export default function MaterialUsagePageWrapper() {
  return (
    <PermissionGuard permission='Material Usage'>
      <MaterialUsagePage />
    </PermissionGuard>
  )
}
