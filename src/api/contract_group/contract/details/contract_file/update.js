import api from '@/utils/axiosInstance'

export default function updateContractFile(id, formData) {
  // formData may be FormData if updating file
  return api.put('contract_file-update/', formData, {
    params: { id },
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
