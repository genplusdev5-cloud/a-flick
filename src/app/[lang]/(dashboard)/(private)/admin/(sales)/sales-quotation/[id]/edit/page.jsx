'use client'

import React from 'react'
import ProposalWizard from '@/views/admin/sales/proposal-wizard/ProposalWizard'
import { useParams } from 'next/navigation'

const EditProposalPage = () => {
  const { id } = useParams()
  return <ProposalWizard id={id} />
}

export default EditProposalPage
