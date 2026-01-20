import api from '@/utils/axiosInstance'

export const addRecommendation = async payload => {
  const res = await api.post('recommendation-add/', payload)
  return res.data
}
