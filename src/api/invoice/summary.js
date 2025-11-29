import api from "@/utils/axiosInstance";

export const getInvoiceSummary = async (filters = {}) => {
  try {
    const query = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        query.append(key, value);
      }
    });

    console.log("FINAL QUERY 👉", query.toString());

    const response = await api.get(`invoice-summary/?${query.toString()}`);
    return response.data;

  } catch (err) {
    console.error("Invoice Summary Error:", err);
    throw err;
  }
};
