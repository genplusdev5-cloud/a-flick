import api from '@/utils/axiosInstance'

export default function getContractLocationDetails(id) {
  return api.get('contract_location-details/', {
    params: { id }
  })
}
