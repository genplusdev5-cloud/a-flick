'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import classnames from 'classnames'
import ChevronRight from '@menu/svg/ChevronRight'

// MUI
import {
  Box,
  Card,
  CardHeader,
  Button,
  Typography,
  IconButton,
  FormControlLabel,
  Breadcrumbs,
  Divider,
  Chip,
  Grid,
  Select,
  MenuItem,
  InputAdornment,
  Pagination,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import GlobalDateRange from '@/components/common/GlobalDateRange'
import { printInvoice } from '@/helpers/printInvoice'
import PresetDateRangePicker from '@/components/common/PresetDateRangePicker'

// Table
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'

// Local components
import CustomTextField from '@core/components/mui/TextField'
import CustomAutocomplete from '@core/components/mui/Autocomplete'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import tableStyles from '@core/styles/table.module.css'
import InvoicePDF from '@/components/invoice/InvoicePDF'
import { dateSortingFn } from '@/utils/tableUtils'
import StickyListLayout from '@/components/common/StickyListLayout'
import StickyTableWrapper from '@/components/common/StickyTableWrapper'

// API
import { getInvoiceSummary, getInvoiceDropdowns } from '@/api/invoice'
import { decodeId } from '@/utils/urlEncoder'

import { showToast } from '@/components/common/Toasts'
import SummaryCards from '@/components/common/SummaryCards'
import PermissionGuard from '@/components/auth/PermissionGuard'
import { usePermission } from '@/hooks/usePermission'
import GlobalButton from '@/components/common/GlobalButton'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'

const columnHelper = createColumnHelper()

const normalizeList = (list, key = 'name') => {
  if (!Array.isArray(list)) return []

  return list
    .map(item => ({
      id: item.id,
      label: item[key] || item.label || ''
    }))
    .filter((item, index, array) => array.findIndex(x => x.id === item.id) === index)
}

const dedupeById = items => {
  if (!Array.isArray(items)) return []
  const seen = new Map()
  return items.reduce((acc, item) => {
    const id = item?.id
    if (id != null && !seen.has(id)) {
      seen.set(id, true)
      acc.push({
        id,
        label: item.label || item.name || String(id)
      })
    }
    return acc
  }, [])
}

const mapInvoice = (inv, dd) => ({
  id: inv.id,
  invDate: inv.invoice_date || null,
  invNo: inv.invoice_number || '-',

  // Fix: invoice_frequency_id is STRING "2", but dropdown id is number
  invFrequency: dd.billing_frequencies?.find(f => String(f.id) === String(inv.invoice_frequency_id))?.label || '-',

  // service_frequency sometimes null
  svcFrequency: dd.service_frequencies?.find(f => String(f.id) === String(inv.service_frequency))?.label || '-',

  // These fields are NOT in API → so we use fallback from other data if possible
  contractCode: inv.contract_code || `CON-${inv.contract_id}` || '-',
  customerName: inv.customer_name || dd.customers?.find(c => c.id === inv.customer_id)?.label || 'Unknown Customer',
  billingName: inv.billing_name || inv.customer_name || 'N/A',
  address: inv.service_address || 'Not Available',
  cardId: inv.card_id || '-',
  poNo: inv.po_number || '-',
  accountItemCode: inv.account_item_code || '-',

  // No.Of Value Services & Last SVC Date → NOT in this API response
  noOfServices: inv.no_of_services || '-',
  lastSvcDate: inv.last_service_date || null,

  amount: inv.amount || 0,
  tax: inv.gst || 0,
  // Fix: taxAmount column expects this
  taxAmount: inv.gst || 0,

  total: (inv.amount || 0) + (inv.gst || 0),

  issued: inv.is_issued === 1 || inv.is_issued === true,

  // These are in API but not mapped before
  contractLevel: dd.contract_levels?.find(cl => String(cl.id) === String(inv.contract_level))?.label || '-',

  invoiceType: inv.invoice_type || '-',

  salesPerson: dd.sales_persons?.find(s => String(s.id) === String(inv.sales_person_id))?.label || '-',
  
  // Extra fields for editing
  total_productivity_amount: inv.total_productivity_amount || '',
  remarks: inv.remarks || '',
  service_nos: inv.service_nos || ''
})
const InvoiceListPageFullContent = () => {
  const { canAccess } = usePermission()
  const searchParams = useSearchParams()
  // ── Data & Dropdowns ────────────────────────
  const [rawResults, setRawResults] = useState([])
  const [dropdownData, setDropdownData] = useState({})

  // ── UI State ─────────────────────────────────
  const [loading, setLoading] = useState(false)

  // ── Filters ──────────────────────────────────

  // -- UI (TEMPORARY) FILTER STATES --
  const [uiOrigin, setUiOrigin] = useState(null)
  const [uiContractType, setUiContractType] = useState('')
  const [uiInvoiceStatus, setUiInvoiceStatus] = useState(null)
  const [uiServiceFreq, setUiServiceFreq] = useState('')
  const [uiBillingFreq, setUiBillingFreq] = useState('')
  const [uiContractLevel, setUiContractLevel] = useState('')
  const [uiInvoiceType, setUiInvoiceType] = useState('')
  const [uiSalesPerson, setUiSalesPerson] = useState('')
  const [uiSearch, setUiSearch] = useState('')
  const [uiDateFilter, setUiDateFilter] = useState(false)
  const [uiDateRange, setUiDateRange] = useState([null, null])
  const [sorting, setSorting] = useState([])

  const encodedCustomer = searchParams.get('customer')
  const encodedContract = searchParams.get('contract')

  const decodedCustomerId = useMemo(() => (encodedCustomer ? Number(decodeId(encodedCustomer)) : null), [encodedCustomer])
  const decodedContractId = useMemo(() => (encodedContract ? Number(decodeId(encodedContract)) : null), [encodedContract])

  // ✅ REQUIRED STATES (YOU MISSED THIS)
  const [uiCustomer, setUiCustomer] = useState(null)
  const [uiContract, setUiContract] = useState(null)

  // -- APPLIED FILTER STATES (Triggers API) --
  const [appliedFilters, setAppliedFilters] = useState({
    origin: null,
    contractType: null,
    invoiceStatus: null,
    serviceFreq: null,
    billingFreq: null,
    contractLevel: null,
    invoiceType: null,
    salesPerson: null,
    customer: null,
    contract: null,
    search: '',
    dateFilter: false,
    dateRange: [null, null]
  })

  // Sync Customer from URL
  useEffect(() => {
    if (!decodedCustomerId || !dropdownData.customers?.length) return

    const matchedCustomer = dropdownData.customers.find(c => Number(c.id) === Number(decodedCustomerId))

    if (matchedCustomer && appliedFilters.customer?.id !== matchedCustomer.id) {
      setUiCustomer(matchedCustomer)
      setAppliedFilters(prev => ({ ...prev, customer: matchedCustomer }))
    }
  }, [decodedCustomerId, dropdownData.customers, appliedFilters.customer])

  // Sync Contract from URL
  useEffect(() => {
    if (!decodedContractId || !dropdownData.contracts?.length) return

    const matchedContract = dropdownData.contracts.find(c => Number(c.id) === Number(decodedContractId))

    if (matchedContract && appliedFilters.contract?.id !== matchedContract.id) {
      setUiContract(matchedContract)
      setAppliedFilters(prev => ({ ...prev, contract: matchedContract }))
    }
  }, [decodedContractId, dropdownData.contracts, appliedFilters.contract])

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [totalCount, setTotalCount] = useState(0)
  const [summaryData, setSummaryData] = useState([])
  const [selectedInvoiceData, setSelectedInvoiceData] = useState(null)
  const [customerSpecificContracts, setCustomerSpecificContracts] = useState(null)

  // ── Modals State ────────────────────────────────
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({
    invoice_no: '',
    invoice_date: null,
    amount: '',
    total_productivity_amount: '',
    description: '',
    service_nos: ''
  })
  const [savingEdit, setSavingEdit] = useState(false)

  const [approveModalOpen, setApproveModalOpen] = useState(false)
  const [targetInvoice, setTargetInvoice] = useState(null)
  const [approving, setApproving] = useState(false)

  const data = useMemo(() => {
    return rawResults.map((inv, index) => ({
      sno: index + 1 + pagination.pageIndex * pagination.pageSize,
      ...mapInvoice(inv, dropdownData)
    }))
  }, [rawResults, dropdownData, pagination.pageIndex, pagination.pageSize])

  // ───────────────────────────────────────────
  // 🔥 URL Params for Redirection handled in Lazy State Init
  // ───────────────────────────────────────────

  const loadContractsForCustomer = async customerId => {
    try {
      const res = await getInvoiceDropdowns({ customer_id: customerId })
      const dd = res?.data?.data || {}

      setDropdownData(prev => {
        let normalizedContracts = normalizeList(dd.contract_list?.label, 'label')

        return {
          ...prev,
          contracts: normalizedContracts
        }
      })
    } catch (err) {
      console.log(err)
      showToast('error', 'Failed to load contracts')
    }
  }

  const buildListParams = () => {
    const params = {
      page: pagination.pageIndex + 1,
      page_size: pagination.pageSize
    }

    // Date range
    if (appliedFilters.dateFilter && appliedFilters.dateRange[0]) {
      params.from_date = format(appliedFilters.dateRange[0], 'yyyy-MM-dd')
      if (appliedFilters.dateRange[1]) {
        params.to_date = format(appliedFilters.dateRange[1], 'yyyy-MM-dd')
      }
    }

    if (appliedFilters.origin?.id) params.company_id = appliedFilters.origin.id
    if (appliedFilters.contractType?.label) params.contract_type = appliedFilters.contractType.label
    if (appliedFilters.invoiceStatus?.label) {
      if (appliedFilters.invoiceStatus.label === 'Pending') params.is_issued = 0
      if (appliedFilters.invoiceStatus.label === 'Issued') params.is_issued = 1
      if (appliedFilters.invoiceStatus.label === 'Posted') params.is_posted = 1
    }
    if (appliedFilters.serviceFreq?.id) params.service_frequency = appliedFilters.serviceFreq.id
    if (appliedFilters.billingFreq?.id) params.billing_frequency_id = appliedFilters.billingFreq.id
    if (appliedFilters.contractLevel?.id) params.contract_level = appliedFilters.contractLevel.id
    if (appliedFilters.invoiceType?.id) params.invoice_type = appliedFilters.invoiceType.id
    if (appliedFilters.salesPerson?.id) params.sales_person_id = appliedFilters.salesPerson.id

    if (appliedFilters.customer?.id) {
      params.customer_id = appliedFilters.customer.id
    }

    if (appliedFilters.contract?.id) {
      params.contract_id = appliedFilters.contract.id
    }

    if (appliedFilters.search.trim()) params.search = appliedFilters.search.trim()

    return params
  }


  // ── Load List + Dropdowns ─────────────────────

  // ── Load Dropdowns ──────────────────────────
  const loadDropdowns = async () => {
    try {
      const dropdownRes = await getInvoiceDropdowns()
      const ddWrapper = dropdownRes?.data || dropdownRes || {}
      const dd = ddWrapper?.data || {}

      let processedCustomers = dedupeById(dd.customer?.label || [])
      let processedContracts = dedupeById(dd.contract_list?.label || [])

      const processedDropdowns = {
        origins: dedupeById(dd.company?.name || []),
        billing_frequencies: dedupeById(dd.billing_frequency?.name || []),
        service_frequencies: dedupeById(dd.service_frequency?.name || []),
        customers: processedCustomers,
        contracts: processedContracts,
        sales_persons: dedupeById(dd.sales_person?.name || []),
        contract_levels: [
          { id: 1, label: 'New' },
          { id: 2, label: 'Renewal' }
        ],
        invoice_statuses: [
          { id: 1, label: 'Pending' },
          { id: 2, label: 'Issued' },
          { id: 3, label: 'Posted' }
        ],
        contract_types: [
          { id: 1, label: 'Limited Contract' },
          { id: 2, label: 'Job' },
          { id: 3, label: 'Continuous Job' },
          { id: 4, label: 'Warranty' }
        ],
        invoice_types: [
          { id: 1, label: 'Initial' }
        ]
      }
      setDropdownData(processedDropdowns)
    } catch (err) {
      console.error('Failed to load dropdowns:', err)
    }
  }

  // ── Load Invoice List ─────────────────────────
  const fetchInvoiceList = async () => {
    setLoading(true)
    try {
      const params = buildListParams()
      const listRes = await getInvoiceSummary(params)

      const apiData = listRes?.data?.data || {}
      const results = apiData?.results || []
      const count = apiData?.count || 0

      setRawResults(results)
      setTotalCount(count)

      // Summary stats
      const summaryStats = [
        { title: 'Total Invoices', value: count, icon: 'tabler-file-invoice', color: '#7367f0' },
        {
          title: 'Total Amount',
          value: `₹ ${results.reduce((acc, curr) => acc + (curr.total || 0), 0).toLocaleString()}`,
          icon: 'tabler-currency-dollar',
          color: '#28c76f'
        },
        {
          title: 'Issued',
          value: results.filter(i => i.is_issued === 1 || i.is_issued === true).length,
          icon: 'tabler-circle-check',
          color: '#00cfe8'
        },
        {
          title: 'Draft',
          value: results.filter(i => i.is_issued === 0 || i.is_issued === false).length,
          icon: 'tabler-pencil',
          color: '#ff9f43'
        }
      ]
      setSummaryData(summaryStats)
    } catch (err) {
      console.error('Failed to load invoices:', err)
      showToast('error', 'Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  // Initial Dropdown Load
  useEffect(() => {
    loadDropdowns()
  }, []) // Run once on mount

  // Fetch List when filters/pagination change
  useEffect(() => {
    fetchInvoiceList()
  }, [pagination.pageIndex, pagination.pageSize, appliedFilters])

  // ── Refresh ───────────────────────────────────
  const handleRefresh = () => {
    setPagination(p => ({ ...p, pageIndex: 0 }))
    setAppliedFilters({
      origin: uiOrigin,
      contractType: uiContractType,
      invoiceStatus: uiInvoiceStatus,
      serviceFreq: uiServiceFreq,
      billingFreq: uiBillingFreq,
      contractLevel: uiContractLevel,
      invoiceType: uiInvoiceType,
      salesPerson: uiSalesPerson,
      customer: uiCustomer,
      contract: uiContract,
      search: uiSearch,
      dateFilter: uiDateFilter,
      dateRange: uiDateRange
    })
  }

  // APPROVE (Issue Invoice)
  const handleApprove = invoice => {
    if (invoice.issued) {
      showToast('info', 'Already approved')
      return
    }
    setTargetInvoice(invoice)
    setApproveModalOpen(true)
  }

  const confirmApproval = async () => {
    if (!targetInvoice) return
    setApproving(true)
    try {
      const { updateInvoice } = await import('@/api/invoice')
      await updateInvoice(targetInvoice.id, { is_issued: 1 })
      showToast('success', 'Invoice Approved')
      setApproveModalOpen(false)
      fetchInvoiceList()
    } catch (err) {
      showToast('error', 'Approval Failed')
    } finally {
      setApproving(false)
    }
  }

  // EDIT
  const handleEdit = invoice => {
    setEditFormData({
      id: invoice.id,
      invoice_no: invoice.invNo || '',
      invoice_date: invoice.invDate ? new Date(invoice.invDate) : null,
      amount: invoice.amount || '',
      total_productivity_amount: invoice.total_productivity_amount || '',
      description: invoice.remarks || '',
      service_nos: invoice.service_nos || ''
    })
    setEditModalOpen(true)
  }

  const handleSaveEdit = async () => {
    setSavingEdit(true)
    try {
      const { updateInvoice } = await import('@/api/invoice')
      const payload = {
        invoice_number: editFormData.invoice_no,
        invoice_date: editFormData.invoice_date ? format(editFormData.invoice_date, 'yyyy-MM-dd') : null,
        amount: editFormData.amount,
        total_productivity_amount: editFormData.total_productivity_amount,
        remarks: editFormData.description, // Mapping description to remarks for PDF/Backend
        service_nos: editFormData.service_nos
      }
      await updateInvoice(editFormData.id, payload)
      showToast('success', 'Invoice updated successfully')
      setEditModalOpen(false)
      fetchInvoiceList()
    } catch (err) {
      showToast('error', 'Update failed')
    } finally {
      setSavingEdit(false)
    }
  }

  // DELETE
  const handleDelete = async invoice => {
    if (!confirm(`Are you sure you want to delete invoice ${invoice.invNo}?`)) return

    try {
      const { deleteInvoice } = await import('@/api/invoice')
      await deleteInvoice(invoice.id)

      showToast('success', 'Invoice deleted')
      fetchInvoiceList()
    } catch (err) {
      showToast('error', 'Delete failed')
    }
  }

  // PRINT (Frontend PDF Generation)
  const handlePrint = async invoice => {
    try {
      const { getInvoicePDF } = await import('@/api/invoice')

      const invoiceData = await getInvoicePDF(invoice.id)

      setSelectedInvoiceData(invoiceData)

      // wait for component render
      setTimeout(async () => {
        const element = document.getElementById('invoice-preview')
        if (!element) return

        const html2canvas = (await import('html2canvas')).default
        const jsPDF = (await import('jspdf')).default

        const canvas = await html2canvas(element, {
          scale: 3,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        })

        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF('p', 'mm', 'a4')
        const width = pdf.internal.pageSize.getWidth()
        const height = (canvas.height * width) / canvas.width

        pdf.addImage(imgData, 'PNG', 0, 0, width, height)

        const pdfBlob = pdf.output('blob')
        const blobUrl = URL.createObjectURL(pdfBlob)

        // OPEN PDF PREVIEW ONLY
        window.open(blobUrl, '_blank') // ← Preview Tab Only
      }, 1000)
    } catch (err) {
      console.error(err)
      showToast('error', 'PDF Failed')
    }
  }

  const generatePDF = async () => {
    const element = document.getElementById('invoice-preview')
    if (!element) return

    const html2canvas = (await import('html2canvas')).default
    const jsPDF = (await import('jspdf')).default

    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')

    const width = pdf.internal.pageSize.getWidth()
    const height = (canvas.height * width) / canvas.width

    pdf.addImage(imgData, 'PNG', 0, 0, width, height)
    pdf.save(`invoice_${Date.now()}.pdf`)
  }


  // ── Dropdown options from API (fallback to empty array) ─────
  const originOptions = dropdownData.origins || []
  const contractTypeOptions = dropdownData.contract_types || []
  const invoiceStatusOptions = dropdownData.invoice_statuses || []
  const serviceFreqOptions = dropdownData.service_frequencies || []
  const billingFreqOptions = dropdownData.billing_frequencies || []
  const contractLevelOptions = dropdownData.contract_levels || []
  const invoiceTypeOptions = dropdownData.invoice_types || []
  const salesPersonOptions = dropdownData.sales_persons || []
  const customerOptions = dropdownData.customers || []
  const contractOptions = dropdownData.contracts || []

  // ── Columns (exactly same as before) ─────────────────────
  const columns = useMemo(
    () => [
      columnHelper.accessor('sno', {
        header: 'S.No'
      }),

      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => {
          const invoice = row.original

          return (
            <div className='flex items-center gap-1'>
              {/* APPROVE / ISSUE */}
              {canAccess('Invoice', 'update') && (
                <IconButton size='small' onClick={() => handleApprove(invoice)}>
                  <i className='tabler-circle-check text-green-600 text-base' />
                </IconButton>
              )}

              {/* EDIT */}
              {canAccess('Invoice', 'update') && (
                <IconButton size='small' onClick={() => handleEdit(invoice)}>
                  <i className='tabler-edit text-blue-600 text-base' />
                </IconButton>
              )}

              {/* DELETE */}
              {canAccess('Invoice', 'delete') && (
                <IconButton size='small' onClick={() => handleDelete(invoice)}>
                  <i className='tabler-trash text-red-600 text-base' />
                </IconButton>
              )}

              {/* PRINT */}
              <IconButton size='small' onClick={() => handlePrint(invoice)}>
                <i className='tabler-printer text-purple-600 text-base' />
              </IconButton>

              {/* VIEW */}
              <Link href={`/admin/invoice/${invoice.id}`} passHref>
                <IconButton size='small'>
                  <i className='tabler-eye text-blue-500 text-base' />
                </IconButton>
              </Link>
            </div>
          )
        }
      }),

      columnHelper.accessor('invDate', {
        header: 'INV.Date',
        sortingFn: dateSortingFn,
        cell: info => {
          const val = info.getValue()
          if (!val) return '-'
          const d = new Date(val)
          return isNaN(d.getTime()) ? '-' : format(d, 'dd/MM/yyyy')
        }
      }),
      columnHelper.accessor('invNo', { header: 'INV.No' }),
      columnHelper.accessor('invFrequency', { header: 'INV.Frequency' }),
      columnHelper.accessor('svcFrequency', { header: 'SVC Frequency' }),
      columnHelper.accessor('noOfServices', {
        header: 'No.Of Value Services',
        cell: info => {
          const count = info.getValue() || 0

          return (
            <Button
              variant='contained'
              color='secondary'
              size='small'
              sx={{
                minWidth: 80,
                py: 1,
                fontWeight: 600,
                fontSize: '0.8rem',
                textTransform: 'none',
                borderRadius: '8px',
                boxShadow: 2
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <span style={{ fontSize: '0.65rem', opacity: 0.9 }}>Service</span>
                <span style={{ fontSize: '1rem', fontWeight: 700 }}>{count}</span>
              </Box>
            </Button>
          )
        }
      }),
      columnHelper.accessor('lastSvcDate', {
        header: 'Last SVC Date',
        sortingFn: dateSortingFn,
        cell: info => {
          const val = info.getValue()
          if (!val) return '-'
          const d = new Date(val)
          return isNaN(d.getTime()) ? '-' : format(d, 'dd/MM/yyyy')
        }
      }),
      columnHelper.accessor('contractCode', { header: 'Contract Code' }),
      columnHelper.accessor('cardId', { header: 'Card ID' }),
      columnHelper.accessor('billingName', { header: 'Billing Name' }),
      columnHelper.accessor('address', { header: 'Service Address' }),
      columnHelper.accessor('amount', { header: 'Amount', cell: info => `₹ ${info.getValue() || 0}` }),
      columnHelper.accessor('tax', { header: 'Tax', cell: info => `₹ ${info.getValue() || 0}` }),
      columnHelper.accessor('taxAmount', { header: 'Tax Amount', cell: info => `₹ ${info.getValue() || 0}` }),
      columnHelper.accessor('total', {
        header: 'Total Amount',
        cell: info => <strong>₹ {info.getValue() || 0}</strong>
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
      })
    ],
    [pagination.pageIndex, pagination.pageSize]
  )
  const table = useReactTable({
    data,
    columns,

    // 🔥 REQUIRED FOR SORTING
    state: {
      pagination,
      sorting
    },
    onSortingChange: setSorting,

    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),

    manualPagination: true,
    pageCount: Math.ceil(totalCount / pagination.pageSize)
  })

  useEffect(() => {
    const today = new Date()
    setUiDateRange([today, today])
  }, [])

  const pageIndex = pagination.pageIndex
  const pageSize = pagination.pageSize
  const pageCount = Math.ceil(totalCount / pageSize)

  // Reset page when filters remove all rows
  useEffect(() => {
    if (pageIndex >= pageCount && pageCount > 0) {
      setPagination(p => ({ ...p, pageIndex: pageCount - 1 }))
    }
  }, [pageCount, pageIndex])

  return (
    <StickyListLayout
      header={
        <Box sx={{ mb: loading ? 0 : 2 }}>
          {/* BREADCRUMB */}
          <Box role='presentation' sx={{ mb: 2 }}>
            <Breadcrumbs aria-label='breadcrumb'>
              <Link underline='hover' color='inherit' href='/'>
                Home
              </Link>
              <Typography color='text.primary'>Invoice List</Typography>
            </Breadcrumbs>
          </Box>

          {summaryData.length > 0 && <SummaryCards data={summaryData} />}
        </Box>
      }
    >
      {/* Hidden Invoice Preview for PDF Generation */}
      <div
        id='invoice-preview'
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          width: '210mm',
          visibility: 'visible',
          background: '#ffffff'
        }}
      >
        {selectedInvoiceData && <InvoicePDF invoiceData={selectedInvoiceData} />}
      </div>

      <Card sx={{ display: 'flex', flexDirection: 'column', maxHeight: '100%', minHeight: 0, position: 'relative' }}>
        {/* ✅ CARD HEADER (STANDARD – SAME AS TAX PAGE) */}
        <CardHeader
          title={
            <Box display='flex' alignItems='center' gap={2}>
              <Typography variant='h5' sx={{ fontWeight: 600 }}>
                Invoice List
              </Typography>
            </Box>
          }
        />

        <Divider />

        {/* FILTERS */}
        <Box sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* FILTERS */}
          <Box sx={{ pb: 3, flexShrink: 0 }}>
            <Grid container spacing={3} alignItems='flex-end'>
              {/* Row 1 */}
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Checkbox
                    checked={uiDateFilter}
                    onChange={e => {
                      setUiDateFilter(e.target.checked)

                      if (!e.target.checked) {
                        setUiDateRange([null, null])
                      } else {
                        const today = new Date()
                        setUiDateRange([today, today])
                      }
                    }}
                    size='small'
                  />
                  <Typography sx={{ mb: 0.5, fontWeight: 500 }}>Date Filter</Typography>
                </Box>

                <PresetDateRangePicker
                  start={uiDateRange[0]}
                  end={uiDateRange[1]}
                  onSelectRange={({ start, end }) => {
                    setUiDateRange([start, end])
                  }}
                  disabled={!uiDateFilter}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <CustomAutocomplete
                  options={originOptions}
                  value={uiOrigin || null}
                  onChange={(_, v) => setUiOrigin(v || null)}
                  getOptionLabel={opt => opt?.label || ''}
                  renderInput={p => <CustomTextField {...p} label='Origin' size='small' />}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <CustomAutocomplete
                  options={contractTypeOptions}
                  value={uiContractType || null}
                  onChange={(_, v) => setUiContractType(v || null)}
                  getOptionLabel={opt => opt?.label || ''}
                  renderInput={p => <CustomTextField {...p} label='Contract Type' size='small' />}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <CustomAutocomplete
                  options={invoiceStatusOptions}
                  value={uiInvoiceStatus || null}
                  onChange={(_, v) => setUiInvoiceStatus(v || null)}
                  getOptionLabel={opt => opt?.label || ''}
                  renderInput={p => <CustomTextField {...p} label='Invoice Status' size='small' />}
                />
              </Grid>

              {/* Row 2 */}
              <Grid item xs={12} sm={6} md={3}>
                <CustomAutocomplete
                  options={serviceFreqOptions}
                  value={uiServiceFreq || null}
                  onChange={(_, v) => setUiServiceFreq(v || null)}
                  getOptionLabel={opt => opt?.label || ''}
                  renderInput={p => <CustomTextField {...p} label='Service Frequency' size='small' />}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <CustomAutocomplete
                  options={billingFreqOptions}
                  value={uiBillingFreq || null}
                  onChange={(_, v) => setUiBillingFreq(v || null)}
                  getOptionLabel={opt => opt?.label || ''}
                  renderInput={p => <CustomTextField {...p} label='Billing Frequency' size='small' />}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <CustomAutocomplete
                  options={contractLevelOptions}
                  value={uiContractLevel || null}
                  onChange={(_, v) => setUiContractLevel(v || null)}
                  getOptionLabel={opt => opt?.label || ''}
                  renderInput={p => <CustomTextField {...p} label='Contract Level' size='small' />}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <CustomAutocomplete
                  options={invoiceTypeOptions}
                  value={uiInvoiceType || null}
                  onChange={(_, v) => setUiInvoiceType(v || null)}
                  getOptionLabel={opt => opt?.label || ''}
                  renderInput={p => <CustomTextField {...p} label='Invoice Type' size='small' />}
                />
              </Grid>

              {/* Row 3 */}
              <Grid item xs={12} sm={6} md={3}>
                <CustomAutocomplete
                  options={salesPersonOptions}
                  value={uiSalesPerson || null}
                  onChange={(_, v) => setUiSalesPerson(v || null)}
                  getOptionLabel={opt => opt?.label || ''}
                  renderInput={p => <CustomTextField {...p} label='Sales Person' size='small' />}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <CustomAutocomplete
                  options={customerOptions}
                  value={uiCustomer || null}
                  getOptionLabel={option => option?.label || ''}
                  isOptionEqualToValue={(option, value) => option?.id === value?.id}
                  onChange={(_, v) => {
                    setUiCustomer(v || null)
                    setUiContract(null)

                    if (v?.id) {
                      getInvoiceDropdowns({ customer_id: v.id })
                        .then(res => {
                          const dd = res?.data?.data || {}
                          const contracts = dedupeById(dd.contract_list?.label || [])
                          setCustomerSpecificContracts(contracts)
                          setDropdownData(prev => ({ ...prev, contracts }))
                        })
                        .catch(() => {
                          showToast('error', 'Failed to load contracts')
                          setCustomerSpecificContracts([])
                          setDropdownData(prev => ({ ...prev, contracts: [] }))
                        })
                    } else {
                      setCustomerSpecificContracts(null)
                    }
                  }}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      {option.label}
                    </li>
                  )}
                  renderInput={params => <CustomTextField {...params} label='Customer' size='small' />}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <CustomAutocomplete
                  options={contractOptions}
                  value={uiContract || null}
                  getOptionLabel={opt => opt?.label || ''}
                  isOptionEqualToValue={(a, b) => a?.id === b?.id}
                  onChange={(_, v) => setUiContract(v || null)}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      {option.label}
                    </li>
                  )}
                  renderInput={params => <CustomTextField {...params} label='Contract' size='small' />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'flex-end', maxHeight: '100%' }}>
                  <GlobalButton
                    fullWidth
                    variant='contained'
                    startIcon={<RefreshIcon />}
                    disabled={loading}
                    onClick={handleRefresh}
                  >
                    Refresh
                  </GlobalButton>
                </Box>
              </Grid>
            </Grid>

            <Divider />

            {/* SEARCH + ENTRIES */}
            <Box display='flex' justifyContent='space-between' alignItems='center' gap={2} mt={4}>
              <Select
                size='small'
                value={pageSize}
                onChange={e => setPagination(p => ({ ...p, pageSize: Number(e.target.value), pageIndex: 0 }))}
                sx={{ width: 130 }}
              >
                {[25, 50, 75, 100].map(s => (
                  <MenuItem key={s} value={s}>
                    {s} entries
                  </MenuItem>
                ))}
              </Select>

              <CustomTextField
                size='small'
                placeholder='Search invoice, contract, customer...'
                value={uiSearch}
                onChange={e => {
                  setUiSearch(e.target.value)
                }}
                sx={{ width: 360 }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position='start'>
                        <SearchIcon />
                      </InputAdornment>
                    )
                  }
                }}
              />
            </Box>
          </Box>

          <Box sx={{ position: 'relative', flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <StickyTableWrapper rowCount={data.length}>
              <table className={tableStyles.table}>
                <thead>
                  {table.getHeaderGroups().map(hg => (
                    <tr key={hg.id}>
                      {hg.headers.map(h => (
                        <th key={h.id}>
                          <div
                            className={classnames({
                              'flex items-center gap-1': true,
                              'cursor-pointer select-none': h.column.getCanSort()
                            })}
                            onClick={h.column.getToggleSortingHandler()}
                          >
                            {flexRender(h.column.columnDef.header, h.getContext())}

                            {{
                              asc: <ChevronRight fontSize='1.1rem' className='-rotate-90' />,
                              desc: <ChevronRight fontSize='1.1rem' className='rotate-90' />
                            }[h.column.getIsSorted()] ?? null}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>

                <tbody>
                  {data.length > 0 ? (
                    table.getRowModel().rows.map(row => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={columns.length} className='text-center py-6'>
                        {loading ? 'Loading...' : 'No results found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </StickyTableWrapper>
          </Box>

          <Box
            sx={{
              py: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0,
              mt: 'auto'
            }}
          >
            <Typography color='text.disabled'>
              {data.length === 0
                ? 'Showing 0 to 0 of 0 entries'
                : `Showing ${pagination.pageIndex * pagination.pageSize + 1} to ${pagination.pageIndex * pagination.pageSize + data.length} of ${totalCount} entries`}
            </Typography>

            <Pagination
              shape='rounded'
              color='primary'
              variant='tonal'
              count={pageCount}
              page={pageIndex + 1}
              onChange={(_, p) => setPagination(v => ({ ...v, pageIndex: p - 1 }))}
              showFirstButton
              showLastButton
            />
          </Box>
        </Box>
      </Card>

      {/* UPDATE INVOICE MODAL */}
      <Dialog
        open={editModalOpen}
        onClose={() => !savingEdit && setEditModalOpen(false)}
        maxWidth='sm'
        fullWidth
        closeAfterTransition={false}
        PaperProps={{ sx: { overflow: 'visible' } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant='h5' component='span'>
            Update Invoice
          </Typography>
          <DialogCloseButton onClick={() => setEditModalOpen(false)} disableRipple>
            <i className='tabler-x' />
          </DialogCloseButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 6 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} sm={6}>
              <CustomTextField
                fullWidth
                label='Invoice No'
                value={editFormData.invoice_no}
                onChange={e => setEditFormData({ ...editFormData, invoice_no: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <AppReactDatepicker
                selected={editFormData.invoice_date}
                onChange={date => setEditFormData({ ...editFormData, invoice_date: date })}
                customInput={<CustomTextField fullWidth label='Invoice Date' />}
                dateFormat='dd-MM-yyyy'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <CustomTextField
                fullWidth
                label='Invoice Amount'
                type='number'
                value={editFormData.amount}
                onChange={e => setEditFormData({ ...editFormData, amount: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <CustomTextField
                fullWidth
                label='Total Productivity Amount'
                type='number'
                value={editFormData.total_productivity_amount}
                onChange={e => setEditFormData({ ...editFormData, total_productivity_amount: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <CustomTextField
                fullWidth
                multiline
                rows={4}
                label='Invoice Description'
                value={editFormData.description}
                onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <CustomTextField
                fullWidth
                label='Service Nos'
                value={editFormData.service_nos}
                onChange={e => setEditFormData({ ...editFormData, service_nos: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 6, pt: 0 }}>
          <Button variant='tonal' color='secondary' onClick={() => setEditModalOpen(false)} disabled={savingEdit}>
            Close
          </Button>
          <GlobalButton variant='contained' onClick={handleSaveEdit} loading={savingEdit}>
            Keep
          </GlobalButton>
        </DialogActions>
      </Dialog>

      {/* APPROVE INVOICE MODAL */}
      <Dialog
        open={approveModalOpen}
        onClose={() => !approving && setApproveModalOpen(false)}
        maxWidth='xs'
        fullWidth
        closeAfterTransition={false}
        PaperProps={{ sx: { overflow: 'visible' } }}
      >
        <DialogTitle sx={{ textAlign: 'center' }}>
          <Typography variant='h5' component='span'>
            Approve Invoice
          </Typography>
          <DialogCloseButton onClick={() => setApproveModalOpen(false)} disableRipple>
            <i className='tabler-x' />
          </DialogCloseButton>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pb: 4, pt: 8 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 50,
              height: 50,
              bgcolor: 'success.main',
              color: 'white',
              borderRadius: '50%',
              mx: 'auto',
              mb: 4
            }}
          >
            <i className='tabler-circle-check text-2xl' />
          </Box>
          <Typography>Are you sure you want to approve invoice {targetInvoice?.invNo}?</Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 8 }}>
          <Button variant='tonal' color='secondary' onClick={() => setApproveModalOpen(false)} disabled={approving}>
            Cancel
          </Button>
          <Button variant='contained' color='success' onClick={confirmApproval} disabled={approving}>
            {approving ? 'Approving...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </StickyListLayout>
  )
}

// Wrapper for RBAC
export default function InvoiceListPageFull() {
  return (
    <PermissionGuard permission='Invoice'>
      <InvoiceListPageFullContent />
    </PermissionGuard>
  )
}
