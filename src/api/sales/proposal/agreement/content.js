import api from '@/utils/axiosInstance'

export const getSalesAgreementContent = proposalId => {
  return api.get('/sales_agreement-details/', {
    params: {
      proposal_id: proposalId
    }
  })
}
