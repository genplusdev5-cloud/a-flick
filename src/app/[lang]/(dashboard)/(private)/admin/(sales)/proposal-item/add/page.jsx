'use client'

import { useEffect, useState } from 'react'
import { Box, Grid, Card, Divider, Typography, Breadcrumbs } from '@mui/material'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

import ContentLayout from '@/components/layout/ContentLayout'
import StickyListLayout from '@/components/common/StickyListLayout'
import GlobalButton from '@/components/common/GlobalButton'
import GlobalTextField from '@/components/common/GlobalTextField'
import GlobalAutocomplete from '@/components/common/GlobalAutocomplete'
import CKEditorField from '@/components/common/CKEditorField'
import { showToast } from '@/components/common/Toasts'

// API
import { getPestList, addProposalItem } from '@/api/sales/proposal_item'

const AddProposalItemPage = () => {
  const router = useRouter()
  const { lang = 'en' } = useParams()

  const [loading, setLoading] = useState(false)
  const [pestOptions, setPestOptions] = useState([])

  const [form, setForm] = useState({
    pestId: '',
    position: 'After',
    sort_order: '0',
    is_default: 'No',
    title: '',
    description: ''
  })

  // ───────────────────────────────────────
  // LOAD PEST DROPDOWN
  // ───────────────────────────────────────
  useEffect(() => {
    loadPests()
  }, [])

  const loadPests = async () => {
    try {
      const res = await getPestList()

      // Exact path from search results in list page: res?.data?.data?.pest?.name
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

  const handleSave = async () => {
    // ───────── VALIDATIONS ─────────
    if (!form.pestId) {
      showToast('error', 'Pest is required')
      return
    }

    if (!form.position) {
      showToast('error', 'Position is required')
      return
    }

    if (!form.title) {
      showToast('error', 'Title is required')
      return
    }

    if (!form.description) {
      showToast('error', 'Description is required')
      return
    }

    try {
      setLoading(true)

      // ───────── PAYLOAD ─────────
      // NOTE: 'type' is removed because it's likely a filter-only property and not a model field.
      // 'is_default' is sent as 1/0 to match the backend response format.
      const payload = {
        pest_id: Number(form.pestId),
        content_position: form.position || null,
        sort_order: form.sort_order ? Number(form.sort_order) : null,
        is_default: form.is_default === 'Yes' ? 1 : 0,
        name: form.title,
        description: form.description
      }

      console.log('📦 ADD PROPOSAL ITEM PAYLOAD:', payload)

      // ───────── API CALL ─────────
      const res = await addProposalItem(payload)
      console.log('✅ API RESPONSE:', res)

      // ───────── SUCCESS ─────────
      if (res?.status === 'success' || res?.status === 200 || res?.status === 201) {
        showToast('success', 'Proposal Item added successfully')
        router.push(`/${lang}/admin/proposal-item`)
        return
      }

      // ───────── BACKEND ERROR ─────────
      showToast('error', res?.message || 'Failed to add proposal item')
    } catch (error) {
      console.error('❌ Add Proposal Item Error:', error?.response?.data || error)
      const errorMsg = error?.response?.data?.message || error?.response?.data?.detail || 'Something went wrong while saving'
      showToast('error', errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // ───────────────────────────────────────
  // UI
  // ───────────────────────────────────────
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
          <Typography color='text.primary'>Add Proposal Content</Typography>
        </Breadcrumbs>
      }
    >
      <Card sx={{ p: 5, boxShadow: 'none' }} elevation={0}>
        <Grid container spacing={6}>
          {/* ───────── BASIC DETAILS ───────── */}
          <Grid item xs={12}>
            <Typography variant='h6' sx={{ fontWeight: 600 }}>
              Basic Details
            </Typography>
            <Divider sx={{ mt: 2 }} />
          </Grid>

          {/* Pest */}
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
            />
          </Grid>

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
            />
          </Grid>

          {/* Sort Order */}
          <Grid item xs={12} md={3}>
            <GlobalTextField
              type='number'
              label='Sort Order'
              value={form.sort_order}
              onChange={e => setForm(prev => ({ ...prev, sort_order: e.target.value }))}
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
            />
          </Grid>

          {/* Title */}
          <Grid item xs={12} md={9}>
            <GlobalTextField
              label='Title'
              placeholder='Enter proposal item title'
              value={form.title}
              onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
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
            <GlobalButton color='secondary' onClick={() => router.back()} disabled={loading}>
              Close
            </GlobalButton>

            <GlobalButton variant='contained' onClick={handleSave} loading={loading}>
              Save
            </GlobalButton>
          </Grid>
        </Grid>
      </Card>
    </StickyListLayout>
  )
}

export default AddProposalItemPage
