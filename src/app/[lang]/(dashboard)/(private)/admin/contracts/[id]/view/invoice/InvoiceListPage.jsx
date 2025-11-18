'use client'

import { useEffect, useState } from 'react'
import {
  Box,
  Card,
  CardHeader,
  Typography,
  Divider,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  FormControl,
  Select,
  MenuItem
} from '@mui/material'

import {
  listInvoices,
  addInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoiceDetails
} from '@/api/contract/details/invoice'

import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'
import AddIcon from '@mui/icons-material/Add'
import PrintIcon from '@mui/icons-material/Print'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import RefreshIcon from '@mui/icons-material/Refresh'
import { useParams } from 'next/navigation'

import GlobalButton from '@/components/common/GlobalButton'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import styles from '@core/styles/table.module.css'

export default function InvoiceListPage() {
  const [rows, setRows] = useState([])
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const params = useParams()
  const contractId = params?.id

  useEffect(() => {
    if (contractId) loadInvoices()
  }, [contractId])

  const loadInvoices = async () => {
    try {
      const res = await listInvoices({ contract_id: contractId })
      const data = res?.data?.data?.results || []

      const formatted = data.map(item => ({
        id: item.id,
        invDate: item.invoice_date,
        invNo: item.invoice_number || '-',
        invFrequency: item.invoice_frequency_id,
        svcFrequency: item.service_frequency || '-',
        valueServices: item.value_services || 0,
        lastSvcDate: item.last_service_date || '-',
        contractCode: item.contract_code || '-',
        cardId: item.card_id || '-',
        billingName: item.billing_name || '-',
        origin: item.origin || '-',
        amount: item.amount,
        tax: item.gst,
        taxAmount: item.gst_old || 0,
        totalAmount: item.amount + item.gst,
        accountCode: item.account_number || '-',
        poNo: item.po_no || '-',
        issued: item.is_issued ? 'Yes' : 'No',
        myob: item.is_myob ? 'Synced' : 'Pending'
      }))

      setRows(formatted)
    } catch (err) {
      console.log(err)
      showToast('error', 'Failed to load invoices')
    }
  }

  // ------------------- COLUMNS -------------------
  const columns = [
    { id: 'id', header: 'ID' },

    {
      id: 'actions',
      header: 'Action',
      cell: row => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size='small' color='info'>
            <VisibilityIcon />
          </IconButton>
          <IconButton size='small' color='primary'>
            <EditIcon />
          </IconButton>
          <IconButton size='small' color='error'>
            <DeleteIcon />
          </IconButton>
        </Box>
      )
    },

    { id: 'invDate', header: 'INV.Date' },
    { id: 'invNo', header: 'INV.No' },
    { id: 'invFrequency', header: 'INV.Frequency' },
    { id: 'svcFrequency', header: 'SVC Frequency' },
    { id: 'valueServices', header: 'No.Of Value Services' },
    { id: 'lastSvcDate', header: 'Last SVC Date' },
    { id: 'contractCode', header: 'Contract Code' },
    { id: 'cardId', header: 'Card ID' },
    { id: 'billingName', header: 'Billing Name' },
    { id: 'origin', header: 'Origin' },
    { id: 'amount', header: 'Amount', cell: r => `₹ ${r.amount}` },
    { id: 'tax', header: 'Tax' },
    { id: 'taxAmount', header: 'Tax Amount', cell: r => `₹ ${r.taxAmount}` },
    { id: 'totalAmount', header: 'Total Amount', cell: r => `₹ ${r.totalAmount}` },
    { id: 'accountCode', header: 'Account Item Code' },
    { id: 'poNo', header: 'PO.No' },

    {
      id: 'issued',
      header: 'Issued?',
      cell: row => <Chip label={row.issued} size='small' color={row.issued === 'Yes' ? 'success' : 'warning'} />
    },

    {
      id: 'myob',
      header: 'MYOB',
      cell: row => <Chip label={row.myob} size='small' color={row.myob === 'Synced' ? 'success' : 'default'} />
    }
  ]

  // ------------------- SEARCH FILTER -------------------
  const filtered = rows.filter(r => JSON.stringify(r).toLowerCase().includes(searchText.toLowerCase()))

  // ------------------- PAGINATION -------------------
  const paginated = filtered.slice(
    pagination.pageIndex * pagination.pageSize,
    pagination.pageIndex * pagination.pageSize + pagination.pageSize
  )

  return (
    <Box className='mt-2'>
      <Card sx={{ p: 3 }}>
        {/* ---------------------- TOP HEADER ---------------------- */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3
          }}
        >
          {/* LEFT: Title + Refresh */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant='h5' fontWeight={600}>
              Invoice List
            </Typography>

            <GlobalButton
              variant='contained'
              color='primary'
              sx={{ height: 36, textTransform: 'none', fontWeight: 500 }}
              onClick={loadInvoices}
              startIcon={<RefreshIcon />}
            >
              Refresh
            </GlobalButton>
          </Box>

          {/* RIGHT: Export + Add */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <GlobalButton
              variant='outlined'
              color='secondary'
              endIcon={<PrintIcon />}
              sx={{ height: 36, textTransform: 'none', fontWeight: 500 }}
            >
              Export
            </GlobalButton>

            <GlobalButton
              variant='contained'
              startIcon={<AddIcon />}
              sx={{ height: 36, textTransform: 'none', fontWeight: 500 }}
            >
              Add Invoice
            </GlobalButton>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* ---------------------- FILTERS: Entries + Search ---------------------- */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          {/* LEFT: Page Entries Dropdown */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant='body2' fontWeight={500}>
              Show
            </Typography>

            <FormControl size='small' sx={{ width: 120 }}>
              <Select
                value={pagination.pageSize}
                onChange={e =>
                  setPagination(prev => ({
                    ...prev,
                    pageSize: Number(e.target.value),
                    pageIndex: 0
                  }))
                }
              >
                {[10, 25, 50, 100].map(size => (
                  <MenuItem key={size} value={size}>
                    {size} entries
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* RIGHT: Search bar */}
          <TextField
            size='small'
            placeholder='Search invoice...'
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            sx={{ width: 350 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
        </Box>

        {/* TABLE */}
        <div className='overflow-x-auto'>
          <table className={styles.table}>
            <thead>
              <tr>
                {columns.map(col => (
                  <th key={col.id}>{col.header}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {paginated.length ? (
                paginated.map(row => (
                  <tr key={row.id}>
                    {columns.map(col => (
                      <td key={col.id}>{col.cell ? col.cell(row) : row[col.id]}</td>
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

        {/* PAGINATION */}
        <TablePaginationComponent totalCount={filtered.length} pagination={pagination} setPagination={setPagination} />
      </Card>
    </Box>
  )
}
