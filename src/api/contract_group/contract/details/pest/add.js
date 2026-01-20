import api from '@/utils/axiosInstance'

export default function addContractPest(data) {
  return api.post('contract_pest-add/', data)
}
