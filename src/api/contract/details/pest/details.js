import api from '@/utils/axiosInstance'

export default function getContractPestDetails(id) {
  return api.get('contract_pest-details/', {
    params: { id }
  })
}
