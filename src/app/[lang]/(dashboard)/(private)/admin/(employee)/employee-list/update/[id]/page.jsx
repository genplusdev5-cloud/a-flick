'use client'

import React from 'react'
import EmployeeWizard from '@/views/admin/employee/employee-wizard'
import Link from 'next/link'
import StickyListLayout from '@/components/common/StickyListLayout'
import { Breadcrumbs, Typography } from '@mui/material'
import { useParams } from 'next/navigation'

const UpdateEmployeePage = () => {
  const { id, lang } = useParams()
  
  // Decode Base64 ID
  const decodedId = id ? atob(decodeURIComponent(id)) : null

  if (!decodedId) {
      return <Typography color='error'>Invalid Employee ID</Typography>
  }

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
          <Typography color='text.primary'>Update Employee</Typography>
        </Breadcrumbs>
      }
    >
      <EmployeeWizard mode='edit' id={decodedId} />
    </StickyListLayout>
  )
}

export default UpdateEmployeePage
