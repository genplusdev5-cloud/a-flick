'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Box,
  Card,
  CardHeader,
  Typography,
  Breadcrumbs,
  Divider,
  FormControl,
  Select,
  MenuItem,
  Grid
} from '@mui/material'

import StickyListLayout from '@/components/common/StickyListLayout'
import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import PermissionGuard from '@/components/auth/PermissionGuard'
import RefreshIcon from '@mui/icons-material/Refresh'
import GlobalButton from '@/components/common/GlobalButton'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import GlobalDateRange from '@/components/common/GlobalDateRange'

import styles from '@core/styles/table.module.css'
import { createColumnHelper, useReactTable, getCoreRowModel } from '@tanstack/react-table'

import { getSortedRowModel, flexRender } from '@tanstack/react-table'
import ChevronRight from '@menu/svg/ChevronRight'
import classnames from 'classnames'

const CustomerAuditPageContent = () => {
  const [rows, setRows] = useState([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [customerFilter, setCustomerFilter] = useState('')
  const [modifiedByFilter, setModifiedByFilter] = useState('')
  const [dateRange, setDateRange] = useState({
    start: null,
    end: null
  })

  // 🔹 TEMP dummy (API later)
  useEffect(() => {
    setRows([])
  }, [])

  const columnHelper = createColumnHelper()
  const [sorting, setSorting] = useState([])

  const columns = useMemo(
    () => [
      columnHelper.accessor('sno', {
        header: 'S.No'
      }),

      columnHelper.accessor('modified_on', { header: 'Modified On' }),
      columnHelper.accessor('customer', { header: 'Customer' }),
      columnHelper.accessor('field', { header: 'Field' }),
      columnHelper.accessor('old', { header: 'Old' }),
      columnHelper.accessor('new', { header: 'New' }),
      columnHelper.accessor('modified_by', { header: 'Modified By' })
    ],
    [pagination]
  )

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,

    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  return (
    <StickyListLayout
      header={
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link href='/' style={{ textDecoration: 'none' }}>
            Dashboard
          </Link>
          <Typography color='text.primary'>Audit Trial - Customer</Typography>
        </Breadcrumbs>
      }
    >
      <Card sx={{ display: 'flex', flexDirection: 'column', maxHeight: '100%', minHeight: 0 }}>
        {/* 🔥 HEADER EXACT LIKE TAX */}
        <CardHeader
          title={
            <Box display='flex' alignItems='center' gap={2}>
              <Typography variant='h5' sx={{ fontWeight: 600 }}>
                Customer Audit
              </Typography>

              <GlobalButton
                startIcon={<RefreshIcon />}
                onClick={() => {
                  console.log('Refresh clicked')
                }}
              >
                Refresh
              </GlobalButton>
            </Box>
          }
          sx={{
            pb: 1.5,
            pt: 5,
            px: 10,
            '& .MuiCardHeader-title': {
              fontWeight: 600,
              fontSize: '1.125rem'
            }
          }}
        />

        <Divider />

        {/* 🔥 BODY */}
        <Box sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* FILTERS */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <GlobalDateRange
                label='Date Filter'
                start={dateRange.start}
                end={dateRange.end}
                onSelectRange={({ start, end }) => {
                  setDateRange({ start, end })
                }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <GlobalAutocomplete label='Customer' placeholder='Select' options={[]} />
            </Grid>
            <Grid item xs={12} md={3}>
              <GlobalAutocomplete label='Modified By' placeholder='Select' options={[]} />
            </Grid>
          </Grid>
          <Divider />

          {/* TOP CONTROLS */}
          <Box
            sx={{
              mb: 3,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant='body2'>Show</Typography>
              <FormControl size='small' sx={{ width: 140 }}>
                <Select
                  value={pagination.pageSize}
                  onChange={e => setPagination(p => ({ ...p, pageSize: Number(e.target.value) }))}
                >
                  {[10, 25, 50].map(v => (
                    <MenuItem key={v} value={v}>
                      {v} entries
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Typography variant='body2' color='text.secondary'>
              Search coming later
            </Typography>
          </Box>

          {/* TABLE */}
          <Box sx={{ flexGrow: 1, minHeight: 0 }}>
            <StickyTableWrapper rowCount={rows.length}>
              <table className={styles.table}>
                <thead>
                  {table.getHeaderGroups().map(hg => (
                    <tr key={hg.id}>
                      {hg.headers.map(h => (
                        <th key={h.id}>
                          <div
                            className={classnames({
                              'flex items-center cursor-pointer select-none': h.column.getCanSort()
                            })}
                            onClick={h.column.getToggleSortingHandler()}
                          >
                            {flexRender(h.column.columnDef.header, h.getContext())}
                            {{
                              asc: <ChevronRight className='-rotate-90 ml-1' />,
                              desc: <ChevronRight className='rotate-90 ml-1' />
                            }[h.column.getIsSorted()] ?? null}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>

                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className='text-center py-4'>
                        No data available in the table.
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map(row => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id}>{cell.renderValue()}</td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </StickyTableWrapper>
          </Box>

          {/* PAGINATION */}
          <Box sx={{ mt: 'auto', pt: 2 }}>
            <TablePaginationComponent totalCount={rows.length} pagination={pagination} setPagination={setPagination} />
          </Box>
        </Box>
      </Card>
    </StickyListLayout>
  )
}

export default function CustomerAuditPage() {
  return (
    <PermissionGuard permission='Customer Audit'>
      <CustomerAuditPageContent />
    </PermissionGuard>
  )
}
