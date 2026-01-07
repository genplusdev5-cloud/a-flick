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
    brand: 'Samsung',
    model: 'Galaxy A15',
    variant: '4GB / 128GB',
    color: 'Black',
    opening: 10,
    inward: 5,
    outward: 3,
    closing: 12,
    status: 'Available'
  },
  {
    id: 2,
    brand: 'Apple',
    model: 'iPhone 14',
    variant: '128GB',
    color: 'Blue',
    opening: 4,
    inward: 2,
    outward: 5,
    closing: 1,
    status: 'Low Stock'
  }
]

const StockSummaryPage = () => {
  const columnHelper = createColumnHelper()

  const columns = useMemo(
    () => [
      columnHelper.accessor('brand', { header: 'Brand' }),
      columnHelper.accessor('model', { header: 'Model' }),
      columnHelper.accessor('variant', { header: 'Variant' }),
      columnHelper.accessor('color', { header: 'Color' }),
      columnHelper.accessor('opening', { header: 'Opening Stock' }),
      columnHelper.accessor('inward', { header: 'Inward' }),
      columnHelper.accessor('outward', { header: 'Outward' }),
      columnHelper.accessor('closing', { header: 'Closing Stock' }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: i => (
          <Chip
            label={i.getValue()}
            color={i.getValue() === 'Available' ? 'success' : 'warning'}
            size='small'
          />
        )
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
          <Typography>Stock Summary</Typography>
        </Breadcrumbs>
      }
    >
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardHeader
          title={<Typography variant='h5' fontWeight={600}>Stock Summary</Typography>}
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

        {/* Filters */}
        <Box sx={{ px: 4, py: 3, display: 'flex', gap: 2 }}>
          <GlobalTextField
            size='small'
            placeholder='Search Brand / Model'
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon fontSize='small' />
                </InputAdornment>
              )
            }}
            sx={{ width: 260 }}
          />
          <FormControl size='small' sx={{ width: 180 }}>
            <Select value=''>
              <MenuItem value=''>All Brands</MenuItem>
            </Select>
          </FormControl>
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

        {Box && (
          <Box sx={{ px: 4, py: 2 }}>
            <TablePaginationComponent
              totalCount={rows.length}
              pagination={pagination}
              setPagination={setPagination}
            />
          </Box>
        )}
      </Card>
    </StickyListLayout>
  )
}

export default function StockSummaryPageWrapper() {
  return (
    <PermissionGuard permission='Stock Summary'>
      <StockSummaryPage />
    </PermissionGuard>
  )
}
