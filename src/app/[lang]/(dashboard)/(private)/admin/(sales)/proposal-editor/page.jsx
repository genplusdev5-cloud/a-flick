'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Box, Grid, Typography, Card, Divider, CircularProgress } from '@mui/material'

// API
import { getSalesAgreementContent } from '@/api/sales/proposal/agreement/content'
import { getProposalDetails } from '@/api/sales/proposal'

// Layout & Components
import ContentLayout from '@/components/layout/ContentLayout'
import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'
import CKEditorField from '@/components/common/CKEditorField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import { decodeId } from '@/utils/urlEncoder'

const ProposalEditorContent = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlProposalId = searchParams.get('proposal_id')

  // ✅ Persist ID even if URL gets cleared
  const [activeProposalId, setActiveProposalId] = useState(null)

  useEffect(() => {
    if (urlProposalId) {
      console.log('✅ URL HAS ID:', urlProposalId)
      const decoded = decodeId(urlProposalId) || urlProposalId
      setActiveProposalId(decoded)
    }
  }, [urlProposalId])

  const [proposalDate, setProposalDate] = useState(new Date())
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (activeProposalId) {
      console.log('🔍 FETCHING DATA FOR PROPOSAL:', activeProposalId)

      // 1. Fetch Agreement Content (Description)
      getSalesAgreementContent(activeProposalId)
        .then(res => {
          console.log('✅ AGREEMENT API RESPONSE:', res)
          // Handle { status: 'success', data: { description: '...' } }
          const apiResponse = res?.data || res
          if (apiResponse?.status === 'success' || apiResponse?.data) {
            const data = apiResponse.data || apiResponse
            if (data.description) {
              console.log('✍️ SETTING DESCRIPTION:', data.description.substring(0, 50) + '...')
              setDescription(data.description)
            }

            // Fallback for title/date if present here
            if (data.title && !title) setTitle(data.title)
            if (data.proposal_date) {
              const d = new Date(data.proposal_date)
              if (!isNaN(d.getTime())) setProposalDate(d)
            }
          }
        })
        .catch(err => console.error('❌ AGREEMENT FETCH ERROR:', err))

      // 2. Fetch Proposal Details (Title, Date, Customer etc)
      getProposalDetails(activeProposalId)
        .then(res => {
          console.log('✅ PROPOSAL DETAILS RESPONSE:', res)
          // details.js already does res.data, so res IS the data object { status: 'success', data: {...} }
          const apiResponse = res
          if (apiResponse?.status === 'success' || apiResponse?.data) {
            const data = apiResponse.data || apiResponse
            if (data.name || data.title) setTitle(data.name || data.title || '')
            if (data.proposal_date || data.start_date) {
              const d = new Date(data.proposal_date || data.start_date)
              if (!isNaN(d.getTime())) setProposalDate(d)
            }
          }
        })
        .catch(err => console.error('❌ PROPOSAL DETAILS ERROR:', err))
    }
  }, [activeProposalId]) // ✅ Depend on persistent ID

  return (
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
            <CKEditorField key={description ? 'loaded' : 'loading'} value={description} onChange={data => setDescription(data)} />
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
              console.log({ proposalDate, title, description, activeProposalId })
            }}
          >
            Save
          </GlobalButton>
        </Grid>
      </Grid>
    </Card>
  )
}

const ProposalEditorPage = () => {
  return (
    <ContentLayout
      title={<Box sx={{ m: 2 }}>Sales Proposal</Box>}
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Sales Quotation', href: '/admin/sales-quotation' },
        { label: 'Sales Proposal' }
      ]}
    >
      <Suspense
        fallback={
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        }
      >
        <ProposalEditorContent />
      </Suspense>
    </ContentLayout>
  )
}

export default ProposalEditorPage
