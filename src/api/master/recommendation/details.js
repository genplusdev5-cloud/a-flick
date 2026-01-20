import api from '@/utils/axiosInstance'

export const getRecommendationDetails = async id => {
  const res = await api.get(`recommendation-details/?id=${id}`)
  return res.data
}
