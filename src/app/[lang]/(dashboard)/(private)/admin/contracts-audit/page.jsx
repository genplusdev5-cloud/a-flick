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
  Grid,
  FormControl,
  Select,
  MenuItem
} from '@mui/material'

import PermissionGuard from '@/components/auth/PermissionGuard'
import StickyListLayout from '@/components/common/StickyListLayout'
import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import GlobalButton from '@/components/common/GlobalButton'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import GlobalDateRange from '@/components/common/GlobalDateRange'

import RefreshIcon from '@mui/icons-material/Refresh'

import styles from '@core/styles/table.module.css'
import classnames from 'classnames'
import ChevronRight from '@menu/svg/ChevronRight'

import {
  createColumnHelper,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender
} from '@tanstack/react-table'

const ContractsAuditPageContent = () => {
  const [rows, setRows] = useState([])
  const [sorting, setSorting] = useState([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 })

  // dummy load (API later)
  useEffect(() => {
    setRows([])
  }, [])

  const columnHelper = createColumnHelper()

  const columns = useMemo(
    () => [
      columnHelper.accessor('sno', {
        header: 'S.No'
      }),
      columnHelper.accessor('modified_on', { header: 'Modified On' }),
      columnHelper.accessor('contract', { header: 'Contract' }),
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
          <Typography color='text.primary'>Audit Trial - Contract</Typography>
        </Breadcrumbs>
      }
    >
      <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        {/* HEADER */}
        <CardHeader
          title={
            <Box display='flex' alignItems='center' gap={2}>
              <Typography variant='h5' fontWeight={600}>
                Contracts Audit
              </Typography>

              <GlobalButton startIcon={<RefreshIcon />}>Refresh</GlobalButton>
            </Box>
          }
          sx={{
            pb: 1.5,
            pt: 5,
            px: 10,
            '& .MuiCardHeader-title': { fontSize: '1.125rem' }
          }}
        />

        <Divider />

        {/* BODY */}
        <Box sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* FILTERS */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <GlobalDateRange label='Date Filter' />
            </Grid>

            <Grid item xs={12} md={3}>
              <GlobalAutocomplete label='Customer' placeholder='Select' options={[]} />
            </Grid>

            <Grid item xs={12} md={3}>
              <GlobalAutocomplete label='Contracts' placeholder='Select' options={[]} />
            </Grid>


            <Grid item xs={12} md={3}>
              <GlobalAutocomplete
                label='List by'
                placeholder='Contract'
                options={[
                  { label: 'Contract', value: 'contract' },
                  { label: 'Customer', value: 'customer' }
                ]}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <GlobalAutocomplete label='Modified By' placeholder='Select' options={[]} />
            </Grid>

            <Grid item xs={12} md={2}>
              <GlobalButton variant='contained' fullWidth sx={{ height: 40 }}>
                Refresh
              </GlobalButton>
            </Grid>
          </Grid>

          {/* TOP CONTROLS */}
          <Box
            sx={{
              mb: 3,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Box display='flex' alignItems='center' gap={1}>
              <Typography variant='body2'>Show</Typography>
              <FormControl size='small' sx={{ width: 120 }}>
                <Select
                  value={pagination.pageSize}
                  onChange={e => setPagination(p => ({ ...p, pageSize: Number(e.target.value) }))}
                >
                  {[10, 25, 50, 100].map(v => (
                    <MenuItem key={v} value={v}>
                      {v} entries
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Typography variant='body2' color='text.secondary'>
              Search:
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
                              'flex items-center select-none': true,
                              'cursor-pointer': h.column.getCanSort()
                            })}
                            onClick={h.column.getCanSort() ? h.column.getToggleSortingHandler() : undefined}
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
                          <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
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

export default function ContractsAuditPage() {
  return (
    <PermissionGuard permission='Contracts Audit'>
      <ContractsAuditPageContent />
    </PermissionGuard>
  )
}
