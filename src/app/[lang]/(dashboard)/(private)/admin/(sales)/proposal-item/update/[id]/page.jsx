'use client'

import { useEffect, useState } from 'react'
import { Box, Card, Grid, Divider, Typography, Breadcrumbs } from '@mui/material'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

import StickyListLayout from '@/components/common/StickyListLayout'
import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import CKEditorField from '@/components/common/CKEditorField'
import { showToast } from '@/components/common/Toasts'
import { decodeId } from '@/utils/urlEncoder'

// API
import { getPestList, getProposalItemDetails, updateProposalItem } from '@/api/sales/proposal_item'

const UpdateProposalItemPage = () => {
  const router = useRouter()
  const { lang = 'en', id: encodedId } = useParams()

  const [id, setId] = useState(null)

  useEffect(() => {
    if (encodedId) {
      const decoded = decodeId(encodedId) || encodedId
      setId(decoded)
    }
  }, [encodedId])

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [pestOptions, setPestOptions] = useState([])

  const [form, setForm] = useState({
    pestId: '',
    position: 'After',
    sort_order: '0',
    is_default: 'No',
    title: '',
    description: ''
  })

  useEffect(() => {
    if (!id) return
    loadPests()
    loadDetails()
  }, [id])

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
      const res = await getProposalItemDetails(id)
      const data = res?.data || res

      setForm({
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

  const handleUpdate = async () => {
    if (!form.pestId || !form.title || !form.description) {
      showToast('error', 'Pest, Title, and Description are required')
      return
    }

    try {
      setLoading(true)

      const payload = {
        pest_id: Number(form.pestId),
        content_position: form.position || null,
        sort_order: form.sort_order ? Number(form.sort_order) : null,
        is_default: form.is_default === 'Yes' ? 1 : 0,
        name: form.title,
        description: form.description
      }

      const res = await updateProposalItem(id, payload)

      if (res?.status === 'success' || res?.status === 200 || res?.status === 201) {
        showToast('success', 'Proposal item updated successfully')
        router.push(`/${lang}/admin/proposal-item`)
        return
      }

      showToast('error', res?.message || 'Failed to update proposal item')
    } catch (err) {
      console.error('❌ Update Error:', err?.response?.data || err)
      showToast('error', 'Something went wrong while updating')
    } finally {
      setLoading(false)
    }
  }

  return (
    <StickyListLayout
      header={
        <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 2 }}>
          <Link underline='hover' color='inherit' href={`/${lang}`}>
            Home
          </Link>
          <Typography color='text.secondary'>Sales</Typography>
          <Link underline='hover' color='inherit' href={`/${lang}/admin/proposal-item`}>
            Proposal Item
          </Link>
          <Typography color='text.primary'>Update Proposal Item</Typography>
        </Breadcrumbs>
      }
    >
      <Card sx={{ p: 5, boxShadow: 'none' }} elevation={0}>
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant='h6' sx={{ fontWeight: 600 }}>
                Basic Details
              </Typography>
              {fetching && (
                <Typography variant='body2' color='primary'>
                  Loading details...
                </Typography>
              )}
            </Box>
            <Divider sx={{ mt: 2 }} />
          </Grid>

          <Grid item xs={12} md={3}>
            <GlobalAutocomplete
              label='Pest *'
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

          <Grid item xs={12} md={3}>
            <GlobalTextField
              type='number'
              label='Sort Order'
              value={form.sort_order}
              onChange={e => setForm(prev => ({ ...prev, sort_order: e.target.value }))}
              disabled={fetching}
            />
          </Grid>

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

          <Grid item xs={12}>
            <GlobalTextField
              fullWidth
              label='Title *'
              placeholder='Enter proposal item title'
              value={form.title}
              onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
              disabled={fetching}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant='h6' sx={{ fontWeight: 600 }}>
              Description *
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
    </StickyListLayout>
  )
}

export default UpdateProposalItemPage
