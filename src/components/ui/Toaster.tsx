"use client";

import { useState, createContext, useContext, ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

// 🎯 Toast object type
type Toast = {
  id: number;
  message: string;
  type?: "success" | "error" | "loading";
};

// 🎯 Context for adding new toasts
const ToastContext = createContext<{
  addToast: (msg: string, type?: Toast["type"]) => void;
}>({
  addToast: () => {},
});

// 🎯 Hook for using the toast system anywhere
export function useToast() {
  return useContext(ToastContext);
}

// 🎯 Global provider to wrap around the app
export function ToasterProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: Toast["type"] = "success") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      {/* ✅ Toast container */}
      <div className="fixed top-5 right-5 z-[100] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className={`px-4 py-2 rounded-xl shadow-lg text-sm font-medium backdrop-blur-lg border
                ${
                  t.type === "error"
                    ? "bg-red-100 border-red-200 text-red-700"
                    : t.type === "loading"
                    ? "bg-blue-100 border-blue-200 text-blue-700"
                    : "bg-green-100 border-green-200 text-green-700"
                }`}
            >
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
