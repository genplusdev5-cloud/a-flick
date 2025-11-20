import api from '@/utils/axiosInstance'

export const addContractApi = async payload => {
  try {
    const company = localStorage.getItem("company");
    const branch = localStorage.getItem("branch");

    const finalPayload = {
      ...payload,
      company: company,     // IMPORTANT
      branch: branch        // IMPORTANT
    };

    console.log("📌 Sending FINAL PAYLOAD:", finalPayload);

    const res = await api.post("contract-add/", finalPayload);

    return res.data;
  } catch (err) {
    console.error("❌ addContractApi Error:", err.response?.data || err);
    throw err;
  }
};
