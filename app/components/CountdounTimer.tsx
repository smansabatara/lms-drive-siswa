"use client";

import { useState, useEffect } from "react";

export default function CountdownTimer({ dueDate }: { dueDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    const target = new Date(dueDate).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
        clearInterval(interval);
      } else {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds, isExpired: false });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [dueDate]);

  if (timeLeft.isExpired) {
    return (
      <span className="bg-red-100 text-red-700 px-3 py-1 rounded font-bold text-xs">
        ⏰ Waktu Pengumpulan Habis!
      </span>
    );
  }

  return (
    <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded font-mono font-bold text-xs inline-block">
      ⏳ Sisa Waktu: {String(timeLeft.hours).padStart(2, "0")}:
      {String(timeLeft.minutes).padStart(2, "0")}:
      {String(timeLeft.seconds).padStart(2, "0")}
    </div>
  );
}