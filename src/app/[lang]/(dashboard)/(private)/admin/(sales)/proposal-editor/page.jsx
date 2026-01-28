'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import { Box, Grid, Typography, Card, Divider, CircularProgress } from '@mui/material'

// API
import {
  getSalesAgreementContent,
  updateSalesAgreement,
  addSalesAgreement,
  salesAgreementDetails
} from '@/api/sales/proposal/agreement'
import { getProposalDetails } from '@/api/sales/proposal'

// Layout & Components
import ContentLayout from '@/components/layout/ContentLayout'
import GlobalButton from '@/components/common/GlobalButton'
import { showToast } from '@/components/common/Toasts'
import GlobalTextField from '@/components/common/GlobalTextField'
import CKEditorField from '@/components/common/CKEditorField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import { decodeId } from '@/utils/urlEncoder'

const ProposalEditorContent = () => {
  const router = useRouter()
  const { lang } = useParams()
  const searchParams = useSearchParams()
  const urlAgreementId = searchParams.get('id')
  const urlProposalId = searchParams.get('proposal_id')

  // ✅ Persist IDs even if URL gets cleared
  const [activeAgreementId, setActiveAgreementId] = useState(null)
  const [activeProposalId, setActiveProposalId] = useState(null)
  const [agreementId, setAgreementId] = useState(null)

  useEffect(() => {
    if (urlAgreementId) {
      const decoded = decodeId(urlAgreementId) || urlAgreementId
      setActiveAgreementId(decoded)
    }
    if (urlProposalId) {
      const decoded = decodeId(urlProposalId) || urlProposalId
      setActiveProposalId(decoded)
    }
  }, [urlAgreementId, urlProposalId])

  const [proposalDate, setProposalDate] = useState(new Date())
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

    const replacePlaceholders = (text, data) => {
      if (!text || !data) return text
      let newText = text

      // Helper for formatting date DD/MM/YYYY
      const formatDate = dateStr => {
        if (!dateStr) return ''
        const d = new Date(dateStr)
        if (isNaN(d.getTime())) return ''
        const day = String(d.getDate()).padStart(2, '0')
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const year = d.getFullYear()
        return `${day}/${month}/${year}`
      }

      // 1. Proposal Date
      // User requested: "add pandra date ...today date ok" -> using today's date if not present, or proposal date?
      // "{$proposal_date} = add pandra date ...today date ok" - implying current/proposal date.
      // We'll use the proposal_date from data, or fallback to Today.
      const dateVal = data.proposal_date || data.start_date || new Date()
      newText = newText.replace(/\{\$proposal_date\}/g, formatDate(dateVal))

      // 2. Billing Address
      const addr = data.billing_address || ''
      newText = newText.replace(/\{\$billing_address\}/g, addr)

      // 3. Contact Person Name
      const contact = data.contact_person_name || data.contact_person || ''
      newText = newText.replace(/\{\$contact_person_name\}/g, contact)

      // 4. Invoice Remarks
      const remarks = data.invoice_remarks || ''
      newText = newText.replace(/\{\$invoice_remarks\}/g, remarks)

      return newText
    }

    const fetchProposalDetails = async propId => {
      console.log('🔍 FETCHING PROPOSAL DETAILS:', propId)
      try {
        const res = await getProposalDetails(String(propId))
        const apiResponse = res?.data || res
        if (apiResponse?.status === 'success' || apiResponse?.id || apiResponse?.data) {
          const data = apiResponse.data || apiResponse

          // ❌ Removed auto-title setting for new proposals as per user request
          // if (!title && (data.name || data.title)) setTitle(data.name || data.title || '')

          if (data.proposal_date || data.start_date) {
            const d = new Date(data.proposal_date || data.start_date)
            if (!isNaN(d.getTime())) setProposalDate(d)
          }
          return data
        }
      } catch (err) {
        console.error('❌ PROPOSAL DETAILS ERROR:', err)
      }
      return null
    }

    useEffect(() => {
  const fetchData = async () => {
    let currentDesc = description
    let pData = null

    // 1. Fetch Agreement Content
    if (activeAgreementId) {
      console.log('🔍 FETCHING AGREEMENT BY ID:', activeAgreementId)

      try {
        const res = await salesAgreementDetails(activeAgreementId)
        const apiResponse = res?.data || res

        if (apiResponse?.status === 'success' || apiResponse?.id || apiResponse?.data) {
          const data = apiResponse.data || apiResponse

          setAgreementId(data.id)

          if (data.description) {
            setDescription(data.description)
            currentDesc = data.description
          }

          if (data.name || data.title) setTitle(data.name || data.title)

          if (data.proposal_date) {
            const d = new Date(data.proposal_date)
            if (!isNaN(d.getTime())) setProposalDate(d)
          }

          if (!activeProposalId && data.proposal_id) {
            pData = await fetchProposalDetails(data.proposal_id)
          }
        }
      } catch (err) {
        console.error('❌ AGREEMENT FETCH ERROR:', err)
      }
    } else if (activeProposalId) {
      console.log('🔍 FETCHING AGREEMENT BY PROPOSAL ID:', activeProposalId)

      try {
        const res = await getSalesAgreementContent(activeProposalId)
        const apiResponse = res?.data || res

        let data = apiResponse?.data || apiResponse

        if (data?.results && Array.isArray(data.results)) {
          data = data.results[0]
        } else if (Array.isArray(data)) {
          data = data[0]
        }

        if (data && (data.id || data.description)) {
          setAgreementId(data.id)

          if (data.description) {
            setDescription(data.description)
            currentDesc = data.description
          }

          if (data.name || data.title) setTitle(data.name || data.title)
        }
      } catch (err) {
        console.warn('⚠️ No existing agreement for this proposal yet.')
      }
    }

    // 2. Fetch Proposal Details
    if (activeProposalId && !pData) {
      pData = await fetchProposalDetails(activeProposalId)
    }

    // 3. Apply Placeholders
    if (currentDesc && pData) {
      const replaced = replacePlaceholders(currentDesc, pData)

      if (replaced !== currentDesc) {
        console.log('✨ Placeholders Replaced')
        setDescription(replaced)
      }
    }
  }

  if (activeAgreementId || activeProposalId) {
    fetchData()
  }
}, [activeAgreementId, activeProposalId])


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
            <CKEditorField
              key={description ? 'loaded' : 'loading'}
              value={description}
              onChange={data => setDescription(data)}
            />
          </Box>
        </Grid>

        {/* Buttons */}
        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 4, pt: 4 }}>
          <GlobalButton color='secondary' onClick={() => router.back()}>
            Close
          </GlobalButton>

          <GlobalButton
            variant='contained'
            onClick={async () => {
              if (!activeProposalId) {
                showToast('error', 'No proposal selected!')
                return
              }

              try {
                const payload = {
                  description: description,
                  name: title,
                  proposal_date: proposalDate ? proposalDate.toISOString().split('T')[0] : null,
                  proposal_id: Number(activeProposalId)
                }

                let res
                if (agreementId) {
                  // Update existing
                  res = await updateSalesAgreement(agreementId, payload)
                } else {
                  // Add new
                  res = await addSalesAgreement(payload)
                }

                if (res?.status === 'success' || res) {
                  showToast('success', 'Sales proposal saved successfully!')

                  // ✅ Redirect back to Update Proposal page
                  setTimeout(() => {
                    router.push(`/${lang}/admin/sales-quotation/update/${urlProposalId}`)
                  }, 1500)
                } else {
                  showToast('error', 'Failed to save proposal.')
                }
              } catch (error) {
                console.error('❌ SAVE ERROR:', error)
                showToast('error', 'Error saving proposal.')
              }
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
