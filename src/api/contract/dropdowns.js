// api/dropdowns/single.js
import api from '@/utils/axiosInstance'

export const getAllDropdowns = async () => {
  try {
    const res = await api.get(`dropdown-filter/`, {
      params: {
        models: 'employee,chemicals,uom,supplier,customer,industry,calltype,billingfrequency,servicefrequency,pest',
        company: typeof window !== 'undefined' ? localStorage.getItem('company') : '',
        branch: typeof window !== 'undefined' ? localStorage.getItem('branch') : '',
        page_size: 200
      }
    })

    const rawData = res?.data?.data || {}

    // Safe extractor: handle {name: [...]}, {results: [...]}, direct array, or error object
    const extractArray = (item) => {
      if (!item) return []
      if (Array.isArray(item)) return item
      if (item.name && Array.isArray(item.name)) return item.name
      if (item.results && Array.isArray(item.results)) return item.results
      if (item.error) return [] // skip broken models
      if (typeof item === 'object') return Object.values(item).flat()
      return []
    }

    return {
      employees: extractArray(rawData.employee),     // → has .name array
      chemicals: extractArray(rawData.chemicals),
      uom: extractArray(rawData.uom),
      supplier: extractArray(rawData.supplier),
      customers: extractArray(rawData.customer),
      industries: extractArray(rawData.industry),
      callTypes: extractArray(rawData.calltype),
      billingFreq: extractArray(rawData.billingfrequency),   // will be [] if error
      serviceFreq: extractArray(rawData.servicefrequency),   // will be [] if error
      pests: extractArray(rawData.pest)
    }

  } catch (err) {
    console.error('Dropdown Load Failed:', err)
    return {
      employees: [], chemicals: [], uom: [], supplier: [],
      customers: [], industries: [], callTypes: [],
      billingFreq: [], serviceFreq: [], pests: []
    }
  }
}
