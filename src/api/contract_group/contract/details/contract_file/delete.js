import api from '@/utils/axiosInstance'

export default function deleteContractFile(id) {
  // backend uses PATCH with id
  return api.patch('contract_file-delete/', { id })
}
