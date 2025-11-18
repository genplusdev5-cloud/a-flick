import api from '@/utils/axiosInstance'

export default function updateContractPest(data) {
  return api.post('contract_pest-add/', data)
}
