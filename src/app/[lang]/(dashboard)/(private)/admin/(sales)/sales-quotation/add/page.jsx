'use client'

import React from 'react'
import ProposalWizard from '@/views/admin/sales/proposal-wizard/ProposalWizard'
import Link from 'next/link'
import StickyListLayout from '@/components/common/StickyListLayout'
import { Breadcrumbs, Typography } from '@mui/material'
import { useParams } from 'next/navigation'

const AddProposalPage = () => {
  const { lang } = useParams()

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
          <Typography color='text.primary'>Add Proposal</Typography>
        </Breadcrumbs>
      }
    >
      <ProposalWizard />
    </StickyListLayout>
  )
}

export default AddProposalPage
