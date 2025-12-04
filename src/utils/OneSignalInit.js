import OneSignal from 'react-onesignal'
import api from '@/utils/axiosInstance'   // <-- YOUR AXIOS INSTANCE

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
      showCredit: false
    },

    promptOptions: {
      slidedown: {
        enabled: true,
        title: 'Stay Updated ⚡',
        actionMessage: 'Enable notifications to get instant updates & alerts.',
        acceptButtonText: 'Enable',
        cancelButtonText: 'Later',
        backgroundColor: '#ffffff',
        textColor: '#333333'
      }
    }
  })

  // SUBSCRIBE
  OneSignal.on('subscriptionChange', async isSubscribed => {
    if (!isSubscribed) return

    try {
      const token = await OneSignal.getUserId()
      console.log("🔥 Web Push Token:", token)

      // ⭐ Send using AXIOS → AUTH TOKEN auto attach ஆகும்
      await api.post('player-add/', { token })

      console.log("✅ Player added successfully")
    } catch (err) {
      console.error("❌ Player add failed:", err)
    }
  })
}
