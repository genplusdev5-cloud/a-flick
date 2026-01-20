import api from '@/utils/axiosInstance'

// recommendation API
export const getRecommendationList = async (pestId) => {
  const res = await api.get(`recommendation-list/?pest_id=${pestId}&page_size=1000`)
  return res.data
}



