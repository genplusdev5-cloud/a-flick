import api from '@/utils/axiosInstance'

export default function addContractLocation(data) {
  return api.post('contract_location-add/', data)
}
