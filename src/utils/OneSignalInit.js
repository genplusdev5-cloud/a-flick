import OneSignal from "react-onesignal";
import api from "@/utils/axiosInstance";

export default async function runOneSignal() {
  console.log("🚀 Initializing OneSignal...");

  await OneSignal.init({
    appId: "23ff9179-0d85-4ff4-bfc0-2c9636baf58f",
    allowLocalhostAsSecureOrigin: true,

    notifyButton: {
      enable: true,
      position: "bottom-right",
      size: "medium",
      theme: "inverse",
      offset: { bottom: "20px", right: "20px" },
      colors: {
        "circle.background": "white",
        "circle.foreground": "#e53935",
        "badge.background": "#e53935",
        "badge.foreground": "#ffffff",
      },
      showCredit: false,
    },

    promptOptions: {
      slidedown: {
        enabled: true,
        title: "Stay Updated ⚡",
        actionMessage: "Enable notifications to get instant updates & alerts.",
        acceptButtonText: "Enable",
        cancelButtonText: "Later",
      },
    },
  });

  console.log("🔔 OneSignal SDK Init Triggered");

  // Wait until SDK fully ready!
 OneSignal.on("initialized", async () => {
  console.log("🎯 OneSignal fully initialized!");

  async function savePlayerId() {
    try {
      const playerId = await OneSignal.User.PushSubscription.getId();
      console.log("🔥 Player ID:", playerId);

      if (!playerId) return;

      const employeeId = localStorage.getItem("employee_id");
      if (!employeeId) return console.error("❌ employee_id missing!");

      const res = await api.post("player-add/", {
        employee_id: Number(employeeId),
        player_id: playerId,
      });

      console.log("✅ Player ID saved:", res.data);
    } catch (err) {
      console.error("❌ Save failed:", err);
    }
  }

  // ⭐ Force user subscribe if not already
  try {
    await OneSignal.User.PushSubscription.subscribe();
    console.log("🔔 Push subscription triggered!");
  } catch (err) {
    console.warn("⚠️ Subscription failed, user interaction needed!");
  }

  // Listen subscription change
  OneSignal.User.PushSubscription.addEventListener("change", () => {
    console.log("🔄 Subscription changed — saving Player ID...");
    savePlayerId();
  });

  // Initial call
  savePlayerId();
});
}
