import api from '@/utils/axiosInstance'

export const deleteRecommendation = async id => {
  const res = await api.patch(`recommendation-delete/?id=${id}`)
  return res.data
}
