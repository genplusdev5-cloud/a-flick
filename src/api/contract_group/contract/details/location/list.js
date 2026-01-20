import api from '@/utils/axiosInstance'

export default function listContractLocations(contractId) {
  return api.get('contract_location-list/', {
    params: { contract_id: contractId }
  })
}
