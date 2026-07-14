import React from "react";
import { useLocation } from "react-router-dom";

/**
 * Slim progress bar shown briefly at the top of the viewport whenever the
 * route changes, giving users visual feedback that a new page is loading —
 * even though most navigations resolve almost instantly.
 */
export default function RouteProgressBar() {
  const location = useLocation();
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 380);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-0.5 overflow-hidden" aria-hidden="true">
      <div
        className="h-full"
        style={{
          background: "linear-gradient(90deg,#2563EB,#60a5fa)",
          animation: "route-progress 0.38s ease-out forwards"
        }}
      />
      <style>{`
        @keyframes route-progress {
          0% { width: 0%; margin-left: 0%; }
          60% { width: 70%; }
          100% { width: 100%; margin-left: 0%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
