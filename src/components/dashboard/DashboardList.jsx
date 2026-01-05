'use client'

import React from 'react'
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
  Typography
} from '@mui/material'

// Dummy Data for Today Service Requests
const serviceRequestsData = [
  { id: 1, requestNo: 'REQ-001', technician: 'John Doe', status: 'Pending' },
  { id: 2, requestNo: 'REQ-002', technician: 'Jane Smith', status: 'In Progress' },
  { id: 3, requestNo: 'REQ-003', technician: 'Mike Ross', status: 'Completed' },
  { id: 4, requestNo: 'REQ-004', technician: 'Rachel Zane', status: 'Pending' },
  { id: 5, requestNo: 'REQ-005', technician: 'Harvey Specter', status: 'In Progress' }
]

// Dummy Data for Today Followups
const followupsData = [
  { id: 1, customer: 'Acme Corp', createdDate: '2024-01-05', status: 'Open', svcRequestNo: 'REQ-001' },
  { id: 2, customer: 'Wayne Ent', createdDate: '2024-01-05', status: 'Closed', svcRequestNo: 'REQ-002' },
  { id: 3, customer: 'Stark Ind', createdDate: '2024-01-04', status: 'Pending', svcRequestNo: 'REQ-003' },
  { id: 4, customer: 'Cyberdyne', createdDate: '2024-01-03', status: 'Open', svcRequestNo: 'REQ-004' },
  { id: 5, customer: 'Globex', createdDate: '2024-01-02', status: 'Closed', svcRequestNo: 'REQ-005' }
]

const StatusChip = ({ status }) => {
  let color = 'default'
  const normalized = status.toLowerCase()

  if (['completed', 'closed'].includes(normalized)) color = 'success'
  else if (['in progress', 'open'].includes(normalized)) color = 'primary'
  else if (['pending'].includes(normalized)) color = 'warning'

  return <Chip label={status} color={color} size='small' variant='tonal' sx={{ fontWeight: 500 }} />
}

export default function DashboardList() {
  return (
    <Box sx={{ mt: 2 }}>
      <Grid container spacing={3}>
        {/* LEFT BLOCK: Today Service Requests */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title={
                <Typography variant='h6' sx={{ fontWeight: 600 }}>
                  Today Service Requests
                </Typography>
              }
            />
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>SVC Request.No</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Technician Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {serviceRequestsData.map(row => (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.requestNo}</TableCell>
                      <TableCell>{row.technician}</TableCell>
                      <TableCell>
                        <StatusChip status={row.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* RIGHT BLOCK: Today Followups */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title={
                <Typography variant='h6' sx={{ fontWeight: 600 }}>
                  Today Followups
                </Typography>
              }
            />
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                     <TableCell sx={{ fontWeight: 600 }}>SVC Request.No</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Created Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {followupsData.map(row => (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.svcRequestNo}</TableCell>
                      <TableCell>{row.customer}</TableCell>
                      <TableCell>{row.createdDate}</TableCell>
                      <TableCell>
                        <StatusChip status={row.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
