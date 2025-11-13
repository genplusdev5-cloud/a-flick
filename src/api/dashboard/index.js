import api from '@/utils/axiosInstance'
import axios from 'axios'


// =====================================
// GET DASHBOARD CARDS
// =====================================
export const getDashboardCards = async () => {
  try {
    const res = await api.get('dashboard/')
    return {
      status: 'success',
      data: res?.data?.data || {}
    }
  } catch (err) {
    console.error('❌ Cards API Error:', err)
    return { status: 'failed', data: {} }
  }
}

// =====================================
// GET DASHBOARD TABLE (CUSTOMER/CONTRACT)
// =====================================

export const getDashboardList = async (
  type = 'customer',
  page = 1,
  pageSize = 25,
  cancelToken,
  radioFilter = '',
  searchText = ''
) => {
  try {
    const params = {
      type,
      page,
      limit: pageSize
    }

    // 🔥 Add dynamic filter only if user selected filter
    if (radioFilter && searchText) {
      params[radioFilter] = searchText // <-- KEY PART!
    }

    const res = await api.get(`dashboard-filter/`, {
      cancelToken,
      params
    })

    return {
      status: 'success',
      table: res?.data?.results || [],
      count: res?.data?.count || 0
    }
  } catch (err) {
    if (axios.isCancel(err)) {
      // 🔥 Don't log this, it's not an error
      return { status: 'cancelled', table: [], count: 0 }
    }

    console.error('❌ List API Error:', err)
    return { status: 'failed', table: [], count: 0 }
  }
}
