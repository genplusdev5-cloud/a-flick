'use client'

import React, { useEffect, useState } from 'react'
import {
  Box,
  Card,
  CardHeader,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Typography,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControl,
  FormControlLabel,
  Divider
} from '@mui/material'

import { getTodayServiceRequests, getTodayFollowups, getDashboardRenewal, getKviFinder } from '@/api/dashboard'

/* ---------------- STATUS CHIP ---------------- */
const StatusChip = ({ status }) => {
  let color = 'default'
  const normalized = status?.toLowerCase()

  if (['completed', 'closed'].includes(normalized)) color = 'success'
  else if (['in progress', 'open'].includes(normalized)) color = 'primary'
  else if (['pending'].includes(normalized)) color = 'warning'

  return <Chip label={status} color={color} size='small' variant='tonal' sx={{ fontWeight: 500 }} />
}

/* ---------------- DASHBOARD LIST ---------------- */
export default function DashboardList() {
  const [serviceRequests, setServiceRequests] = useState([])
  const [followups, setFollowups] = useState([])
  const [loading, setLoading] = useState(false)
  const [svcFilter, setSvcFilter] = useState('Pending')

  const [renewals, setRenewals] = useState([])
  const [kivList, setKivList] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const [serviceRes, followupRes, renewalRes, kivRes] = await Promise.all([
        getTodayServiceRequests(),
        getTodayFollowups(),
        getDashboardRenewal(),
        getKviFinder()
      ])

      setServiceRequests(serviceRes?.data || [])
      setFollowups(followupRes?.data || [])
      setRenewals(renewalRes?.data || [])
      setKivList(kivRes?.data || [])
    } catch (error) {
      console.error('Dashboard API Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredServiceRequests = React.useMemo(() => {
    if (!svcFilter) return serviceRequests
    return serviceRequests.filter(req => req.ticket_status?.toLowerCase() === svcFilter.toLowerCase())
  }, [serviceRequests, svcFilter])

  return (
    <Box sx={{ mt: 2 }}>
      {loading && (
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <CircularProgress size={28} />
        </Box>
      )}

      <Grid container spacing={3}>
        {/* ================= CARD 1 : TODAY SERVICE REQUESTS ================= */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardHeader
              title='Today Service Requests'
              action={
                <FormControl component='fieldset'>
                  <RadioGroup
                    row
                    name='status-filter'
                    value={svcFilter}
                    onChange={e => setSvcFilter(e.target.value)}
                    sx={{ gap: 0 }}
                  >
                    {['Pending', 'Open', 'Hold', 'Partial', 'Complete'].map(status => (
                      <FormControlLabel
                        key={status}
                        value={status}
                        control={<Radio size='small' />}
                        label={<Typography variant='body2'>{status}</Typography>}
                        sx={{ margin: 0, '& .MuiFormControlLabel-label': { ml: -0.5, mr: 1 } }}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              }
            />
            <Divider />
            <TableContainer sx={{ maxHeight: 420 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>S.No</TableCell>
                    <TableCell>SVC Request No</TableCell>
                    <TableCell>Technician Name</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredServiceRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align='center'>
                        No {svcFilter.toLowerCase()} service requests today
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredServiceRequests.map((row, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{row.ticket_no}</TableCell>
                        <TableCell>{row.technician_name}</TableCell>
                        <TableCell>
                          <StatusChip status={row.ticket_status} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* ================= CARD 2 : TODAY FOLLOWUPS ================= */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title='Today Followups' />
            <TableContainer sx={{ maxHeight: 420 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>S.No</TableCell>
                    <TableCell>Customer Name</TableCell>
                    <TableCell>Created Date</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {followups.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align='center'>
                        No followups today
                      </TableCell>
                    </TableRow>
                  ) : (
                    followups.map((row, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{row.customer_name}</TableCell>
                        <TableCell>{row.created_date}</TableCell>
                        <TableCell>
                          <StatusChip status={row.ticket_status} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* ================= CARD 3 : RENEWAL PENDING ================= */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title='Renewal Pending' />
            <TableContainer sx={{ maxHeight: 420 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>S.No</TableCell>
                    <TableCell>Contract No</TableCell>
                    <TableCell>Customer Name</TableCell>
                    <TableCell>End Date</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {renewals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align='center'>
                        No renewal pending
                      </TableCell>
                    </TableRow>
                  ) : (
                    renewals.map((row, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{row.contract_no}</TableCell>
                        <TableCell>{row.customer_name}</TableCell>
                        <TableCell>{row.end_date}</TableCell>
                        <TableCell>
                          <StatusChip status={row.status} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* ================= CARD 4 : KIV ================= */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title='KIV' />
            <TableContainer sx={{ maxHeight: 420 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>S.No</TableCell>
                    <TableCell>Ticket No</TableCell>
                    <TableCell>Ticket Date</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {kivList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align='center'>
                        No KIV records
                      </TableCell>
                    </TableRow>
                  ) : (
                    kivList.map((row, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{row.ticket_no}</TableCell>
                        <TableCell>{row.ticket_date}</TableCell>
                        <TableCell>
                          <StatusChip status={row.status} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
