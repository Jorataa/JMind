"use client";

import { useEffect, useState } from "react";
import { CloudOff } from "lucide-react";

/**
 * Offline state (§7): a quiet straw chip — local-first means offline is a
 * non-event, so it informs without alarming.
 */
export default function OfflineChip() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOffline(!navigator.onLine);
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-6 left-6 z-[95] flex items-center gap-2 rounded-full bg-straw px-3.5 py-2 text-[12px] font-medium text-straw-ink shadow-float-2 max-md:bottom-[84px]"
    >
      <CloudOff size={13} className="text-straw-text" />
      Offline — everything still saves to this device
    </div>
  );
}
