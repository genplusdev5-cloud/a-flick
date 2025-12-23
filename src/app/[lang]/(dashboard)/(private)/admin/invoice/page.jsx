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
  Checkbox
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import GlobalDateRange from '@/components/common/GlobalDateRange'
import { printInvoice } from '@/helpers/printInvoice'
import ProgressCircularCustomization from '@/components/common/ProgressCircularCustomization'

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
import { getInvoiceSummary, getInvoiceDropdowns } from '@/api/invoice' // adjust path if needed

import { showToast } from '@/components/common/Toasts'
import SummaryCards from '@/components/common/SummaryCards'
import PermissionGuard from '@/components/auth/PermissionGuard'
import { usePermission } from '@/hooks/usePermission'

const columnHelper = createColumnHelper()

const InvoiceListPageFullContent = () => {
  const { canAccess } = usePermission()
  const searchParams = useSearchParams()
  // ── Data & Dropdowns ────────────────────────
  const [data, setData] = useState([])
  const [dropdownData, setDropdownData] = useState({})

  // ── UI State ─────────────────────────────────
  const [loading, setLoading] = useState(false)

  // ── Filters ──────────────────────────────────

  const [originFilter, setOriginFilter] = useState(null)
  const [contractTypeFilter, setContractTypeFilter] = useState('')
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState(null)
  const [serviceFreqFilter, setServiceFreqFilter] = useState('')
  const [billingFreqFilter, setBillingFreqFilter] = useState('')
  const [contractLevelFilter, setContractLevelFilter] = useState('')
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState('')
  const [salesPersonFilter, setSalesPersonFilter] = useState('')
  const [sorting, setSorting] = useState([])

  const encodedCustomer = searchParams.get('customer')
  const encodedContract = searchParams.get('contract')

  const decodedCustomerId = encodedCustomer ? Number(atob(encodedCustomer)) : null
  const decodedContractId = encodedContract ? Number(atob(encodedContract)) : null

  // ✅ REQUIRED STATES (YOU MISSED THIS)
  const [customerFilter, setCustomerFilter] = useState(null)
  const [contractFilter, setContractFilter] = useState(null)

  //CUSTOMER FILTERS
  useEffect(() => {
    if (!decodedCustomerId || !dropdownData.customers?.length) return

    const matchedCustomer = dropdownData.customers.find(c => Number(c.id) === Number(decodedCustomerId))

    if (matchedCustomer) {
      setCustomerFilter(matchedCustomer)
    }
  }, [decodedCustomerId, dropdownData.customers])

  //CONTRACT FILTER

  useEffect(() => {
    if (!decodedContractId || !dropdownData.contracts?.length) return

    const matchedContract = dropdownData.contracts.find(c => Number(c.id) === Number(decodedContractId))

    if (matchedContract) {
      setContractFilter(matchedContract)
    }
  }, [decodedContractId, dropdownData.contracts])

  const [searchText, setSearchText] = useState('')
  const [totalCount, setTotalCount] = useState(0)
  const [customerSpecificContracts, setCustomerSpecificContracts] = useState(null)
  const [dateFilter, setDateFilter] = useState(false) // renamed from dateFilterEnabled
  const today = new Date()
  const [dateRange, setDateRange] = useState([null, null])

  // PDF Preview Invoice Data
  const [selectedInvoiceData, setSelectedInvoiceData] = useState(null)
  // ── Pagination ───────────────────────────────
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [summaryData, setSummaryData] = useState([])

  // ───────────────────────────────────────────
  // 🔥 URL Params for Redirection handled in Lazy State Init
  // ───────────────────────────────────────────

  const loadContractsForCustomer = async customerId => {
    try {
      const res = await getInvoiceDropdowns({ customer_id: customerId })
      const dd = res?.data?.data || {}

      setDropdownData(prev => {
        let normalizedContracts = normalizeList(dd.contract_list?.label, 'label')

        // 🔥 PERSIST URL OPTION (Contract)
        // We use window.location because searchParams might be stale if inside closure?
        // Actually searchParams is from top scope 'useSearchParams', it should be fine.
        const urlContractId = searchParams.get('contract')
        const urlContractCode = searchParams.get('contractCode')
        const urlCustId = searchParams.get('customer')

        // Ensure we only add if it belongs to this customer (roughly checked by URL presence)
        if (urlContractId && urlContractCode) {
          const exists = normalizedContracts.find(c => String(c.id) === String(urlContractId))
          if (!exists) {
            normalizedContracts.push({ id: Number(urlContractId), label: urlContractCode })
          }
        }

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
    if (dateFilter && dateRange[0]) {
      params.from_date = format(dateRange[0], 'yyyy-MM-dd')
      if (dateRange[1]) {
        params.to_date = format(dateRange[1], 'yyyy-MM-dd')
      }
    }

    // Only add if value exists
    if (originFilter?.id) params.company_id = originFilter.id
    if (contractTypeFilter?.id) params.contract_type = contractTypeFilter.id
    if (invoiceStatusFilter?.label) params.is_issued = invoiceStatusFilter.label === 'Yes' ? 1 : 0
    if (serviceFreqFilter?.id) params.service_frequency = serviceFreqFilter.id
    if (billingFreqFilter?.id) params.billing_frequency_id = billingFreqFilter.id
    if (contractLevelFilter?.id) params.contract_level = contractLevelFilter.id
    if (invoiceTypeFilter?.id) params.invoice_type = invoiceTypeFilter.id
    if (salesPersonFilter?.id) params.sales_person_id = salesPersonFilter.id
    // 🔥 ALWAYS SEND DECODED IDs TO API
    if (decodedCustomerId) {
      params.customer_id = decodedCustomerId
    } else if (customerFilter?.id) {
      params.customer_id = customerFilter.id
    }

    if (decodedContractId) {
      params.contract_id = decodedContractId
    } else if (contractFilter?.id) {
      params.contract_id = contractFilter.id
    }

    if (searchText.trim()) params.search = searchText.trim()

    return params
  }

  const buildFilters = () => {
    const params = {
      page: pagination.pageIndex + 1,
      page_size: pagination.pageSize
    }

    if (dateFilterEnabled && filterDate) params.invoice_date = format(filterDate, 'yyyy-MM-dd')

    if (originFilter?.id) params.company_id = originFilter.id
    if (contractTypeFilter?.id) params.contract_type = contractTypeFilter.id
    if (invoiceStatusFilter?.label) params.is_issued = invoiceStatusFilter.label === 'Yes' ? 1 : 0
    if (serviceFreqFilter?.id) params.service_frequency = serviceFreqFilter.id
    if (billingFreqFilter?.id) params.billing_frequency = billingFreqFilter.id
    if (contractLevelFilter?.id) params.contract_level = contractLevelFilter.id
    if (invoiceTypeFilter?.id) params.invoice_type = invoiceTypeFilter.id
    if (salesPersonFilter?.id) params.sales_person_id = salesPersonFilter.id
    if (customerFilter?.id) params.customer_id = customerFilter.id
    if (contractFilter?.id) params.contract_id = contractFilter.id

    if (searchText) params.search = searchText

    return params
  }

  const normalizeList = (list, key = 'name') => {
    if (!Array.isArray(list)) return []

    return list
      .map(item => ({
        id: item.id,
        label: item[key] || item.label || ''
      }))
      .filter((item, index, array) => array.findIndex(x => x.id === item.id) === index)
  }

  // ── DEDUPE FUNCTION (Add this once, above processedDropdowns) ──
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

  // ── Load List + Dropdowns ─────────────────────

  const loadEverything = async () => {
    setLoading(true)
    try {
      const params = buildListParams()

      const [listRes, dropdownRes] = await Promise.all([
        getInvoiceSummary(params), // ← changed here
        getInvoiceDropdowns()
      ])

      const apiData = listRes?.data?.data || {}
      const results = apiData?.results || []
      const count = apiData?.count || 0

      // ... rest of the code remains EXACTLY the same (dropdowns, mapping, etc.)
      // No need to touch anything else!

      const ddWrapper = dropdownRes?.data || dropdownRes || {}
      const dd = ddWrapper?.data || {}

      let processedCustomers = dedupeById(dd.customer?.label || [])

      // 🔥 PERSIST URL OPTION (Customer)
      const urlCustId = searchParams.get('customer')
      const urlCustName = searchParams.get('customerName')

      if (urlCustId && urlCustName) {
        const exists = processedCustomers.find(c => String(c.id) === String(urlCustId))
        if (!exists) {
          processedCustomers.push({ id: Number(urlCustId), label: urlCustName })
        }
      }

      let processedContracts = customerSpecificContracts
        ? customerSpecificContracts
        : dedupeById(dd.contract_list?.label || [])

      // 🔥 PERSIST URL OPTION (Contract)
      const urlContractId = searchParams.get('contract')
      const urlContractCode = searchParams.get('contractCode')

      if (urlContractId && urlContractCode) {
        const exists = processedContracts.find(c => String(c.id) === String(urlContractId))
        if (!exists) {
          processedContracts.push({ id: Number(urlContractId), label: urlContractCode })
        }
      }

      const processedDropdowns = {
        origins: dedupeById(dd.company?.name || []),
        billing_frequencies: dedupeById(dd.billing_frequency?.name || []),
        service_frequencies: dedupeById(dd.service_frequency?.name || []),
        customers: processedCustomers,
        contracts: processedContracts,
        sales_persons: dedupeById(dd.sales_person?.name || []),
        contract_levels: dedupeById(dd.contract_level?.name || []),
        invoice_statuses: [
          { id: 1, label: 'Yes' },
          { id: 0, label: 'No' }
        ],
        contract_types: dedupeById(dd.contract_type?.name || []),
        invoice_types: dedupeById(dd.invoice_type?.name || [])
      }
      setDropdownData(processedDropdowns)

      setData(
        results.map((inv, index) => ({
          sno: index + 1 + pagination.pageIndex * pagination.pageSize,
          ...mapInvoice(inv, processedDropdowns)
        }))
      )

      setTotalCount(count)

      // Calculate summary stats
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
      console.error(err)
      showToast('error', 'Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    const timer = setTimeout(() => {
      loadEverything()
    }, 300) // wait 300ms so state finishes update

    return () => clearTimeout(timer)
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    dateFilter,
    dateRange[0],
    dateRange[1],
    originFilter?.id,
    contractTypeFilter?.id,
    invoiceStatusFilter?.label,
    serviceFreqFilter?.id,
    billingFreqFilter?.id,
    contractLevelFilter?.id,
    invoiceTypeFilter?.id,
    salesPersonFilter?.id,
    customerFilter?.id,
    contractFilter?.id,
    searchText
  ])

  // ── Refresh ───────────────────────────────────
  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => loadEverything(), 300)
  }

  // APPROVE (Issue Invoice)
  const handleApprove = async invoice => {
    if (invoice.issued) {
      showToast('info', 'Already approved')
      return
    }

    try {
      // same issue API for this user
      const { updateInvoice } = await import('@/api/invoice')

      await updateInvoice(invoice.id, { is_issued: 1 })
      showToast('success', 'Invoice Approved')
      loadEverything()
    } catch (err) {
      showToast('error', 'Approval Failed')
    }
  }

  // EDIT
  const handleEdit = invoice => {
    showToast('info', `Edit Invoice ${invoice.invNo} coming soon...`)
  }

  // DELETE
  const handleDelete = async invoice => {
    if (!confirm(`Are you sure you want to delete invoice ${invoice.invNo}?`)) return

    try {
      const { deleteInvoice } = await import('@/api/invoice')
      await deleteInvoice(invoice.id)

      showToast('success', 'Invoice deleted')
      loadEverything()
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

    salesPerson: dd.sales_persons?.find(s => String(s.id) === String(inv.sales_person_id))?.label || '-'
  })

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
    setDateRange([today, today])
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

      <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, position: 'relative' }}>

        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant='h5' sx={{ fontWeight: 600 }}>
              Invoice List
            </Typography>

            <Button
              variant='contained'
              startIcon={
                <RefreshIcon
                  sx={{
                    animation: loading ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' }
                    }
                  }}
                />
              }
              disabled={loading}
              onClick={handleRefresh}
              sx={{ textTransform: 'none', height: 36, px: 2.5 }}
              size='small'
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* FILTERS */}
        <Box sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {loading && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                bgcolor: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(3px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                zIndex: 200,
                animation: 'fadeIn 0.3s ease-in-out',
                '@keyframes fadeIn': {
                  from: { opacity: 0 },
                  to: { opacity: 1 }
                }
              }}
            >
              <ProgressCircularCustomization size={70} thickness={5} />
              <Typography
                mt={2}
                sx={{
                  color: 'primary.main',
                  fontWeight: 600,
                  fontSize: '1.05rem',
                  letterSpacing: 0.3
                }}
              >
                Loading Invoices...
              </Typography>
            </Box>
          )}

          {/* FILTERS */}
          <Box sx={{ pb: 3, flexShrink: 0 }}>
            <Grid container spacing={3}>
              {/* Row 1 */}
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Checkbox
                    checked={dateFilter}
                    onChange={e => {
                      setDateFilter(e.target.checked)
                      if (!e.target.checked) {
                        setDateRange([null, null])
                      } else {
                        const today = new Date()
                        setDateRange([today, today])
                      }
                    }}
                    size='small'
                  />
                  <Typography sx={{ mb: 0.5, fontWeight: 500 }}>Date Filter</Typography>
                </Box>

                <GlobalDateRange
                  start={dateRange[0]}
                  end={dateRange[1]}
                  onSelectRange={({ start, end }) => setDateRange([start, end])}
                  disabled={!dateFilter}
                  size='small'
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <CustomAutocomplete
                  options={originOptions}
                  value={originFilter || null}
                  onChange={(_, v) => setOriginFilter(v || null)}
                  getOptionLabel={opt => opt?.label || ''}
                  renderInput={p => <CustomTextField {...p} label='Origin' size='small' />}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <CustomAutocomplete
                  options={contractTypeOptions}
                  value={contractTypeFilter || null}
                  onChange={(_, v) => setContractTypeFilter(v || null)}
                  getOptionLabel={opt => opt?.label || ''}
                  renderInput={p => <CustomTextField {...p} label='Contract Type' size='small' />}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <CustomAutocomplete
                  options={invoiceStatusOptions}
                  value={invoiceStatusFilter || null}
                  onChange={(_, v) => setInvoiceStatusFilter(v || null)}
                  getOptionLabel={opt => opt?.label || ''}
                  renderInput={p => <CustomTextField {...p} label='Invoice Status' size='small' />}
                />
              </Grid>

              {/* Row 2 */}
              <Grid item xs={12} sm={6} md={3}>
                <CustomAutocomplete
                  options={serviceFreqOptions}
                  value={serviceFreqFilter || null}
                  onChange={(_, v) => setServiceFreqFilter(v || null)}
                  getOptionLabel={opt => opt?.label || ''}
                  renderInput={p => <CustomTextField {...p} label='Service Frequency' size='small' />}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <CustomAutocomplete
                  options={billingFreqOptions}
                  value={billingFreqFilter || null}
                  onChange={(_, v) => setBillingFreqFilter(v || null)}
                  getOptionLabel={opt => opt?.label || ''}
                  renderInput={p => <CustomTextField {...p} label='Billing Frequency' size='small' />}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <CustomAutocomplete
                  options={contractLevelOptions}
                  value={contractLevelFilter || null}
                  onChange={(_, v) => setContractLevelFilter(v || null)}
                  getOptionLabel={opt => opt?.label || ''}
                  renderInput={p => <CustomTextField {...p} label='Contract Level' size='small' />}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <CustomAutocomplete
                  options={invoiceTypeOptions}
                  value={invoiceTypeFilter || null}
                  onChange={(_, v) => setInvoiceTypeFilter(v || null)}
                  getOptionLabel={opt => opt?.label || ''}
                  renderInput={p => <CustomTextField {...p} label='Invoice Type' size='small' />}
                />
              </Grid>

              {/* Row 3 */}
              <Grid item xs={12} sm={6} md={3}>
                <CustomAutocomplete
                  options={salesPersonOptions}
                  value={salesPersonFilter || null}
                  onChange={(_, v) => setSalesPersonFilter(v || null)}
                  getOptionLabel={opt => opt?.label || ''}
                  renderInput={p => <CustomTextField {...p} label='Sales Person' size='small' />}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <CustomAutocomplete
                  options={customerOptions}
                  value={customerFilter || null}
                  getOptionLabel={option => option?.label || ''}
                  isOptionEqualToValue={(option, value) => option?.id === value?.id}
                  onChange={(_, v) => {
                    setCustomerFilter(v || null)
                    setContractFilter(null)

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

              <Grid item xs={12} sm={6} md={3} mb={2}>
                <CustomAutocomplete
                  options={contractOptions}
                  value={contractFilter || null}
                  getOptionLabel={opt => opt?.label || ''}
                  isOptionEqualToValue={(a, b) => a?.id === b?.id}
                  onChange={(_, v) => setContractFilter(v || null)}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      {option.label}
                    </li>
                  )}
                  renderInput={params => <CustomTextField {...params} label='Contract' size='small' />}
                />
              </Grid>
            </Grid>

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
                value={searchText}
                onChange={e => {
                  setSearchText(e.target.value)
                  setPagination(p => ({ ...p, pageIndex: 0 }))
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
