import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  fallback?: string;
  label?: string;
}

export default function BackButton({ fallback = "/", label = "Back" }: BackButtonProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.state?.idx > 0) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <button
      onClick={handleBack}
      className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold transition-all cursor-pointer mb-4"
      style={{
        background: "rgba(0,102,255,0.08)",
        border: "1px solid rgba(0,102,255,0.18)",
        color: "#2563EB",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = "rgba(0,102,255,0.15)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = "rgba(0,102,255,0.08)";
      }}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}
