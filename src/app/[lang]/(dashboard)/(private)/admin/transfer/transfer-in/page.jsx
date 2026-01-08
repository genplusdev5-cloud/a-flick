'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import {
  Box,
  Card,
  CardHeader,
  Typography,
  Menu,
  MenuItem,
  Divider,
  Breadcrumbs,
  Chip,
  FormControl,
  Select,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  IconButton
} from '@mui/material'

import StickyListLayout from '@/components/common/StickyListLayout'
import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import TablePaginationComponent from '@/components/TablePaginationComponent'

import { getTransferInList } from '@/api/transfer_in'
import { getPurchaseFilters } from '@/api/purchase_order'

import { format } from 'date-fns'

import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import PresetDateRangePicker from '@/components/common/PresetDateRangePicker'

import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import PrintIcon from '@mui/icons-material/Print'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import RefreshIcon from '@mui/icons-material/Refresh'
import { ChevronRight } from '@mui/icons-material'

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table'

import PermissionGuard from '@/components/auth/PermissionGuard'
import classnames from 'classnames'
import styles from '@core/styles/table.module.css'

/* ───────────────────────────── */

const statusOptions = [
  { label: 'Pending', value: 'Pending' },
  { label: 'Completed', value: 'Completed' }
]

const TransferInPage = () => {
  const columnHelper = createColumnHelper()
  const router = useRouter()

  // FILTER OPTIONS
  const [originOptions, setOriginOptions] = useState([])
  const [supplierOptions, setSupplierOptions] = useState([])

  // FILTER VALUES
  const [selectedOrigin, setSelectedOrigin] = useState(null)
  const [selectedSupplier, setSelectedSupplier] = useState(null)

  // STATE
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [sorting, setSorting] = useState([])
  const [exportAnchorEl, setExportAnchorEl] = useState(null)

  const [uiDateFilter, setUiDateFilter] = useState(false)
  const [uiDateRange, setUiDateRange] = useState([null, null])

  /* ───────── FETCH FILTERS ───────── */
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await getPurchaseFilters()
        const companyList = res?.data?.data?.company?.name || []
        const supplierList = res?.data?.data?.supplier?.name || []

        setOriginOptions(companyList.map(c => ({ label: c.name, value: c.id })))
        setSupplierOptions(supplierList.map(s => ({ label: s.name, value: s.id })))
      } catch (e) {
        console.error('Filter fetch failed', e)
      }
    }

    fetchFilters()
  }, [])

  /* ───────── FETCH LIST ───────── */
  const fetchTransferInList = async () => {
    try {
      setLoading(true)

      const res = await getTransferInList({
        page: pagination.pageIndex + 1,
        page_size: pagination.pageSize,
        origin: selectedOrigin?.value,
        supplier: selectedSupplier?.value,
        start_date: uiDateFilter ? uiDateRange[0] : undefined,
        end_date: uiDateFilter ? uiDateRange[1] : undefined
      })

      setTotalCount(res?.count || 0)

      const mapped =
        res?.data?.results?.map((item, index) => ({
          sno: pagination.pageIndex * pagination.pageSize + (index + 1),
          id: item.id,
          origin: item.from_company || '-',
          transferInNo: item.transfer_in_no || item.num_series,
          transferInDate: item.transfer_in_date ? format(new Date(item.transfer_in_date), 'dd/MM/yyyy') : '-',
          supplierName: item.to_company || '-',
          contactEmail: item?.contact_email || '-',
          contactPhone: item?.contact_phone || '-',
          remarks: item.remarks || '-',
          status: item.status,
          recordType: item.record_type || 'tm'
        })) || []

      setRows(mapped)
    } catch (e) {
      console.error('Transfer In list error', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransferInList()
  }, [pagination.pageIndex, pagination.pageSize, selectedOrigin, selectedSupplier, uiDateFilter, uiDateRange])

  /* ───────── COLUMNS ───────── */
  const columns = useMemo(
    () => [
      columnHelper.accessor('sno', { header: 'S.No' }),

      columnHelper.display({
        id: 'action',
        header: 'Action',
        enableSorting: false,
        cell: info => {
          const r = info.row.original
          return (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                size='small'
                color='primary'
                onClick={() => router.push(`/admin/transfer/transfer-in/update/${btoa(r.id)}?type=${r.recordType}`)}
              >
                <i className='tabler-edit' />
              </IconButton>

              <IconButton size='small' color='error'>
                <i className='tabler-trash' />
              </IconButton>
            </Box>
          )
        }
      }),

      columnHelper.accessor('origin', { header: 'From Company' }),
      columnHelper.accessor('transferInNo', { header: 'Transfer In No.' }),
      columnHelper.accessor('transferInDate', { header: 'Transfer In Date' }),
      columnHelper.accessor('supplierName', { header: 'To Company' }),
      columnHelper.accessor('contactEmail', { header: 'Contact Email' }),
      columnHelper.accessor('contactPhone', { header: 'Contact Phone' }),
      columnHelper.accessor('remarks', { header: 'Remarks' }),

      columnHelper.accessor('status', {
        header: 'Status',
        cell: info => (
          <Chip
            label={info.getValue()}
            color={info.getValue() === 'Completed' ? 'success' : 'warning'}
            size='small'
            sx={{ color: '#fff', fontWeight: 600 }}
          />
        )
      })
    ],
    [router]
  )

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  /* ───────── UI ───────── */
  return (
    <StickyListLayout
      header={
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link href='/'>Dashboard</Link>
          <Typography>Transfer In</Typography>
        </Breadcrumbs>
      }
    >
      <Card sx={{ display: 'flex', flexDirection: 'column', maxHeight: '100%' }}>
        <CardHeader
          title={<Typography variant='h5'>Transfer In</Typography>}
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
                  <PrintIcon fontSize='small' sx={{ mr: 1 }} /> Print
                </MenuItem>
                <MenuItem>
                  <FileDownloadIcon fontSize='small' sx={{ mr: 1 }} /> CSV
                </MenuItem>
              </Menu>

              <GlobalButton
                variant='contained'
                startIcon={<AddIcon />}
                onClick={() => router.push('/admin/transfer/transfer-in/add')}
              >
                Add Transfer In
              </GlobalButton>
            </Box>
          }
        />

        <Divider />

        {/* FILTERS */}
        <Box
          sx={{
            px: 4,
            py: 3,
            display: 'flex',
            alignItems: 'flex-end', // ✅ IMPORTANT
            gap: 2,
            flexWrap: 'wrap'
          }}
        >
          {/* DATE FILTER */}
          <Box sx={{ width: 220 }}>
            <FormControlLabel
              control={<Checkbox checked={uiDateFilter} onChange={e => setUiDateFilter(e.target.checked)} />}
              label='Date Filter'
              sx={{ mb: 0.5 }}
            />

            <PresetDateRangePicker
              start={uiDateRange[0]}
              end={uiDateRange[1]}
              disabled={!uiDateFilter}
              onSelectRange={({ start, end }) => setUiDateRange([start, end])}
            />
          </Box>

          {/* FROM COMPANY */}
          <Box sx={{ width: 220 }}>
            <GlobalAutocomplete
              label='From Company'
              placeholder='Select From Company'
              options={originOptions}
              value={selectedOrigin}
              onChange={(_, val) => {
                setSelectedOrigin(val)
                setPagination(p => ({ ...p, pageIndex: 0 }))
              }}
            />
          </Box>

          {/* TO COMPANY */}
          <Box sx={{ width: 220 }}>
            <GlobalAutocomplete
              label='To Company'
              placeholder='Select To Company'
              options={supplierOptions}
              value={selectedSupplier}
              onChange={(_, val) => {
                setSelectedSupplier(val)
                setPagination(p => ({ ...p, pageIndex: 0 }))
              }}
            />
          </Box>

          {/* REFRESH */}
          <GlobalButton
            variant='contained'
            color='primary'
            startIcon={<RefreshIcon />}
            sx={{ height: 36 }}
            onClick={() => {
              setSelectedOrigin(null)
              setSelectedSupplier(null)
              setUiDateFilter(false)
              setUiDateRange([null, null])
              setPagination(p => ({ ...p, pageIndex: 0 }))
            }}
          >
            Refresh
          </GlobalButton>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* SEARCH + PAGE SIZE */}
        <Box px={4} mb={3} display='flex' justifyContent='space-between'>
          <FormControl size='small' sx={{ width: 140 }}>
            <Select
              value={pagination.pageSize}
              onChange={e => setPagination(p => ({ ...p, pageSize: +e.target.value, pageIndex: 0 }))}
            >
              {[25, 50, 75, 100].map(v => (
                <MenuItem key={v} value={v}>
                  {v} entries
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <GlobalTextField
            size='small'
            placeholder='Search Transfer In No'
            sx={{ width: 320 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon fontSize='small' />
                </InputAdornment>
              )
            }}
          />
        </Box>

        {/* TABLE */}
        <Box px={4} flexGrow={1}>
          <StickyTableWrapper rowCount={rows.length}>
            <table className={styles.table}>
              <thead>
                {table.getHeaderGroups().map(hg => (
                  <tr key={hg.id}>
                    {hg.headers.map(h => (
                      <th key={h.id}>
                        <div
                          className={classnames('flex items-center gap-1', {
                            'cursor-pointer': h.column.getCanSort()
                          })}
                          onClick={h.column.getToggleSortingHandler()}
                        >
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {{
                            asc: <ChevronRight className='-rotate-90' />,
                            desc: <ChevronRight className='rotate-90' />
                          }[h.column.getIsSorted()] ?? null}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={columns.length} align='center'>
                      Loading...
                    </td>
                  </tr>
                ) : table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map(row => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} align='center'>
                      No data found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </StickyTableWrapper>
        </Box>

        <Box px={4} py={2}>
          <TablePaginationComponent totalCount={totalCount} pagination={pagination} setPagination={setPagination} />
        </Box>
      </Card>
    </StickyListLayout>
  )
}

/* ───────── WRAPPER ───────── */
export default function TransferInPageWrapper() {
  return (
    <PermissionGuard permission='Transfer In'>
      <TransferInPage />
    </PermissionGuard>
  )
}
