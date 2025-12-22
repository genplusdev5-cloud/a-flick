'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Tab from '@mui/material/Tab'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'

// Third Party Imports
import classnames from 'classnames'

// Components Imports
import OptionMenu from '@core/components/option-menu'
import CustomAvatar from '@core/components/mui/Avatar'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

// Vars
const tabData = [
  {
    type: 'Daily',
    avatarIcon: 'tabler-calendar-event',
    series: [{ data: [12, 18, 15, 20, 14, 22, 19] }]
  },
  {
    type: 'Weekly',
    avatarIcon: 'tabler-calendar-stats',
    series: [{ data: [85, 92, 78, 95, 88, 102, 98] }]
  },
  {
    type: 'Monthly',
    avatarIcon: 'tabler-calendar-due',
    series: [{ data: [320, 350, 310, 380, 400, 390, 420, 450, 410, 380, 430, 460] }]
  }
]

const renderTabs = value => {
  return tabData.map((item, index) => (
    <Tab
      key={index}
      value={item.type}
      className='mie-4'
      label={
        <div
          className={classnames(
            'flex flex-col items-center justify-center gap-2 is-[110px] bs-[100px] border rounded-xl',
            item.type === value ? 'border-solid border-[var(--mui-palette-primary-main)]' : 'border-dashed'
          )}
        >
          <CustomAvatar variant='rounded' skin='light' size={38} {...(item.type === value && { color: 'primary' })}>
            <i className={classnames('text-[22px]', { 'text-textSecondary': item.type !== value }, item.avatarIcon)} />
          </CustomAvatar>
          <Typography className='font-medium' color='text.primary'>
            {item.type}
          </Typography>
        </div>
      }
    />
  ))
}

const renderTabPanels = (value, theme, options, colors) => {
  return tabData.map((item, index) => {
    const max = Math.max(...item.series[0].data)
    const seriesIndex = item.series[0].data.indexOf(max)
    const finalColors = colors.map((color, i) => (seriesIndex === i ? 'var(--mui-palette-primary-main)' : color))

    return (
      <TabPanel key={index} value={item.type} className='!p-0'>
        <AppReactApexCharts
          type='bar'
          height={233}
          width='100%'
          options={{
            ...options,
            colors: finalColors,
            xaxis: {
              ...options.xaxis,
              categories: item.type === 'Monthly' 
                ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                : item.type === 'Weekly' 
                  ? ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7']
                  : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            }
          }}
          series={item.series}
        />
      </TabPanel>
    )
  })
}

const DailyOutputWithTabs = () => {
  // States
  const [value, setValue] = useState('Daily')

  // Hooks
  const theme = useTheme()

  // Vars
  const disabledText = 'var(--mui-palette-text-disabled)'

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  const colors = Array(12).fill('var(--mui-palette-primary-lightOpacity)')

  const options = {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        distributed: true,
        columnWidth: '33%',
        borderRadiusApplication: 'end',
        dataLabels: { position: 'top' }
      }
    },
    legend: { show: false },
    tooltip: { enabled: true },
    dataLabels: {
      offsetY: -11,
      formatter: val => `${val}`,
      style: {
        fontWeight: 500,
        colors: ['var(--mui-palette-text-primary)'],
        fontSize: theme.typography.body1.fontSize
      }
    },
    colors,
    states: {
      hover: { filter: { type: 'none' } },
      active: { filter: { type: 'none' } }
    },
    grid: {
      show: false,
      padding: { top: -19, left: -4, right: 0, bottom: -11 }
    },
    xaxis: {
      axisTicks: { show: false },
      axisBorder: { color: 'var(--mui-palette-divider)' },
      labels: {
        style: {
          colors: disabledText,
          fontFamily: theme.typography.fontFamily,
          fontSize: theme.typography.body2.fontSize
        }
      }
    },
    yaxis: {
      labels: {
        offsetX: -18,
        formatter: val => `${val}`,
        style: {
          colors: disabledText,
          fontFamily: theme.typography.fontFamily,
          fontSize: theme.typography.body2.fontSize
        }
      }
    }
  }

  return (
    <Card h='100%'>
      <CardHeader
        title='Daily Output Summary'
        subheader='Output overview by period'
        action={<OptionMenu options={['Refresh', 'Download Report']} />}
      />
      <CardContent>
        <TabContext value={value}>
          <TabList
            variant='scrollable'
            scrollButtons='auto'
            onChange={handleChange}
            aria-label='daily output tabs'
            className='!border-0 mbe-6'
            sx={{
              '& .MuiTabs-indicator': { display: 'none !important' },
              '& .MuiTab-root': { padding: '0 !important', border: '0 !important' }
            }}
          >
            {renderTabs(value)}
          </TabList>
          {renderTabPanels(value, theme, options, colors)}
        </TabContext>
      </CardContent>
    </Card>
  )
}

export default DailyOutputWithTabs
