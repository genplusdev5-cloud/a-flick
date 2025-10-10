'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Typography
} from '@mui/material'

// Components
import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

export default function UpdateMaterialStatusPage() {
  const { id } = useParams() // Get the request ID from URL
  const router = useRouter()

  // Form state
  const [requestDate, setRequestDate] = useState(new Date())
  const [requestType, setRequestType] = useState('')
  const [requestedBy, setRequestedBy] = useState('')
  const [fromLocation, setFromLocation] = useState('')
  const [toLocation, setToLocation] = useState('')
  const [status, setStatus] = useState('Pending')
  const [remarks, setRemarks] = useState('')

  const handleSave = () => {
    alert(
      `Request #${id} updated\nDate: ${requestDate}\nType: ${requestType}\nFrom: ${fromLocation}\nTo: ${toLocation}\nRequested By: ${requestedBy}\nStatus: ${status}\nRemarks: ${remarks}`
    )
    // TODO: Call API to update request
    router.push('/admin/stock/material-request')
  }

  return (
    <ContentLayout
      title="Update Material Request"
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Material Request', href: '/admin/stock/material-request' },
        { label: `Update #${id}` }
      ]}
    >
      <Card>
        <CardContent>
          <Typography variant="h6" mb={3}>
            Update Request (ID: {id})
          </Typography>

          <Grid container spacing={3}>
            {/* Request Date */}
            <Grid item xs={12} md={4}>
              <AppReactDatepicker
                selected={requestDate}
                id="request-date"
                onChange={d => setRequestDate(d)}
                placeholderText="Select Date"
                customInput={<CustomTextField fullWidth label="Request Date" />}
              />
            </Grid>

            {/* Request Type */}
            <Grid item xs={12} md={4}>
              <CustomTextField
                select
                fullWidth
                label="Request Type"
                value={requestType}
                onChange={e => setRequestType(e.target.value)}
              >
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="Material Request">Material Request</MenuItem>
                <MenuItem value="Material Return">Material Return</MenuItem>
                <MenuItem value="Opening Stock">Opening Stock</MenuItem>
              </CustomTextField>
            </Grid>

            {/* Requested By */}
            <Grid item xs={12} md={4}>
              <CustomTextField
                select
                fullWidth
                label="Requested By"
                value={requestedBy}
                onChange={e => setRequestedBy(e.target.value)}
              >
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
                <MenuItem value="Tech">Tech</MenuItem>
              </CustomTextField>
            </Grid>

            {/* From Location */}
            <Grid item xs={12} md={6}>
              <CustomTextField
                select
                fullWidth
                label="From Location / Supplier"
                value={fromLocation}
                onChange={e => setFromLocation(e.target.value)}
              >
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="Stock-TECH STOCK 1">Stock-TECH STOCK 1</MenuItem>
                <MenuItem value="Supplier-ABC">Supplier-ABC</MenuItem>
              </CustomTextField>
            </Grid>

            {/* To Location */}
            <Grid item xs={12} md={6}>
              <CustomTextField
                select
                fullWidth
                label="To Location / Supplier"
                value={toLocation}
                onChange={e => setToLocation(e.target.value)}
              >
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="Stock-TECH STOCK 1">Stock-TECH STOCK 1</MenuItem>
                <MenuItem value="Stock-TECH STOCK 2">Stock-TECH STOCK 2</MenuItem>
              </CustomTextField>
            </Grid>

            {/* Status */}
            <Grid item xs={12} md={6}>
              <CustomTextField
                select
                fullWidth
                label="Request Status"
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Declined">Declined</MenuItem>
                <MenuItem value="Approved">Approved</MenuItem>
                <MenuItem value="Issued">Issued</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
              </CustomTextField>
            </Grid>

            {/* Remarks */}
            <Grid item xs={12} md={6}>
              <CustomTextField
                fullWidth
                multiline
                rows={3}
                label="Remarks"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
              />
            </Grid>

            {/* Actions */}
            <Grid item xs={12} display="flex" justifyContent="flex-end" gap={2}>
              <Button variant="outlined" onClick={() => router.push('/admin/stock/material-request')}>
                Cancel
              </Button>
              <Button variant="contained" onClick={handleSave}>
                Update
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </ContentLayout>
  )
}
