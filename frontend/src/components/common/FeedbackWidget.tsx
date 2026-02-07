"use client";

import { useState } from "react";
import { MessageSquarePlus, X, Send, Smile, Frown, Meh } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import { useTranslations } from "next-intl";

export function FeedbackWidget() {
  const t = useTranslations("feedback");
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [sentiment, setSentiment] = useState<"happy" | "confused" | "bug">(
    "happy",
  );
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Only show if logged in
  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSending(true);
    try {
      if (!token) {
        showToast(t("toast.failure"), "error");
        return;
      }
      const res = await fetch("http://localhost:8000/api/v1/feedback", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feature_context: pathname, // Auto-capture where they are
          content: content,
          sentiment: sentiment,
        }),
      });
      if (res.ok) {
        setSent(true);
        showToast(t("toast.success"), "success");
        setTimeout(() => {
          setIsOpen(false);
          setSent(false);
          setContent("");
        }, 2000);
      } else {
        showToast(t("toast.failure"), "error");
      }
    } catch (err) {
      console.error(err);
      showToast(t("toast.network"), "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-4 lg:bottom-4 lg:right-4 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3 bg-white text-gray-600 rounded-full shadow-lg border border-gray-200 hover:text-indigo-600 transition-colors flex items-center gap-2 group"
          title={t("open")}
        >
          <MessageSquarePlus className="w-6 h-6" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap text-sm font-medium">
            {t("cta")}
          </span>
        </button>
      )}

      {isOpen && (
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-80 p-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900 text-sm">
              {t("title")}
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
              aria-label={t("close")}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {sent ? (
            <div className="text-center py-6 text-green-600 text-sm font-medium">
              {t("sent")}
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="flex justify-center gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => setSentiment("happy")}
                  className={`p-2 rounded-lg transition-colors ${sentiment === "happy" ? "bg-green-100 text-green-600" : "text-gray-400 hover:bg-gray-50"}`}
                >
                  <Smile className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={() => setSentiment("confused")}
                  className={`p-2 rounded-lg transition-colors ${sentiment === "confused" ? "bg-amber-100 text-amber-600" : "text-gray-400 hover:bg-gray-50"}`}
                >
                  <Meh className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={() => setSentiment("bug")}
                  className={`p-2 rounded-lg transition-colors ${sentiment === "bug" ? "bg-red-100 text-red-600" : "text-gray-400 hover:bg-gray-50"}`}
                >
                  <Frown className="w-6 h-6" />
                </button>
              </div>

              <textarea
                className="w-full text-sm p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none mb-3"
                rows={3}
                placeholder={
                  sentiment === "happy"
                    ? t("placeholders.happy")
                    : sentiment === "confused"
                      ? t("placeholders.confused")
                      : t("placeholders.bug")
                }
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />

              <button
                type="submit"
                disabled={sending || !content.trim()}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {sending ? t("sending") : t("submit")}
                <Send className="w-3 h-3" />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
