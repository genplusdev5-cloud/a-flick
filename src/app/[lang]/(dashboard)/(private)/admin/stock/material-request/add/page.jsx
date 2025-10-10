'use client'

import { useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Typography
} from '@mui/material'

// Custom Components
import ContentLayout from '@/components/layout/ContentLayout'
import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

export default function AddMaterialRequestPage() {
  const [date, setDate] = useState(new Date())
  const [formData, setFormData] = useState({
    requestType: '',
    requestedBy: '',
    fromLocation: '',
    toLocation: '',
    remarks: '',
    chemical: '',
    unit: '',
    quantity: ''
  })

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSave = () => {
    console.log('Form Data:', formData)
    alert('Material Request Saved!')
  }

  return (
    <ContentLayout
      title="Add Material Request"
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Material Request', href: '/admin/stock/material-request' },
        { label: 'Add Request' }
      ]}
    >
      <Card>
        <Typography variant="h6" align="center" sx={{ py: 3 }}>
          Add Material Request
        </Typography>
        <CardContent>
          {/* Row 1 */}
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} md={4}>
              <AppReactDatepicker
                selected={date}
                id="request-date"
                onChange={d => setDate(d)}
                placeholderText="Select Date"
                customInput={<CustomTextField fullWidth label="Request Date" />}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <CustomTextField
                select
                fullWidth
                label="Request Type"
                name="requestType"
                value={formData.requestType}
                onChange={handleChange}
              >
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="Material Request">Material Request</MenuItem>
                <MenuItem value="Material Return">Material Return</MenuItem>
                <MenuItem value="Opening Stock">Opening Stock</MenuItem>
              </CustomTextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <CustomTextField
                select
                fullWidth
                label="Requested By"
                name="requestedBy"
                value={formData.requestedBy}
                onChange={handleChange}
              >
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
                <MenuItem value="Tech">Tech</MenuItem>
              </CustomTextField>
            </Grid>
          </Grid>

          {/* Row 2 */}
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} md={4}>
              <CustomTextField
                select
                fullWidth
                label="From Location/Supplier"
                name="fromLocation"
                value={formData.fromLocation}
                onChange={handleChange}
              >
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="Stock-TECH STOCK 1">Stock-TECH STOCK 1</MenuItem>
              </CustomTextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <CustomTextField
                select
                fullWidth
                label="To Location/Supplier"
                name="toLocation"
                value={formData.toLocation}
                onChange={handleChange}
              >
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="Stock-TECH STOCK 2">Stock-TECH STOCK 2</MenuItem>
              </CustomTextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <CustomTextField
                fullWidth
                multiline
                rows={2}
                label="Remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
              />
            </Grid>
          </Grid>

          <Box my={3}>
            <hr />
          </Box>

          {/* Row 3 - Chemicals */}
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} md={3}>
              <CustomTextField
                select
                fullWidth
                label="Chemicals"
                name="chemical"
                value={formData.chemical}
                onChange={handleChange}
              >
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="Abate">Abate</MenuItem>
                <MenuItem value="Able Max">Able Max</MenuItem>
                <MenuItem value="Advion Ant Gel">Advion Ant Gel</MenuItem>
                <MenuItem value="Aquabac">Aquabac</MenuItem>
                <MenuItem value="Arilon Insecticide">Arilon Insecticide</MenuItem>
              </CustomTextField>
            </Grid>

            <Grid item xs={12} md={3}>
              <CustomTextField
                select
                fullWidth
                label="Unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
              >
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="Bottle">Bottle</MenuItem>
                <MenuItem value="Box">Box</MenuItem>
                <MenuItem value="Kg">Kg</MenuItem>
                <MenuItem value="Litre">Litre</MenuItem>
                <MenuItem value="Pkt">Pkt</MenuItem>
              </CustomTextField>
            </Grid>

            <Grid item xs={12} md={3}>
              <CustomTextField
                type="number"
                fullWidth
                label="Quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={1} display="flex" alignItems="flex-end">
              <Button variant="contained" fullWidth>
                + Add Item
              </Button>
            </Grid>
          </Grid>

          {/* Action Buttons */}
          <Box mt={4} display="flex" justifyContent="flex-end" gap={2}>
            <Button variant="outlined">Close</Button>
            <Button variant="contained" onClick={handleSave}>
              Save
            </Button>
          </Box>
        </CardContent>
      </Card>
    </ContentLayout>
  )
}
