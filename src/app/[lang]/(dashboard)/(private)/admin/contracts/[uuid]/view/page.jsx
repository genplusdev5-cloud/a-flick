'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getContractDetails } from '@/api/contract' // <-- Create this API if not exists
import { decodeId, isValidEncodedId } from '@/utils/urlEncoder'
import AgreementPDF from '@/components/pdf/AgreementPDF'
import SchedulePDF from '@/components/pdf/SchedulePDF'
import { printSchedule } from '@/helpers/printSchedule'

import Grid from '@mui/material/Grid2'
import { Tooltip, Drawer } from '@mui/material'

import { terminateContract } from '@/api/contract/icons/terminate'
import { holdContract } from '@/api/contract/icons/hold'
import { renewContract } from '@/api/contract/icons/renew'

import RenewDrawer from '@/components/service-pages/contract-actions/RenewDrawer'
import HoldDrawer from '@/components/service-pages/contract-actions/HoldDrawer'
import TerminateDrawer from '@/components/service-pages/contract-actions/TerminateDrawer'

import PestListPage from './pest/PestListPage'
import ServiceRequestListPage from './service-request/ServiceRequestListPage'
import InvoiceListPage from './invoice/InvoiceListPage'
import LocationListPage from './location/LocationListPage'
import FileManagerListPage from './file/FileManagerListPage'
import CallLogListPage from './call-log/CallLogListPage'
import TodoListPage from './todo-list/TodoListPage'
import SiteRiskPage from './site-risk/SiteRiskPage'
import ContractViewPage from './contract/page'

// MUI Imports
import { Card, CardContent, Typography, Box } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import Fab from '@mui/material/Fab'
import HistoryIcon from '@mui/icons-material/History'
import IconButton from '@mui/material/IconButton'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import PhoneIcon from '@mui/icons-material/Phone'

// Files Imports
import RadialBarChart from '@/views/apps/ecommerce/dashboard/RadialBarChart'
import ProductInventory from '@/views/apps/ecommerce/products/add/ProductInventory'
import UserActivityTimeLine from '@/views/apps/user/view/user-right/overview/UserActivityTimeline'
import TabContentSwiper from '@/components/TabContentSwiper'
import SalesOverview from '@/views/dashboards/analytics/SalesOverview'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export default function Project() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [openTerminate, setOpenTerminate] = useState(false)
  const [openHold, setOpenHold] = useState(false)
  const [openRenew, setOpenRenew] = useState(false)

  const [openAgreement, setOpenAgreement] = useState(false)
  const [agreementData, setAgreementData] = useState(null)
  const [scheduleData, setScheduleData] = useState(null)

  const agreementRef = useRef()

  const { uuid } = useParams()
  const router = useRouter()
  const [contract, setContract] = useState(null)
  const [loading, setLoading] = useState(true)
  const [contractId, setContractId] = useState(null)

  // Decode the Base64 encoded ID
  useEffect(() => {
    if (!uuid) {
      router.push('/404')
      return
    }

    // Validate and decode the Base64 ID
    if (!isValidEncodedId(uuid)) {
      console.error('Invalid encoded contract ID:', uuid)
      router.push('/404')
      return
    }

    const decodedId = decodeId(uuid)
    console.log('🔓 Base64 Decoding:', { encoded: uuid, decoded: decodedId })
    
    if (!decodedId) {
      router.push('/404')
      return
    }

    setContractId(decodedId)
  }, [uuid, router])

  useEffect(() => {
    const loadData = async () => {
      if (!contractId) return

      console.log('🔍 Decoded Contract ID:', contractId, 'Type:', typeof contractId)

      try {
        const res = await getContractDetails(contractId)
        setContract(res)
      } catch (err) {
        console.error('Error loading contract:', err)
        // If API returns 404 or unauthorized, redirect
        if (err.response?.status === 404 || err.response?.status === 401) {
          router.push('/404')
        }
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [contractId, router])

  const loadContractData = async () => {
    if (!contractId) return

    try {
      const res = await getContractDetails(contractId)
      setContract(res)
    } catch (err) {
      console.error('Error loading contract:', err)
    }
  }

  // or 'pest'

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <TabContentSwiper />

      case 'contract':
        return <ContractViewPage />

      case 'pest':
        return <PestListPage />

      case 'service-request':
        return <ServiceRequestListPage />

      case 'invoice':
        return <InvoiceListPage />

      case 'location':
        return <LocationListPage />

      case 'file':
        return <FileManagerListPage />

      case 'call-log':
        return <CallLogListPage />

      case 'todo-list':
        return <TodoListPage />

      case 'site-risk':
        return <SiteRiskPage />

      default:
        return null
    }
  }

  // ================= AGREEMENT PRINT FUNCTION =================
  // ================= AGREEMENT PRINT FUNCTION =================
  const handleAgreementPrint = async () => {
    if (!contractId) return

    // 1. Load Agreement API
    const { getAgreementPDF } = await import('@/api/contract/agreement')
    const data = await getAgreementPDF(contractId)

    // 2. Set the data so AgreementPDF will render
    setAgreementData(data)

    // 3. Wait for AgreementPDF DOM to appear
    setTimeout(async () => {
      const element = document.getElementById('agreement-preview')
      if (!element) return

      // 4. Convert HTML → Canvas
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })

      const imgData = canvas.toDataURL('image/png')

      // 5. Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4')
      const width = pdf.internal.pageSize.getWidth()
      const height = (canvas.height * width) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, width, height)

      // 6. Generate Blob → Preview Tab
      const blob = pdf.output('blob')
      const blobUrl = URL.createObjectURL(blob)

      window.open(blobUrl, '_blank')
    }, 800)
  }

  const handleSchedulePrint = async () => {
    if (!contractId) return

    const { getSchedulePDF } = await import('@/api/contract/schedulepdf')
    const data = await getSchedulePDF(contractId)

    setScheduleData(data)

    setTimeout(async () => {
      const element = document.getElementById('schedule-preview-container')
      if (!element) return

      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#fff'
      })

      const img = canvas.toDataURL('image/png')

      const pdf = new jsPDF('p', 'mm', 'a4')
      const width = pdf.internal.pageSize.getWidth()
      const height = (canvas.height * width) / canvas.width

      pdf.addImage(img, 'PNG', 0, 0, width, height)

      const blob = pdf.output('blob')
      const blobURL = URL.createObjectURL(blob)

      window.open(blobURL, '_blank')
    }, 800)
  }

  return (
    <>
      {/* Hidden Agreement Preview for PDF Generation */}
      <div
        id='agreement-preview'
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          width: '210mm',
          background: '#ffffff',
          visibility: 'visible',
          zIndex: -1
        }}
      >
        {agreementData && <AgreementPDF agreementData={agreementData} />}
      </div>

      {/* Hidden Schedule Preview for PDF Generation */}
      <div
        id='schedule-preview-container'
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          width: '210mm',
          background: '#ffffff',
          visibility: 'visible',
          zIndex: -1
        }}
      >
        {scheduleData && <SchedulePDF data={scheduleData} />}
      </div>

      {/* Top product Details Start */}
      <Card className='bg-white shadow-md rounded-2xl'>
        <CardContent>
          {/* 1 grid start */}
          <Grid
            container
            spacing={30}
            alignItems='flex-start'
            justifyContent='flex-start' // 👈 ensures left alignment
          >
            {/* 1 Card — Full Width Card Start */}
            <Grid item xs={12}>
              <CardContent className='!p-0'>
                {/* Main row with left text and right icons */}
                <div className='flex items-start justify-between w-full'>
                  {/* LEFT SIDE CONTENT */}
                  <div className='flex items-center gap-2'>
                    {/* Contract Code */}
                    <Typography variant='h4' fontWeight='600' className='text-gray-800'>
                      #{contract?.contract_code || '--'}
                    </Typography>

                    <div className='w-px h-6 bg-gray-400 mx-2' />

                    {/* Category / Package */}
                    <Typography variant='h4' fontWeight='600' className='text-gray-800'>
                      Pkg: {contract?.category || 'N/A'}
                    </Typography>

                    <div className='w-px h-6 bg-gray-400 mx-2' />

                    {/* Status */}
                    <Typography
                      variant='body1'
                      fontWeight='500'
                      className={`flex items-center gap-2 ${
                        contract?.contract_status?.toLowerCase() === 'current' ? 'text-green-600' : 'text-yellow-600'
                      }`}
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          contract?.contract_status?.toLowerCase() === 'current' ? 'bg-green-600' : 'bg-yellow-500'
                        } inline-block`}
                      />
                      {contract?.contract_status || 'Unknown'}
                    </Typography>
                  </div>

                  {/* CENTER — Activity Timeline */}
                  <Grid sx={{ width: '920px' }}>
                    <div className='flex items-center gap-2 mt-1'>
                      <UserActivityTimeLine />
                    </div>
                  </Grid>

                  {/* RIGHT SIDE ICONS */}
                  <div className='flex items-center gap-3 shrink-0'>
                    <Tooltip title='Terminate'>
                      <IconButton
                        size='small'
                        className='bg-primary text-white hover:bg-primary/90'
                        onClick={() => setOpenTerminate(true)}
                      >
                        <i className='tabler-trash text-[18px]' />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title='Hold'>
                      <IconButton
                        size='small'
                        className='bg-primary text-white hover:bg-primary/90'
                        onClick={() => setOpenHold(true)}
                      >
                        <i className='tabler-hand-stop text-[18px]' />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title='Renew'>
                      <IconButton
                        size='small'
                        className='bg-primary text-white hover:bg-primary/90'
                        onClick={() => setOpenRenew(true)}
                      >
                        <i className='tabler-refresh text-[18px]' />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title='Schedule Request'>
                      <IconButton size='small' className='bg-primary text-white hover:bg-primary/90'>
                        <i className='tabler-calendar-plus text-[18px]' />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title='Service Schedule Print'>
                      <IconButton
                        size='small'
                        className='bg-primary text-white hover:bg-primary/90'
                        onClick={handleSchedulePrint}
                      >
                        <i className='tabler-printer text-[18px]' />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title='Agreement (Preview + Print)'>
                      <IconButton
                        size='small'
                        className='bg-primary text-white hover:bg-primary/90'
                        onClick={handleAgreementPrint}
                      >
                        <i className='tabler-file-description text-[18px]' />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title='MTBS Agreement'>
                      <IconButton size='small' className='bg-primary text-white hover:bg-primary/90'>
                        <i className='tabler-file-text text-[18px]' />
                      </IconButton>
                    </Tooltip>
                  </div>
                </div>
              </CardContent>
            </Grid>

            {/* 1 Card — Full Width Card End */}
          </Grid>
          {/* 1 grid end */}

          {/* 2 Grid Start */}
          <Grid container spacing={8} alignItems='center' className='mt-4'>
            {/* Left Company Details */}
            <Grid item xs={12} md={5} sx={{ width: '530px' }}>
              <div className='flex items-center gap-3'>
                <div className='flex flex-col'>
                  {/* Company Name */}
                  <Typography variant='h4' fontWeight='600' className='flex items-center gap-2'>
                    ICAS Company Genplus Innovations
                    <a href='/edit-company'>
                      <Fab
                        size='small'
                        color='primary'
                        aria-label='edit'
                        sx={{
                          width: 26,
                          height: 26,
                          minHeight: 26,
                          boxShadow: 'none'
                        }}
                      >
                        <EditIcon sx={{ fontSize: 15 }} />
                      </Fab>
                    </a>
                  </Typography>

                  {/* Address */}
                  <Box className='mt-1'>
                    <Typography variant='h6' color='text.secondary' className='flex items-center gap-1'>
                      <LocationOnIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                      Office 123, Green Park Avenue, New Delhi, India
                    </Typography>

                    {/* Contact */}
                    <Typography
                      variant='body1'
                      color='text.secondary'
                      fontWeight={500}
                      className='flex items-center gap-1 mt-0.5'
                    >
                      <PhoneIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                      John Doe | john@example.com | +1 234 567 8901
                    </Typography>
                  </Box>
                </div>
              </div>
            </Grid>

            {/* Sales Overview */}
            <Grid item xs={12} md={2}>
              <SalesOverview />
            </Grid>

            {/* Stats Cards */}
            <Grid item xs={12} md={5}>
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                {/* Tasks */}
                <Card className='bg-[#1DA1F2]'>
                  <CardContent>
                    <div className='flex items-center gap-2 mb-3'>
                      <i className='tabler-clipboard-check text-3xl text-white' />
                      <Typography variant='h6' className='text-white'>
                        Service Request
                      </Typography>
                    </div>
                    <div className='flex justify-between items-center text-white'>
                      <Typography className='text-white'>Total Task: 50</Typography>
                    </div>
                  </CardContent>
                </Card>

                {/* Team */}
                <Card className='bg-[#7367F0]'>
                  <CardContent>
                    <div className='flex items-center gap-2 mb-3'>
                      <i className='tabler-users text-3xl text-white' />
                      <Typography variant='h6' className='text-white'>
                        Invoice Summary
                      </Typography>
                    </div>
                    <div className='flex justify-between items-center text-white'>
                      <Typography className='text-white'>Total Task: 25</Typography>
                    </div>
                  </CardContent>
                </Card>

                {/* Logs */}
                <Card className='bg-[#1EDA57] w-[200px]'>
                  <CardContent>
                    <div className='flex items-center gap-2 mb-3'>
                      <i className='tabler-login text-3xl text-white' />
                      <Typography variant='h6' className='text-white'>
                        Kiv Summary
                      </Typography>
                    </div>
                    <div className='flex justify-between items-center text-white'>
                      <Typography className='text-white'>Total Task: 38</Typography>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </Grid>
          </Grid>
          {/* 2 Grid End */}

          {/* 3 grid Bottom start */}
          <Grid item xs={12} className='mt-2'>
            <Box
              sx={{
                bgcolor: 'white', // here is bg-color
                borderRadius: '8px',
                py: 1,
                px: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                overflow: 'hidden'
              }}
            >
              {/* STATIC TEXT */}
              <Typography
                variant='h6'
                sx={{
                  fontSize: '15px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px', // spacing between icon & text
                  whiteSpace: 'nowrap'
                }}
              >
                <HistoryIcon sx={{ fontSize: 18, color: '#6B7280' }} />
                Last Activity : 5 mins ago
              </Typography>

              {/* MARQUEE TEXT */}
              <marquee behavior='scroll' direction='left' scrollamount='5' style={{ flexGrow: 1 }}>
                <span
                  style={{
                    color: '#000',
                    fontWeight: '500',
                    fontSize: '15px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  🕒 2 hours ago | 09.20am — Working on: Infozub App Dashboard Development | Client: ICAS Company
                </span>
              </marquee>
            </Box>
          </Grid>
          {/* 3 grid Bottom end */}
        </CardContent>
      </Card>
      {/* Top product Details End */}

      {/* Tabs Start */}
      <div className='grid grid-cols-12 gap-4 mt-8'>
        {/* Left Sidebar */}
        <div className='col-span-3 md:col-span-2'>
          <Card className='bg-white rounded-2xl shadow-md'>
            <RadialBarChart />
            <CardContent>
              <ProductInventory onTabChange={setActiveTab} />
            </CardContent>
          </Card>
        </div>
        {/* Left Sidebar */}

        {/* right Content Starts */}
        <div className='col-span-9 md:col-span-10 space-y-4'>
          {/* 2 cards Tabs Contant Start*/}

          {renderTabContent()}

          {/* 2 cards Tabs Contant End*/}
        </div>
        {/* right Content Starts */}
      </div>
      {/* Tabs End */}

      <Drawer
        anchor='right'
        open={openTerminate}
        onClose={() => setOpenTerminate(false)}
        PaperProps={{
          sx: { width: 380, p: 3 }
        }}
      >
        <TerminateDrawer
          contractId={contractId}
          onClose={() => setOpenTerminate(false)}
          reload={() => console.log('Reload contract after termination')}
        />
      </Drawer>

      <Drawer
        anchor='right'
        open={openHold}
        onClose={() => setOpenHold(false)}
        PaperProps={{ sx: { width: 380, p: 3 } }}
      >
        <HoldDrawer
          contractId={contractId}
          onClose={() => setOpenHold(false)}
          reload={() => console.log('Reload contract after hold')}
        />
      </Drawer>

      <Drawer
        anchor='right'
        open={openRenew}
        onClose={() => setOpenRenew(false)}
        PaperProps={{ sx: { width: 380, p: 3 } }}
      >
        <RenewDrawer contractId={contractId} onClose={() => setOpenRenew(false)} reload={loadContractData} />
      </Drawer>
    </>
  )
}
