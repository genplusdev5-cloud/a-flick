import api from '@/utils/axiosInstance'

export default function updateContractPest(data) {
  const { id, ...payload } = data
  return api.put(`contract_pest-update/?id=${id}`, payload)
}
