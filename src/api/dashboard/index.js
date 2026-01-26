import api from '@/utils/axiosInstance'
// import axios from 'axios'

/* ======================================================
   GET DASHBOARD CARDS
====================================================== */
export const getDashboardCards = async () => {
  try {
    const res = await api.get('dashboard/')

    return {
      status: 'success',
      data: res?.data?.data || {}
    }
  } catch {
    // STOP showing undefined errors in console
    console.error('❌ Cards API Error')
    return { status: 'failed', data: {} }
  }
}

// 🔹 Today Service Requests
export const getTodayServiceRequests = async () => {
  const res = await api.get('dashboard-filter/')
  return res.data
}

// 🔹 Today Followups (NEW API)
export const getTodayFollowups = async () => {
  const res = await api.get('dashboard-followups')
  return res.data
}

export const getDashboardRenewal = async () => {
  try {
    const res = await api.get('dashboard-renewal/')

    return {
      status: 'success',
      data: res?.data?.results || res?.data?.data || []
    }
  } catch {
    console.error('❌ Dashboard Renewal API Error')
    return {
      status: 'failed',
      data: []
    }
  }
}

/* ======================================================
   GET KVI FINDER
====================================================== */
export const getKviFinder = async () => {
  try {
    const res = await api.get('kvi-finder/')

    return {
      status: 'success',
      data: res?.data?.results || res?.data?.data || []
    }
  } catch {
    console.error('❌ KVI Finder API Error')
    return {
      status: 'failed',
      data: []
    }
  }
}

/* ======================================================
   GET DASHBOARD TABLE (CUSTOMER / CONTRACT)
====================================================== */
// export const getDashboardList = async (
//   type = 'customer',
//   page = 1,
//   pageSize = 25,
//   cancelToken,
//   radioFilter = '',
//   searchText = ''
// ) => {
//   try {
//     const params = {
//       type,
//       page,
//       page_size: pageSize
//     }

//     // Dynamic filter
//     if (radioFilter && searchText) {
//       params[radioFilter] = searchText
//     }

//     const res = await api.get('dashboard-filter/', {
//       cancelToken,
//       params
//     })

//     const results = res?.data?.results
//     const count = res?.data?.count

//     return {
//       status: 'success',
//       table: Array.isArray(results) ? results : [],
//       count: typeof count === 'number' ? count : 0
//     }
//   } catch (err) {
//     // Cancel request is NOT an error
//     if (axios.isCancel(err)) {
//       return { status: 'cancelled', table: [], count: 0 }
//     }

//     // FIX: Remove raw error object to avoid "undefined undefined" error
//     console.error('❌ Dashboard List API Error')

//     return {
//       status: 'failed',
//       table: [],
//       count: 0
//     }
//   }
// }
