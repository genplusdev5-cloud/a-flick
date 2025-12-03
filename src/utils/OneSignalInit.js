import OneSignal from 'react-onesignal'

export default async function runOneSignal() {
 await OneSignal.init({
  appId: "23ff9179-0d85-4ff4-bfc0-2c9636baf58f",
  allowLocalhostAsSecureOrigin: true
});


  // Permission popup
  OneSignal.showSlidedownPrompt()

  // When subscribed
  OneSignal.on('subscriptionChange', async isSubscribed => {
    if (isSubscribed) {
      const token = await OneSignal.getUserId()
      console.log('🔥 Web Push Token:', token)

      // Send token to backend
      await fetch('http://your-backend.com/save-push-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })
    }
  })
}
