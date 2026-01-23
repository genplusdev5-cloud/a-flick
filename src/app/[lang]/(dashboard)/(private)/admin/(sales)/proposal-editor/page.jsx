'use client'

import { useRouter } from 'next/navigation'
import { Box, Grid, Typography, Card, Divider } from '@mui/material'
import { useState } from 'react'

// Layout & Components
import ContentLayout from '@/components/layout/ContentLayout'
import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'
import CKEditorField from '@/components/common/CKEditorField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

const ProposalEditorPage = () => {
  const router = useRouter()

  const [proposalDate, setProposalDate] = useState(new Date())
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  return (
    <ContentLayout
      title={<Box sx={{ m: 2 }}>Sales Proposal</Box>}
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Sales Quotation', href: '/admin/sales-quotation' },
        { label: 'Sales Proposal' }
      ]}
    >
      <Card sx={{ p: 5, boxShadow: 'none' }} elevation={0}>
        <Grid container spacing={6}>
          {/* Header Section */}

          {/* Proposal Date */}
          <Grid item xs={12} md={4}>
            <AppReactDatepicker
              selected={proposalDate}
              onChange={date => setProposalDate(date)}
              customInput={<GlobalTextField fullWidth label='Proposal Date' />}
            />
          </Grid>

          {/* Title */}
          <Grid item xs={12} md={8}>
            <GlobalTextField
              fullWidth
              label='Proposal Title'
              placeholder='Enter proposal title'
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </Grid>

          {/* CK Editor Section */}
          <Grid item xs={12}>
            <Typography variant='h6' sx={{ fontWeight: 600, mb: 2 }}>
              Description
            </Typography>
            <Divider sx={{ mb: 4 }} />
            <Box
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                p: 1,
                minHeight: 400,
                '& .ck-editor__editable': {
                  minHeight: 350
                }
              }}
            >
              <CKEditorField value={description} onChange={data => setDescription(data)} />
            </Box>
          </Grid>

          {/* Buttons */}
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 4, pt: 4 }}>
            <GlobalButton color='secondary' onClick={() => router.back()}>
              Close
            </GlobalButton>

            <GlobalButton
              variant='contained'
              onClick={() => {
                console.log({ proposalDate, title, description })
              }}
            >
              Save
            </GlobalButton>
          </Grid>
        </Grid>
      </Card>
    </ContentLayout>
  )
}

export default ProposalEditorPage
