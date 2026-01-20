import api from '@/utils/axiosInstance'

export default function deleteContractPest(id) {
  return api.patch('contract_pest-delete/', { id })
}
