'use client'

import { useEffect, useState } from 'react'
import { Box, Card, Grid, Divider, Typography } from '@mui/material'
import { useRouter, useParams } from 'next/navigation'

import ContentLayout from '@/components/layout/ContentLayout'
import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import CKEditorField from '@/components/common/CKEditorField'
import { showToast } from '@/components/common/Toasts'
import { decodeId } from '@/utils/urlEncoder'

// API
import { getPestList, getProposalItemDetails, updateProposalItem } from '@/api/sales/proposal_item'

const EditProposalItemPage = () => {
  const router = useRouter()
  const params = useParams()

  // 🔐 Decode base64 ID (URL-safe)
  const [decodedId, setDecodedId] = useState(null)

  useEffect(() => {
    if (params?.id) {
      const id = decodeId(params.id)
      if (id) {
        setDecodedId(id)
      } else {
        console.error('❌ Invalid or corrupted ID in URL')
        // showToast('error', 'Invalid ID') // Optional: might be annoying on initial load
      }
    }
  }, [params?.id])

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [pestOptions, setPestOptions] = useState([])

  const [form, setForm] = useState({
    type: 'MASTER',
    pestId: '',
    position: 'After',
    sort_order: '0',
    is_default: 'No',
    title: '',
    description: ''
  })

  // ───────────────────────────────────────
  // LOAD INITIAL DATA
  // ───────────────────────────────────────
  useEffect(() => {
    if (!decodedId) return
    loadPests()
    loadDetails()
  }, [decodedId])

  const loadPests = async () => {
    try {
      const res = await getPestList()
      const list = res?.data?.data?.pest?.name || res?.data?.pest?.name || []
      const mapped = list.map(p => ({
        label: p.name,
        value: p.id
      }))
      setPestOptions(mapped)
    } catch (e) {
      console.error('❌ Failed to load pest list:', e)
      showToast('error', 'Failed to load pest list')
    }
  }

  const loadDetails = async () => {
    try {
      setFetching(true)
      const res = await getProposalItemDetails(decodedId)
      const data = res?.data || res

      setForm({
        type: data?.pest_id ? 'PEST' : 'MASTER',
        pestId: data?.pest_id || '',
        position: data?.content_position || 'After',
        sort_order: String(data?.sort_order || '0'),
        is_default: data?.is_default ? 'Yes' : 'No',
        title: data?.name || '',
        description: data?.description || ''
      })
    } catch (err) {
      console.error('❌ Failed to load details:', err)
      showToast('error', 'Failed to load proposal item details')
    } finally {
      setFetching(false)
    }
  }

  // ───────────────────────────────────────
  // SAVE (UPDATE)
  // ───────────────────────────────────────
  const handleUpdate = async () => {
    if (!form.title || !form.description) {
      showToast('error', 'Title and Description are required')
      return
    }

    try {
      setLoading(true)

      const payload = {
        pest_id: form.type === 'PEST' ? Number(form.pestId) : null,
        content_position: form.position || null,
        sort_order: form.sort_order ? Number(form.sort_order) : null,
        is_default: form.is_default === 'Yes' ? 1 : 0,
        name: form.title,
        description: form.description
      }

      console.log('📦 UPDATE PROPOSAL ITEM PAYLOAD:', payload)

      const res = await updateProposalItem(decodedId, payload)

      if (res?.status === 'success' || res?.status === 200 || res?.status === 201) {
        showToast('success', 'Proposal item updated successfully')
        router.push('/admin/proposal-item')
        return
      }

      showToast('error', res?.message || 'Failed to update proposal item')
    } catch (err) {
      console.error('❌ Update Error:', err?.response?.data || err)
      const errorMsg =
        err?.response?.data?.message || err?.response?.data?.detail || 'Something went wrong while updating'
      showToast('error', errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // ───────────────────────────────────────
  // UI
  // ───────────────────────────────────────
  return (
    <ContentLayout
      title={<Box sx={{ m: 2 }}>Edit Proposal Content</Box>}
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Proposal Item', href: '/admin/proposal-item' },
        { label: 'Edit Proposal Content' }
      ]}
    >
      <Card sx={{ p: 5, boxShadow: 'none' }} elevation={0}>
        <Grid container spacing={6}>
          {/* ───────── BASIC DETAILS ───────── */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant='h6' sx={{ fontWeight: 600 }}>
                Basic Details
              </Typography>
              {fetching && <Typography variant='body2' color='primary'>Loading details...</Typography>}
            </Box>
            <Divider sx={{ mt: 2 }} />
          </Grid>

          {/* Type */}
          <Grid item xs={12} md={3}>
            <GlobalAutocomplete
              label='Type'
              options={['MASTER', 'PEST']}
              value={form.type}
              onChange={val =>
                setForm(prev => ({
                  ...prev,
                  type: val?.value || '',
                  pestId: ''
                }))
              }
              disabled={fetching}
            />
          </Grid>

          {/* Pest (Conditional) */}
          {form.type === 'PEST' && (
            <Grid item xs={12} md={3}>
              <GlobalAutocomplete
                label='Pest'
                options={pestOptions}
                value={form.pestId}
                onChange={val =>
                  setForm(prev => ({
                    ...prev,
                    pestId: val?.value || ''
                  }))
                }
                disabled={fetching}
              />
            </Grid>
          )}

          {/* Position */}
          <Grid item xs={12} md={3}>
            <GlobalAutocomplete
              label='Before / After Pest Details'
              options={['Before', 'After']}
              value={form.position}
              onChange={val =>
                setForm(prev => ({
                  ...prev,
                  position: val?.value || ''
                }))
              }
              disabled={fetching}
            />
          </Grid>

          {/* Sort Order */}
          <Grid item xs={12} md={3}>
            <GlobalTextField
              type='number'
              label='Sort Order'
              value={form.sort_order}
              onChange={e => setForm(prev => ({ ...prev, sort_order: e.target.value }))}
              disabled={fetching}
            />
          </Grid>

          {/* Is Default */}
          <Grid item xs={12} md={3}>
            <GlobalAutocomplete
              label='Is Default?'
              options={['Yes', 'No']}
              value={form.is_default}
              onChange={val =>
                setForm(prev => ({
                  ...prev,
                  is_default: val?.value || 'No'
                }))
              }
              disabled={fetching}
            />
          </Grid>

          {/* Title */}
          <Grid item xs={12} md={9}>
            <GlobalTextField
              label='Title'
              placeholder='Enter proposal item title'
              value={form.title}
              onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
              disabled={fetching}
            />
          </Grid>

          {/* ───────── DESCRIPTION ───────── */}
          <Grid item xs={12}>
            <Typography variant='h6' sx={{ fontWeight: 600 }}>
              Description
            </Typography>
            <Divider sx={{ mt: 2 }} />
          </Grid>

          <Grid item xs={12}>
            <Box
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                p: 1,
                minHeight: 300,
                backgroundColor: fetching ? '#f9f9f9' : 'transparent',
                '& .ck-editor__editable': {
                  minHeight: 250
                }
              }}
            >
              <CKEditorField
                value={form.description}
                onChange={val => setForm(prev => ({ ...prev, description: val }))}
              />
            </Box>
          </Grid>

          {/* ───────── ACTIONS ───────── */}
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 4, pt: 4 }}>
            <GlobalButton color='secondary' onClick={() => router.back()} disabled={loading || fetching}>
              Close
            </GlobalButton>

            <GlobalButton variant='contained' onClick={handleUpdate} loading={loading} disabled={fetching}>
              Save Changes
            </GlobalButton>
          </Grid>
        </Grid>
      </Card>
    </ContentLayout>
  )
}

export default EditProposalItemPage
