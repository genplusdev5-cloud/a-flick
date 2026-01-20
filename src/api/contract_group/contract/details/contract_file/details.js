import api from '@/utils/axiosInstance'

export default function getContractFileDetails(id) {
  return api.get('contract_file-details/', { params: { id } })
}
