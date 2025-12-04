import OneSignal from 'react-onesignal'

export default async function runOneSignal() {
  await OneSignal.init({
    appId: "23ff9179-0d85-4ff4-bfc0-2c9636baf58f",
    allowLocalhostAsSecureOrigin: true,

    // 🔔 BOTTOM RIGHT BELL ICON
    notifyButton: {
      enable: true,
      position: 'bottom-right',
      size: 'medium',
      theme: 'inverse', // clean black/white style
      offset: {
        bottom: '20px',
        right: '20px'
      },
      colors: {
        'circle.background': 'white',
        'circle.foreground': '#e53935', // your brand red
        'badge.background': '#e53935',
        'badge.foreground': '#ffffff'
      },
      showCredit: false // remove OneSignal branding
    },

    // 🎨 Professional Popup Style
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

  // Manual trigger if needed
  // OneSignal.showSlidedownPrompt()

  // 🔥 When subscribed
  OneSignal.on('subscriptionChange', async isSubscribed => {
    if (isSubscribed) {
      const token = await OneSignal.getUserId()
      console.log('🔥 Web Push Token:', token)

      // Send token to backend
      await fetch('https://aflick.genpest360.com/api/player-add/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })
    }
  })
}
