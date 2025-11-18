'use client'

import * as React from 'react'
import {
  Card,
  CardContent,
  Box,
  Grid,
  Fab,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Collapse
} from '@mui/material'

import AddIcon from '@mui/icons-material/Add'

// ICONS
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import PaidIcon from '@mui/icons-material/Paid'

import SendIcon from '@mui/icons-material/Send'
import DraftsIcon from '@mui/icons-material/Drafts'
import InboxIcon from '@mui/icons-material/MoveToInbox'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import StarBorder from '@mui/icons-material/StarBorder'
import ListSubheader from '@mui/material/ListSubheader'
import ReplayIcon from '@mui/icons-material/Replay'
import Avatar from '@mui/material/Avatar'
import EarningReportsWithTabs from '@/views/dashboards/crm/EarningReportsWithTabs'
import CampaignIcon from '@mui/icons-material/Campaign'
import DesignServicesIcon from '@mui/icons-material/DesignServices'
import EmailIcon from '@mui/icons-material/Email'
import WebIcon from '@mui/icons-material/Web'
import LaptopMacIcon from '@mui/icons-material/LaptopMac'
import SupportTracker from '@/views/dashboards/analytics/SupportTracker'

// ------------------- NESTED LIST COMPONENT -------------------
const NestedList = () => {
  const [open, setOpen] = React.useState(true)

  const handleClick = () => {
    setOpen(!open)
  }

  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }} component='nav'>
      <ListItemButton>
        <ListItemIcon>
          <ReplayIcon />
        </ListItemIcon>

        <Box display='flex' alignItems='center' justifyContent='space-between' width='100%'>
          <Typography variant='h6'>Checkup</Typography>
          <Typography variant='body2' color='text.secondary'>
            2/3
          </Typography>
        </Box>
      </ListItemButton>

      <ListItemButton>
        <ListItemIcon>
          <ReplayIcon />
        </ListItemIcon>

        <Box display='flex' alignItems='center' justifyContent='space-between' width='100%'>
          <Typography variant='h6'>Checkup</Typography>
          <Typography variant='body2' color='text.secondary'>
            1/3
          </Typography>
        </Box>
      </ListItemButton>

      <ListItemButton>
        <ListItemIcon>
          <ReplayIcon />
        </ListItemIcon>

        <Box display='flex' alignItems='center' justifyContent='space-between' width='100%'>
          <Typography variant='h6'>Checkup</Typography>
          <Typography variant='body2' color='text.secondary'>
            3/3
          </Typography>
        </Box>
      </ListItemButton>

      <ListItemButton>
        <ListItemIcon>
          <ReplayIcon />
        </ListItemIcon>

        <Box display='flex' alignItems='center' justifyContent='space-between' width='100%'>
          <Typography variant='h6'>Checkup</Typography>
          <Typography variant='body2' color='text.secondary'>
            2/3
          </Typography>
        </Box>
      </ListItemButton>

      <ListItemButton>
        <ListItemIcon>
          <ReplayIcon />
        </ListItemIcon>

        <Box display='flex' alignItems='center' justifyContent='space-between' width='100%'>
          <Typography variant='h6'>Checkup</Typography>
          <Typography variant='body2' color='text.secondary'>
            1/3
          </Typography>
        </Box>
      </ListItemButton>

      <ListItemButton>
        <ListItemIcon>
          <DraftsIcon />
        </ListItemIcon>
        <ListItemText primary='Drafts' />
      </ListItemButton>

      <ListItemButton onClick={handleClick}>
        <ListItemIcon>
          <InboxIcon />
        </ListItemIcon>
        <ListItemText primary='Inbox' />
        {open ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>

      <Collapse in={open} timeout='auto' unmountOnExit>
        <List component='div' disablePadding>
          <ListItemButton sx={{ pl: 4 }}>
            <ListItemIcon>
              <StarBorder />
            </ListItemIcon>
            <ListItemText primary='Starred' />
          </ListItemButton>
        </List>
      </Collapse>
    </List>
  )
}

// ------------------- MAIN UI COMPONENT -------------------
const cardData = [
  {
    amount: 'Digital Marketing',
    label: 'Total Earning',
    icon: <CampaignIcon />,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600'
  },
  {
    amount: 'Graphic Design',
    label: 'Today Sales',
    icon: <DesignServicesIcon />,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600'
  },
  {
    amount: 'E-mail Steup',
    label: 'Monthly Profit',
    icon: <EmailIcon />,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600'
  },
  {
    amount: 'Web Design',
    label: 'Weekly Revenue',
    icon: <LaptopMacIcon />,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600'
  }
]

const TabContentCards = () => {
  return (
    <>
      <Box sx={{ width: '100%', position: 'relative', pt: 4, pb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {/* <Fab color='primary' size='small' sx={{ zIndex: 10, boxShadow: '0px 2px 10px rgba(0,0,0,0.15)' }}>
            <AddIcon />
          </Fab> */}

          {/* CARDS */}
          {/* <Grid container spacing={3} sx={{ flex: 1 }}>
            {cardData.map((item, i) => (
              <Grid item xs={12} md={3} key={i}>
                <Card
                  sx={{
                    borderRadius: '8px',
                    height: '90px',
                    display: 'flex',
                    alignItems: 'center',
                    boxShadow: '0px 2px 4px rgba(0,0,0,0.06), 0px 8px 16px rgba(0,0,0,0.08)'
                  }}
                >
                  <CardContent sx={{ width: '100%' }}>
                    <div className='flex items-center gap-3'>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.iconBg}`}>
                        <span className={`${item.iconColor} text-[20px] mt-2`}>{item.icon}</span>
                      </div>

                      <div>
                        <p className='text-lg font-semibold text-gray-800'>{item.amount}</p>
                        <p className='text-sm text-gray-500'>{item.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid> */}
        </Box>
      </Box>

      {/* GRID SECTION */}
      <div className='grid grid-cols-3 gap-4 bg-gray-100'>
        {/* ✅ LEFT TALL CARD (Nested List Added Here) */}
        <div className='col-span-1 row-span-2'>
          <Card className='bg-white rounded-2xl shadow-md w-full h-[390px]'>
            {' '}
            {/* FIXED HEIGHT HERE */}
            <CardContent sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <ListSubheader
                component='div'
                className='mt-4 ms-4'
                sx={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: '#000',
                  bgcolor: 'transparent',
                  px: 2,
                  py: 1.5
                }}
              >
                Task Types
              </ListSubheader>

              {/* LIST SCROLLS INSIDE */}
              <div style={{ overflowY: 'auto', flex: 1 }}>
                <NestedList />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Top Cards */}

        {/* Bottom Right Wide Card */}
        <div className='col-span-2'>
          <SupportTracker />
        </div>
      </div>
    </>
  )
}

export default TabContentCards
