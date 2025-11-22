import api from '@/utils/axiosInstance'

// 🔥 Fetch all dropdowns using ONE API call
export const getMaterialRequestDropdowns = async () => {
  const res = await api.get(
    'dropdown-filter/?models=employee(label=name),chemicals(label=name),uom(label=name),supplier(label=name)'
  )
  return res.data
}
