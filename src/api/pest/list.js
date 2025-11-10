import api from '@/utils/axiosInstance'

export const getPestList = async () => {
  const res = await api.get('pest-list/')
  return res // ✅ return full response (not res.data)
}
