'use client'

import { useState } from 'react'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabPanel from '@mui/lab/TabPanel'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { Radio, RadioGroup, FormControlLabel, FormGroup, Checkbox, MenuItem, Button } from '@mui/material'
import Grid from '@mui/material/Grid2'
import CustomTabList from '@core/components/mui/TabList'
import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import Link from '@components/Link'

export default function ProductInventory({ onTabChange }) {
  const [activeTab, setActiveTab] = useState('contract')
  const [date, setDate] = useState(null)

  const theme = useTheme()
  const isBelowMdScreen = useMediaQuery(theme.breakpoints.down('md'))

  const handleChange = (event, value) => {
    setActiveTab(value)
    onTabChange(value) // tell parent component which tab is active
  }

  return (
    <TabContext value={activeTab}>
      <div className='flex max-md:flex-col gap-6 items-start justify-start'>
        <div>
          <CustomTabList
            orientation='vertical'
            onChange={handleChange}
            pill='true'
            className='!items-start !justify-start text-left'
          >
            {/* <Tab
              value='dashboard'
              label='Dasbaord'
              icon={<i className='tabler-home' />}
              iconPosition='start'
              className='!justify-start !items-center text-left'
            /> */}

            <Tab
              value='contract'
              label='Contract'
              icon={<i className='tabler-file-description' />}
              iconPosition='start'
              className='!justify-start !items-center text-left'
            />

            <Tab
              value='pest'
              label='Pests'
              icon={<i className='tabler-clipboard-check' />}
              iconPosition='start'
              className='!justify-start !items-center text-left'
            />
            <Tab
              value='service-request'
              label='Service Requests'
              icon={<i className='tabler-world' />}
              iconPosition='start'
              className='!justify-start !items-center text-left'
            />
            <Tab
              value='invoice'
              label='Invoice'
              icon={<i className='tabler-login' />}
              iconPosition='start'
              className='!justify-start !items-center text-left'
            />
            <Tab
              value='location'
              label='Location'
              icon={<i className='tabler-coin' />}
              iconPosition='start'
              className='!justify-start !items-center text-left'
            />
            <Tab
              value='file'
              label='File Manger'
              icon={<i className='tabler-file-check' />}
              iconPosition='start'
              className='!justify-start !items-center text-left'
            />
            <Tab
              value='call-log'
              label='Call log'
              icon={<i className='tabler-file-invoice' />}
              iconPosition='start'
              className='!justify-start !items-center text-left'
            />
            <Tab
              value='todo-list'
              label='TODO List'
              icon={<i className='tabler-notes' />}
              iconPosition='start'
              className='!justify-start !items-center text-left'
            />
            <Tab
              value='site-risk'
              label='Site Risk'
              icon={<i className='tabler-file-dollar' />}
              iconPosition='start'
              className='!justify-start !items-center text-left'
            />
          </CustomTabList>
        </div>
      </div>

      {/* We’ll keep TabPanels here so you can reuse later if needed */}
      <Divider orientation={isBelowMdScreen ? 'horizontal' : 'vertical'} flexItem />
      <div style={{ display: 'none' }}>
        <TabPanel value='restock'>
          <Typography>Restock Content</Typography>
        </TabPanel>
        <TabPanel value='shipping'>
          <Typography>Shipping Content</Typography>
        </TabPanel>
        <TabPanel value='global-delivery'>
          <Typography>Global Delivery Content</Typography>
        </TabPanel>
        <TabPanel value='attributes'>
          <Typography>Attributes Content</Typography>
        </TabPanel>
        <TabPanel value='advanced'>
          <Typography>Advanced Content</Typography>
        </TabPanel>
        <TabPanel value='file'>
          <Typography>Advanced Content</Typography>
        </TabPanel>
        <TabPanel value='invoice'>
          <Typography>Advanced Content</Typography>
        </TabPanel>
        <TabPanel value='project'>
          <Typography>Advanced Content</Typography>
        </TabPanel>
        <TabPanel value='budget'>
          <Typography>Advanced Content</Typography>
        </TabPanel>
      </div>
    </TabContext>
  )
}
