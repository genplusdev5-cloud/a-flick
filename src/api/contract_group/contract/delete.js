import api from '@/utils/axiosInstance'

export const deleteContractApi = async uuid => {
  const res = await api.patch(`contract-delete/?uuid=${uuid}`)
  return res.data
}
