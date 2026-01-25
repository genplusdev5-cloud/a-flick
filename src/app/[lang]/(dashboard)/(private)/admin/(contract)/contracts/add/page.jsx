'use client'

import React from 'react'
import AddContractWizard from '@/views/admin/contract/contracts/add-wizard'
import Link from 'next/link'
import StickyListLayout from '@/components/common/StickyListLayout'
import { Breadcrumbs, Typography } from '@mui/material'

const AddContractPage = () => {
  return (
    <StickyListLayout
      header={
        <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 2 }}>
          <Link underline='hover' color='inherit' href='/'>
            Home
          </Link>
          <Typography color='text.secondary'>Contract Management</Typography>
          <Link underline='hover' color='inherit' href='/admin/contracts'>
            Contracts
          </Link>
          <Typography color='text.primary'>Add Contract</Typography>
        </Breadcrumbs>
      }
    >
      <AddContractWizard />
    </StickyListLayout>
  )
}

export default AddContractPage
