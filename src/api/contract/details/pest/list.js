import api from '@/utils/axiosInstance'

export default function listContractPests(contractId) {
  return api.get('contract_pest-list/', {
    params: { contract_id: contractId, page_size: 1000 }
  })
}
