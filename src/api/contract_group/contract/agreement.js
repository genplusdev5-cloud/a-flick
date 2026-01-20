import api from '@/utils/axiosInstance'

export const getAgreementPDF = async contractId => {
  const res = await api.get(`contract-agreement/?contract_id=${contractId}`)
  return res.data
}
