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
  CircularProgress
} from '@mui/material'

import {
  getTodayServiceRequests,
  getTodayFollowups
} from '@/api/dashboard'

/* ---------------- STATUS CHIP ---------------- */
const StatusChip = ({ status }) => {
  let color = 'default'
  const normalized = status?.toLowerCase()

  if (['completed', 'closed'].includes(normalized)) color = 'success'
  else if (['in progress', 'open'].includes(normalized)) color = 'primary'
  else if (['pending'].includes(normalized)) color = 'warning'

  return (
    <Chip
      label={status}
      color={color}
      size='small'
      variant='tonal'
      sx={{ fontWeight: 500 }}
    />
  )
}

/* ---------------- DASHBOARD LIST ---------------- */
export default function DashboardList() {
  const [serviceRequests, setServiceRequests] = useState([])
  const [followups, setFollowups] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const [serviceRes, followupRes] = await Promise.all([
        getTodayServiceRequests(),
        getTodayFollowups()
      ])

      setServiceRequests(serviceRes?.data || [])
      setFollowups(followupRes?.data || [])
    } catch (error) {
      console.error('Dashboard API Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ mt: 2 }}>
      {loading && (
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <CircularProgress size={28} />
        </Box>
      )}

      <Grid container spacing={3}>
        {/* ================= LEFT : TODAY SERVICE REQUESTS ================= */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title={<Typography variant='h6' fontWeight={600}>Today Service Requests</Typography>}
            />

            <TableContainer sx={{ maxHeight: 420 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>S.No</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>SVC Request.No</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Technician Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {serviceRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align='center'>
                        No service requests today
                      </TableCell>
                    </TableRow>
                  ) : (
                    serviceRequests.map((row, index) => (
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

        {/* ================= RIGHT : TODAY FOLLOWUPS ================= */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title={<Typography variant='h6' fontWeight={600}>Today Followups</Typography>}
            />

            <TableContainer sx={{ maxHeight: 420 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>S.No</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Customer Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Created Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
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
      </Grid>
    </Box>
  )
}
