import api from '@/utils/axiosInstance'

// GET FILE LIST WITH CONTRACT ID
export default function listContractFiles(contractId) {
  return api.get('contract_file-list/', {
    params: { contract_id: contractId } // backend requires this
  })
}
