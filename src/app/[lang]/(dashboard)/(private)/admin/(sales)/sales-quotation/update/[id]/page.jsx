'use client'

import React from 'react'
import ProposalWizard from '@/views/admin/sales/proposal-wizard/ProposalWizard'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import StickyListLayout from '@/components/common/StickyListLayout'
import { Breadcrumbs, Typography, Box } from '@mui/material'

const UpdateProposalPage = () => {
  const { id, lang } = useParams()

  return (
    <StickyListLayout
      header={
        <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 2 }}>
          <Link underline='hover' color='inherit' href={`/${lang}`}>
            Home
          </Link>
          <Typography color='text.secondary'>Sales</Typography>
          <Link underline='hover' color='inherit' href={`/${lang}/admin/sales-quotation`}>
            Sales Quotation
          </Link>
          <Typography color='text.primary'>Update Proposal</Typography>
        </Breadcrumbs>
      }
    >
      <ProposalWizard id={id} />
    </StickyListLayout>
  )
}

export default UpdateProposalPage
