'use client'

import React from 'react'
import EmployeeWizard from '@/views/admin/employee/employee-wizard'
import Link from 'next/link'
import StickyListLayout from '@/components/common/StickyListLayout'
import { Breadcrumbs, Typography } from '@mui/material'
import { useParams } from 'next/navigation'

const AddEmployeePage = () => {
  const { lang } = useParams()

  return (
    <StickyListLayout
      header={
        <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 2 }}>
          <Link underline='hover' color='inherit' href={`/${lang}`}>
            Home
          </Link>
          <Typography color='text.secondary'>Employee</Typography>
          <Link underline='hover' color='inherit' href={`/${lang}/admin/employee-list`}>
            Employee List
          </Link>
          <Typography color='text.primary'>Add Employee</Typography>
        </Breadcrumbs>
      }
    >
      <EmployeeWizard mode='add' />
    </StickyListLayout>
  )
}

export default AddEmployeePage
