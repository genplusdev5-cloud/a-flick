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
import { listInvoices, addInvoice, updateInvoice, deleteInvoice } from '@/api/contract_group/contract/details/invoice'
import { getAllDropdowns } from '@/api/contract_group/contract/dropdowns'

import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'
import AddIcon from '@mui/icons-material/Add'
import PrintIcon from '@mui/icons-material/Print'
import RefreshIcon from '@mui/icons-material/Refresh'
import { useParams } from 'next/navigation'

import GlobalButton from '@/components/common/GlobalButton'
import GlobalDrawer from '@/components/common/GlobalDrawer'
import GlobalTextField from '@/components/common/GlobalTextField'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import CustomTextField from '@core/components/mui/TextField'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import styles from '@core/styles/table.module.css'
import { showToast } from '@/components/common/Toasts'

export default function InvoiceListPage() {
  const [rows, setRows] = useState([])
  const [searchText, setSearchText] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const params = useParams()
  const contractId = params?.uuid || params?.id

  const [loading, setLoading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)

  const [dropdownOptions, setDropdownOptions] = useState({
    billingFreq: [],
    serviceFreq: []
  })

  // Internal integer ID needed? Usually Invoice linked to Contract ID (integer).
  // Let's assume list API params contract_id is UUID, but creation might need integer.
  // Same logic as Pest list?
  // Let's assume we can use params.uuid or fetch integer id from list response.
  const [internalContractId, setInternalContractId] = useState(null)

  const [formData, setFormData] = useState({
    id: null,
    invoice_date: '',
    invoice_number: '',
    invoice_frequency: null,
    service_frequency: null,
    amount: '',
    gst: '',
    po_no: '',
    remarks: ''
  })

  const loadDropdowns = async () => {
    try {
      const data = await getAllDropdowns()
      setDropdownOptions({
        billingFreq: data.billingFreq || [],
        serviceFreq: data.serviceFreq || []
      })
    } catch (err) {
      console.error(err)
    }
  }

  const loadInvoices = async () => {
    try {
      setLoading(true)
      const res = await listInvoices({ contract_id: contractId, page_size: 1000 })
      const data = res?.data?.data?.results || []

      // Capture integer ID
      if (data.length > 0 && data[0].contract_id) {
        setInternalContractId(data[0].contract_id)
      }

      const formatDate = dateStr => {
        if (!dateStr) return '-'
        const parts = dateStr.split('T')[0].split('-')
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
        return dateStr
      }

      const formatted = data.map(item => ({
        id: item.id,
        contractId: item.contract_id,
        invDate: formatDate(item.invoice_date),
        rawInvDate: item.invoice_date, // Keep raw for edit
        invNo: item.invoice_number || '-',
        invFrequency: item.invoice_frequency || '-',
        invFrequencyId: item.invoice_frequency_id,
        svcFrequency: item.service_frequency || '-',
        valueServices: item.value_services || 0,
        lastSvcDate: formatDate(item.last_service_date),
        contractCode: item.contract_code || '-',
        cardId: item.card_id || '-',
        billingName: item.billing_name || '-',
        origin: item.origin || '-',
        amount: item.amount,
        tax: item.gst,
        totalAmount: (item.amount || 0) + (item.gst || 0),
        poNo: item.po_no || '-',
        remarks: item.remarks,
        issued: item.is_issued ? 'Yes' : 'No',
        myob: item.is_myob ? 'Synced' : 'Pending'
      }))

      setRows(formatted)
    } catch (err) {
      console.log(err)
      showToast('error', 'Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (contractId) {
      loadInvoices()
      loadDropdowns()
    }
  }, [contractId])

  const handleOpenAdd = () => {
    setIsEdit(false)
    setFormData({
      id: null,
      invoice_date: new Date().toISOString().split('T')[0],
      invoice_number: '',
      invoice_frequency: null,
      service_frequency: null,
      amount: '',
      gst: '',
      po_no: '',
      remarks: ''
    })
    setDrawerOpen(true)
  }

  const handleOpenEdit = row => {
    setIsEdit(true)
    // Find frequency object
    const freqObj = dropdownOptions.billingFreq.find(f => f.value == row.invFrequencyId) || row.invFrequency

    // Find service frequency object
    // row.svcFrequency is Name. dropdownOptions.serviceFreq is objects {label, value}.
    const svcFreqObj = dropdownOptions.serviceFreq.find(f => f.label === row.svcFrequency) || row.svcFrequency

    setFormData({
      id: row.id,
      invoice_date: row.rawInvDate ? row.rawInvDate.split('T')[0] : '',
      invoice_number: row.invNo !== '-' ? row.invNo : '',
      invoice_frequency: freqObj,
      service_frequency: svcFreqObj,
      amount: row.amount,
      gst: row.tax,
      po_no: row.poNo !== '-' ? row.poNo : '',
      remarks: row.remarks
    })
    setDrawerOpen(true)
  }

  const handleDelete = async id => {
    if (!confirm('Delete this invoice?')) return
    try {
      await deleteInvoice(id)
      showToast('success', 'Invoice deleted')
      loadInvoices()
    } catch (err) {
      showToast('error', 'Delete failed')
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()

    // contract_id check
    const validContractId = internalContractId
    if (!validContractId && !isEdit) {
      // On clean add without list loaded?
      // We might not have it. But User usually views list first.
      // Or we can assume params.uuid if API supports UUID.
      // Sticking to integer flow as validated in Pest.
    }

    const payload = {
      contract_id: validContractId,
      invoice_date: formData.invoice_date || null,
      invoice_number: formData.invoice_number || null,
      invoice_frequency:
        formData.invoice_frequency?.value || formData.invoice_frequency?.id || formData.invoice_frequency,
      service_frequency:
        formData.service_frequency?.value || formData.service_frequency?.id || formData.service_frequency,
      amount: Number(formData.amount),
      gst: Number(formData.gst),
      po_no: formData.po_no || null,
      remarks: formData.remarks || null,
      // Add fields from Postman that might be expected
      amount_old: null,
      gst_old: null
    }

    // Convert to FormData if JSON fails?
    // Let's stick to JSON but with cleaned values.
    // Ideally backend accepts JSON.

    // Check if frequency is actually selected
    if (!payload.invoice_frequency) return showToast('error', 'Select Invoice Frequency')
    if (!payload.service_frequency) return showToast('error', 'Select Service Frequency')

    // Create FormData for both Add and Update (assuming Update also needs FormData)
    const fd = new FormData()
    fd.append('contract_id', validContractId)
    fd.append('invoice_date', formData.invoice_date || '')
    fd.append('invoice_number', formData.invoice_number || '')

    // For Invoice Frequency, backend likely expects 'invoice_frequency_id' or check both
    const invFreqVal = formData.invoice_frequency?.value || formData.invoice_frequency?.id || formData.invoice_frequency
    fd.append('invoice_frequency_id', invFreqVal)
    fd.append('invoice_frequency', invFreqVal)

    // For Service Frequency, it's usually a name string
    const svcFreqVal =
      formData.service_frequency?.label || formData.service_frequency?.name || formData.service_frequency
    fd.append('service_frequency', svcFreqVal)

    fd.append('amount', formData.amount)
    fd.append('gst', formData.gst)
    fd.append('po_no', formData.po_no || '')
    fd.append('remarks', formData.remarks || '')

    // Extra fields matching Postman
    fd.append('amount_old', '')
    fd.append('gst_old', '')

    try {
      setLoading(true)
      if (isEdit) {
        // Update API now expects ID in query param, and data as second arg
        // We use FormData for reliability
        await updateInvoice(formData.id, fd)
        showToast('success', 'Invoice updated')
      } else {
        if (!validContractId) throw new Error('Contract ID (Integer) missing')
        await addInvoice(fd)
        showToast('success', 'Invoice added')
      }
      setDrawerOpen(false)
      loadInvoices()
    } catch (err) {
      console.error(err)
      // Show detailed error if available
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to save'
      showToast('error', typeof msg === 'object' ? JSON.stringify(msg) : msg)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      id: 'sno',
      header: 'S.No',
      cell: (row, index, pagination) => index + 1 + pagination.pageIndex * pagination.pageSize
    },
    {
      id: 'actions',
      header: 'Action',
      cell: row => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size='small' color='info'>
            <VisibilityIcon />
          </IconButton>
          <IconButton size='small' color='primary' onClick={() => handleOpenEdit(row)}>
            <EditIcon />
          </IconButton>
          <IconButton size='small' color='error' onClick={() => handleDelete(row.id)}>
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
    // Removed Account Item Code
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
              <Typography variant='h5' fontWeight={600}>
                Invoice List
              </Typography>
              <GlobalButton startIcon={<RefreshIcon />} onClick={loadInvoices}>
                Refresh
              </GlobalButton>
            </Box>
            <Box display='flex' alignItems='center' gap={2}>
              <GlobalButton variant='outlined' color='secondary' endIcon={<PrintIcon />}>
                Export
              </GlobalButton>
              <GlobalButton variant='contained' startIcon={<AddIcon />} onClick={handleOpenAdd}>
                Add Invoice
              </GlobalButton>
            </Box>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
              flexWrap: 'wrap',
              gap: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant='body2' fontWeight={500}>
                Show
              </Typography>
              <FormControl size='small' sx={{ width: 120 }}>
                <Select
                  value={pagination.pageSize}
                  onChange={e => setPagination(prev => ({ ...prev, pageSize: Number(e.target.value), pageIndex: 0 }))}
                >
                  {[10, 25, 50, 100].map(size => (
                    <MenuItem key={size} value={size}>
                      {size} entries
                    </MenuItem>
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
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Box>
        </Box>

        <Box sx={{ position: 'relative', flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <StickyTableWrapper rowCount={rows.length}>
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
                  paginated.map((row, index) => (
                    <tr key={row.id}>
                      {columns.map(col => (
                        <td key={col.id}>{col.cell ? col.cell(row, index, pagination) : row[col.id]}</td>
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
          </StickyTableWrapper>
        </Box>

        <Box sx={{ mt: 'auto', flexShrink: 0, pt: 4 }}>
          <TablePaginationComponent
            totalCount={filtered.length}
            pagination={pagination}
            setPagination={setPagination}
          />
        </Box>
      </Card>

      <GlobalDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={isEdit ? 'Update Invoice' : 'Add Invoice'}
      >
        <Box component='form' onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <AppReactDatepicker
            selected={formData.invoice_date ? new Date(formData.invoice_date) : null}
            id='invoice-date'
            onChange={(date) => {
              if (!date) return setFormData({ ...formData, invoice_date: '' })
              const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
              setFormData({ ...formData, invoice_date: dateStr })
            }}
            placeholderText='Select Invoice Date'
            customInput={<CustomTextField label='Invoice Date' fullWidth required />}
          />
          <GlobalTextField
            label='Invoice No'
            type='number'
            value={formData.invoice_number}
            onChange={e => setFormData({ ...formData, invoice_number: e.target.value })}
          />
          <GlobalAutocomplete
            label='Invoice Frequency'
            options={dropdownOptions.billingFreq}
            value={formData.invoice_frequency}
            onChange={v => setFormData({ ...formData, invoice_frequency: v })}
            getOptionLabel={opt => opt.label || opt.name || opt || ''}
            isOptionEqualToValue={(opt, val) => opt.value === val.value}
          />
          <GlobalAutocomplete
            label='Service Frequency'
            options={dropdownOptions.serviceFreq} // Array of objects
            value={formData.service_frequency}
            onChange={v => setFormData({ ...formData, service_frequency: v })}
            getOptionLabel={opt => opt.label || opt.name || opt || ''}
            isOptionEqualToValue={(opt, val) => opt.value === val.value}
          />
          <GlobalTextField
            label='Amount'
            type='number'
            value={formData.amount}
            onChange={e => setFormData({ ...formData, amount: e.target.value })}
            required
          />
          <GlobalTextField
            label='Tax (GST)'
            type='number'
            value={formData.gst}
            onChange={e => setFormData({ ...formData, gst: e.target.value })}
          />
          <GlobalTextField
            label='PO Number'
            type='number'
            value={formData.po_no}
            onChange={e => setFormData({ ...formData, po_no: e.target.value })}
          />
          <GlobalTextField
            label='Remarks'
            multiline
            rows={3}
            value={formData.remarks}
            onChange={e => setFormData({ ...formData, remarks: e.target.value })}
          />

          <Box display='flex' gap={2} mt={2}>
            <GlobalButton type='submit' variant='contained' fullWidth>
              {isEdit ? 'Update' : 'Save'}
            </GlobalButton>
            <GlobalButton variant='outlined' color='secondary' fullWidth onClick={() => setDrawerOpen(false)}>
              Cancel
            </GlobalButton>
          </Box>
        </Box>
      </GlobalDrawer>
    </Box>
  )
}
