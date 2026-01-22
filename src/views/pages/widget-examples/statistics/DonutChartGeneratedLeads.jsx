'use client'

// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import { useTheme } from '@mui/material/styles'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))
const series = [32, 41, 41, 70]

const BarChartRevenueGrowth = props => {
  // Props
  const {
    title = 'Generated Leads',
    subtitle = 'Monthly Report',
    total = '4,350',
    series = [32, 41, 41, 70],
    labels = ['Electronic', 'Sports', 'Decor', 'Fashion'],
    customColors
  } = props

  // Hook
  const theme = useTheme()

  // Vars
  const textSecondary = 'var(--mui-palette-text-secondary)'
  const successColor = 'var(--mui-palette-success-main)'

  const options = {
    colors: customColors || [
      successColor,
      'rgba(var(--mui-palette-success-mainChannel) / 0.7)',
      'rgba(var(--mui-palette-success-mainChannel) / 0.5)',
      'var(--mui-palette-success-lightOpacity)'
    ],
    stroke: { width: 0 },
    legend: { show: false },
    tooltip: { theme: 'false' },
    dataLabels: { enabled: false },
    labels: labels,
    states: {
      hover: {
        filter: { type: 'none' }
      },
      active: {
        filter: { type: 'none' }
      }
    },
    grid: {
      padding: {
        top: 0,
        bottom: 0,
        right: 0
      }
    },
    plotOptions: {
      pie: {
        customScale: 0.9,
        expandOnClick: false,
        donut: {
          size: '73%',
          labels: {
            show: true,
            name: {
              offsetY: 25,
              color: textSecondary,
              fontFamily: theme.typography.fontFamily
            },
            value: {
              offsetY: -15,
              fontWeight: 500,
              formatter: val => `${val}`,
              color: 'var(--mui-palette-text-primary)',
              fontFamily: theme.typography.fontFamily,
              fontSize: theme.typography.h3.fontSize
            },
            total: {
              show: true,
              showAlways: true,
              label: 'Total',
              color: successColor,
              fontFamily: theme.typography.fontFamily,
              fontSize: theme.typography.body1.fontSize
            }
          }
        }
      }
    }
  }

  return (
    <Card className='overflow-visible h-full'>
      <CardContent className='flex justify-between gap-4 h-full items-center'>
        <div className='flex flex-col justify-between'>
          <div className='flex flex-col'>
            <Typography variant='h5'>{title}</Typography>
            <Typography variant='body2'>{subtitle}</Typography>
          </div>
          <div className='flex flex-col items-start mt-4'>
            <Typography variant='h4'>{total}</Typography>
          </div>
        </div>
        <AppReactApexCharts type='donut' width={120} height={120} series={series} options={options} />
      </CardContent>
    </Card>
  )
}

export default BarChartRevenueGrowth
