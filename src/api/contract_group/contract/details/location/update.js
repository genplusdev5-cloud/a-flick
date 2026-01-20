import api from '@/utils/axiosInstance'

export default function updateContractLocation(id, data) {
  return api.put(`contract_location-update/`, data, {
    params: { id }
  })
}
