import api from '@/utils/axiosInstance'

export const getSalesAgreementContent = proposalId => {
  return api.get('/sales_agreement-content/', {
    params: {
      proposal_id: proposalId
    }
  })
}
