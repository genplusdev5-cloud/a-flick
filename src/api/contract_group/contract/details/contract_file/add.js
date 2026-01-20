import api from '@/utils/axiosInstance'

export default function addContractFile(formData) {
  // formData should be a FormData instance with file and other fields
  return api.post('contract_file-add/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
