'use client'
import { useState } from 'react'

import Grid from '@mui/material/Grid2'

import PestListPage from './pest/PestListPage'
import ServiceRequestListPage from './service-request/ServiceRequestListPage'
import InvoiceListPage from './invoice/InvoiceListPage'
import LocationListPage from './location/LocationListPage'
import FileManagerListPage from './file/FileManagerListPage'
import CallLogListPage from './call-log/CallLogListPage'
import TodoListPage from './todo-list/TodoListPage'
import SiteRiskPage from './site-risk/SiteRiskPage'

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

export default function Project() {
  const [activeTab, setActiveTab] = useState('dashboard')

  // or 'pest'

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <TabContentSwiper />
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

  return (
    <>
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
                {' '}
                {/* remove default padding if needed */}
                {/* Main row with left text and right icons */}
                <div className='flex items-start justify-between w-full'>
                  {/* Left side content */}
                  <div className='flex items-center gap-2'>
                    <Typography variant='h4' fontWeight='600' className='text-gray-800'>
                      #PR30214
                    </Typography>

                    <div className='w-px h-6 bg-gray-400 mx-2' />

                    <Typography variant='h4' fontWeight='600' className='text-gray-800'>
                      Pkg: Digital Marketing
                    </Typography>

                    <div className='w-px h-6 bg-gray-400 mx-2' />

                    {/* Active Status with green dot */}
                    <Typography variant='body1' fontWeight='500' className='flex items-center gap-2 text-green-600'>
                      <span className='w-2.5 h-2.5 rounded-full bg-green-600 inline-block' />
                      Active
                    </Typography>
                  </div>

                  <Grid sx={{ width: '920px' }}>
                    <div className='flex items-center gap-2 mt-1'>
                      <UserActivityTimeLine />
                    </div>
                  </Grid>

                  {/* Right side icons */}
                  <div className='flex items-center gap-3'>
                    <IconButton size='small' className='bg-primary text-white hover:bg-primary/90'>
                      <i className='tabler-printer text-[18px]' />
                    </IconButton>
                    <IconButton size='small' className='bg-primary text-white hover:bg-primary/90'>
                      <i className='tabler-share text-[18px]' />
                    </IconButton>
                    <IconButton size='small' className='bg-primary text-white hover:bg-primary/90'>
                      <i className='tabler-copy text-[18px]' />
                    </IconButton>
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
    </>
  )
}
