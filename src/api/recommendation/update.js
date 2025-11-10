import api from '@/utils/axiosInstance'

export const updateRecommendation = async payload => {
  const res = await api.put(`recommendation-update/?id=${payload.id}`, payload)
  return res.data
}
