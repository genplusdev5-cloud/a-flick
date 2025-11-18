import api from '@/utils/axiosInstance'

export default function deleteContractLocation(id) {
  return api.patch('contract_location-delete/', { id })
}
