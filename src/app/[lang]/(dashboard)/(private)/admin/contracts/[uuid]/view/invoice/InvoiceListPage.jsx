'use client'

import { useEffect, useState } from 'react'
import {
  Box,
  Card,
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

import StickyTableWrapper from '@/components/common/StickyTableWrapper'
import {
  listInvoices
} from '@/api/contract/details/invoice'

import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'
import AddIcon from '@mui/icons-material/Add'
import PrintIcon from '@mui/icons-material/Print'
import RefreshIcon from '@mui/icons-material/Refresh'
import { useParams } from 'next/navigation'

import GlobalButton from '@/components/common/GlobalButton'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import styles from '@core/styles/table.module.css'
import { showToast } from '@/components/common/Toasts'

export default function InvoiceListPage() {
  const [rows, setRows] = useState([])
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const params = useParams()
  const contractId = params?.uuid || params?.id

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
        totalAmount: (item.amount || 0) + (item.gst || 0),
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

  useEffect(() => {
    if (contractId) loadInvoices()
  }, [contractId])

  const columns = [
    { id: 'id', header: 'ID' },
    {
      id: 'actions',
      header: 'Action',
      cell: row => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size='small' color='info'><VisibilityIcon /></IconButton>
          <IconButton size='small' color='primary'><EditIcon /></IconButton>
          <IconButton size='small' color='error'><DeleteIcon /></IconButton>
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

  const filtered = rows.filter(r => JSON.stringify(r).toLowerCase().includes(searchText.toLowerCase()))
  const paginated = filtered.slice(
    pagination.pageIndex * pagination.pageSize,
    pagination.pageIndex * pagination.pageSize + pagination.pageSize
  )

  return (
    <Box className='mt-2'>
      <Card
        sx={{
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '100%',
          minHeight: 0,
          position: 'relative'
        }}
      >
        <Box sx={{ mb: 2, flexShrink: 0 }}>
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            <Box display='flex' alignItems='center' gap={2}>
              <Typography variant='h5' fontWeight={600}>Invoice List</Typography>
              <GlobalButton startIcon={<RefreshIcon />} onClick={loadInvoices}>Refresh</GlobalButton>
            </Box>
            <Box display='flex' alignItems='center' gap={2}>
              <GlobalButton variant='outlined' color='secondary' endIcon={<PrintIcon />}>Export</GlobalButton>
              <GlobalButton variant='contained' startIcon={<AddIcon />}>Add Invoice</GlobalButton>
            </Box>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant='body2' fontWeight={500}>Show</Typography>
              <FormControl size='small' sx={{ width: 120 }}>
                <Select
                  value={pagination.pageSize}
                  onChange={e => setPagination(prev => ({ ...prev, pageSize: Number(e.target.value), pageIndex: 0 }))}
                >
                  {[10, 25, 50, 100].map(size => (
                    <MenuItem key={size} value={size}>{size} entries</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <TextField
              size='small'
              placeholder='Search invoice...'
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              sx={{ width: 350 }}
              InputProps={{ startAdornment: (<InputAdornment position='start'><SearchIcon /></InputAdornment>) }}
            />
          </Box>
        </Box>

        <Box sx={{ position: 'relative', flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <StickyTableWrapper rowCount={rows.length}>
            <table className={styles.table}>
              <thead>
                <tr>{columns.map(col => (<th key={col.id}>{col.header}</th>))}</tr>
              </thead>
              <tbody>
                {paginated.length ? (
                  paginated.map(row => (
                    <tr key={row.id}>
                      {columns.map(col => (<td key={col.id}>{col.cell ? col.cell(row) : row[col.id]}</td>))}
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={columns.length} className='text-center py-4'>No results found</td></tr>
                )}
              </tbody>
            </table>
          </StickyTableWrapper>
        </Box>

        <Box sx={{ mt: 'auto', flexShrink: 0, pt: 4 }}>
          <TablePaginationComponent totalCount={filtered.length} pagination={pagination} setPagination={setPagination} />
        </Box>
      </Card>
    </Box>
  )
}
