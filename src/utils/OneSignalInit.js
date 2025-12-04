import OneSignal from 'react-onesignal'
import api from '@/utils/axiosInstance'

export default async function runOneSignal() {
  await OneSignal.init({
    appId: "23ff9179-0d85-4ff4-bfc0-2c9636baf58f",
    allowLocalhostAsSecureOrigin: true,

    notifyButton: {
      enable: true,
      position: 'bottom-right',
      size: 'medium',
      theme: 'inverse',
      offset: { bottom: '20px', right: '20px' },
      colors: {
        'circle.background': 'white',
        'circle.foreground': '#e53935',
        'badge.background': '#e53935',
        'badge.foreground': '#ffffff'
      },
      showCredit: false,
    },

    promptOptions: {
      slidedown: {
        enabled: true,
        title: 'Stay Updated ⚡',
        actionMessage: 'Enable notifications to get instant updates & alerts.',
        acceptButtonText: 'Enable',
        cancelButtonText: 'Later',
        backgroundColor: '#ffffff',
        textColor: '#333333',
      },
    },
  });

  // ⭐ Use OneSignal v16 style player ID
  const playerId = OneSignal?.User?.PushSubscription?.id;
  console.log("🔥 OneSignal Player ID:", playerId);

  if (!playerId) return;

  try {
    // ✔ Get employee_id (change based on your login logic)
    const employeeId = localStorage.getItem("employee_id");

    if (!employeeId) {
      console.error("❌ No employee_id in localStorage!");
      return;
    }

    // ⭐ Backend expects EXACT payload
    await api.post("player-add/", {
      employee_id: Number(employeeId),
      player_id: playerId,
    });

    console.log("✅ Player ID sent successfully");
  } catch (err) {
    console.error("❌ Failed to send player ID:", err);
  }
}
