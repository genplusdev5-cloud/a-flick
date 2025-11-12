'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'

// React Table Imports
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import TablePaginationComponent from '@components/TablePaginationComponent'

// Styles
import tableStyles from '@core/styles/table.module.css'

const columnHelper = createColumnHelper()

const InvoiceListPage = () => {
  const { lang: locale } = useParams()
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)

  // ✅ Your invoice data
  const [data, setData] = useState([
    {
      id: 1,
      invDate: '01-11-2025',
      invNo: 'INV001',
      invFrequency: 'Monthly',
      svcFrequency: 'Quarterly',
      noOfServices: 2,
      lastSvcDate: '28-10-2025',
      contractCode: 'MJC0385',
      cardId: 'CARD001',
      billingName: 'Extra Space Tai Seng Pte Ltd',
      address: '14 Little Road, Singapore',
      amount: '150.00',
      tax: '10.00',
      taxAmount: '10.00',
      total: '160.00',
      accountItemCode: 'AIC001',
      poNo: 'PO001',
      issued: true,
      myob: 'Imported'
    },
    {
      id: 2,
      invDate: '05-11-2025',
      invNo: 'INV002',
      invFrequency: 'Quarterly',
      svcFrequency: 'Monthly',
      noOfServices: 4,
      lastSvcDate: '02-11-2025',
      contractCode: 'MJC0386',
      cardId: 'CARD002',
      billingName: 'Red Lantern Catering Culture Pte Ltd',
      address: '21 Cheong Chin Nam Road, Singapore',
      amount: '220.00',
      tax: '20.00',
      taxAmount: '20.00',
      total: '240.00',
      accountItemCode: 'AIC002',
      poNo: 'PO002',
      issued: false,
      myob: 'Pending'
    }
  ])

  // ✅ Local pagination state (required for your pagination component)
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  // ✅ Table setup
  const columns = useMemo(
    () => [
      columnHelper.accessor('invDate', { header: 'INV.Date' }),
      columnHelper.accessor('invNo', { header: 'INV.No' }),
      columnHelper.accessor('invFrequency', { header: 'INV.Frequency' }),
      columnHelper.accessor('svcFrequency', { header: 'SVC Frequency' }),
      columnHelper.accessor('noOfServices', { header: 'No.Of Value Services' }),
      columnHelper.accessor('lastSvcDate', { header: 'Last SVC Date' }),
      columnHelper.accessor('contractCode', { header: 'Contract Code' }),
      columnHelper.accessor('cardId', { header: 'Card ID' }),
      columnHelper.accessor('billingName', { header: 'Billing Name' }),
      columnHelper.accessor('address', { header: 'Service Address' }),
      columnHelper.accessor('amount', {
        header: 'Amount',
        cell: info => `₹ ${info.getValue()}`
      }),
      columnHelper.accessor('tax', {
        header: 'Tax',
        cell: info => `₹ ${info.getValue()}`
      }),
      columnHelper.accessor('taxAmount', {
        header: 'Tax Amount',
        cell: info => `₹ ${info.getValue()}`
      }),
      columnHelper.accessor('total', {
        header: 'Total Amount',
        cell: info => <strong>₹ {info.getValue()}</strong>
      }),
      columnHelper.accessor('accountItemCode', { header: 'Account Item Code' }),
      columnHelper.accessor('poNo', { header: 'PO.No' }),
      columnHelper.accessor('issued', {
        header: 'Issued?',
        cell: info => (
          <Chip
            label={info.getValue() ? 'Yes' : 'No'}
            color={info.getValue() ? 'success' : 'warning'}
            size='small'
            sx={{ color: '#fff', fontWeight: 600 }}
          />
        )
      }),
      columnHelper.accessor('myob', { header: 'MYOB' }),
      columnHelper.accessor('action', {
        header: 'Action',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <IconButton
              onClick={() => setData(data.filter(invoice => invoice.id !== row.original.id))}
              size='small'
            >
              <i className='tabler-trash text-textSecondary' />
            </IconButton>
            <Link href={`/apps/invoice/preview/${row.original.id}`} className='flex'>
              <i className='tabler-eye text-textSecondary text-base' />
            </Link>
          </div>
        ),
        enableSorting: false
      })
    ],
    [data]
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { pagination },
    onPaginationChange: setPagination
  })

  const handleClick = event => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)

  const totalCount = data.length

  return (
    <Card>
      {/* Header */}
      <CardHeader
        title='Invoice List'
        sx={{ '& .MuiCardHeader-action': { m: 0 } }}
        className='flex items-center justify-between flex-wrap gap-4'
        action={
          <div className='flex items-center gap-4 flex-wrap'>
            <div className='flex items-center gap-2'>
              <Typography>Show</Typography>
              <CustomTextField
                select
                value={pagination.pageSize}
                onChange={e => setPagination(prev => ({ ...prev, pageSize: Number(e.target.value) }))}
                className='is-[70px]'
              >
                <MenuItem value='10'>10</MenuItem>
                <MenuItem value='25'>25</MenuItem>
                <MenuItem value='50'>50</MenuItem>
              </CustomTextField>
            </div>

            <Button
              variant='tonal'
              aria-haspopup='true'
              onClick={handleClick}
              color='secondary'
              aria-expanded={open ? 'true' : undefined}
              endIcon={<i className='tabler-upload' />}
              aria-controls={open ? 'invoice-export-menu' : undefined}
            >
              Export
            </Button>
            <Menu open={open} anchorEl={anchorEl} onClose={handleClose} id='invoice-export-menu'>
              <MenuItem onClick={handleClose} className='uppercase'>
                PDF
              </MenuItem>
              <MenuItem onClick={handleClose} className='uppercase'>
                XLSX
              </MenuItem>
              <MenuItem onClick={handleClose} className='uppercase'>
                CSV
              </MenuItem>
            </Menu>
          </div>
        }
      />

      {/* Table */}
      <div className='overflow-x-auto'>
        <table className={tableStyles.table}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length ? (
              table
                .getRowModel()
                .rows.slice(
                  pagination.pageIndex * pagination.pageSize,
                  (pagination.pageIndex + 1) * pagination.pageSize
                )
                .map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
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

      {/* ✅ Pagination using your existing component */}
      <TablePaginationComponent
        table={table}
        totalCount={totalCount}
        pagination={pagination}
        setPagination={setPagination}
      />
    </Card>
  )
}

export default InvoiceListPage
