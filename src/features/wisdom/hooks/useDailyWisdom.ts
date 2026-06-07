"use client";

import { useMemo, useState, useCallback } from "react";
import { wisdomData } from "../data/wisdom";

export function useDailyWisdom() {
  const todayDate = useMemo(() => new Date(), []);
  const [refreshSeed, setRefreshSeed] = useState(0);
  
  const wisdom = useMemo(() => {
    const year = todayDate.getFullYear();
    const month = todayDate.getMonth() + 1;
    const day = todayDate.getDate();
    // Daily seed + optional refresh seed
    const seed = year * 10000 + month * 100 + day + refreshSeed;
    const index = seed % wisdomData.length;
    return wisdomData[index];
  }, [todayDate, refreshSeed]);

  const refresh = useCallback(() => {
    setRefreshSeed(prev => prev + 1);
  }, []);

  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat("en", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(todayDate);
  }, [todayDate]);

  const dateKey = useMemo(() => {
    return todayDate.toISOString().split("T")[0];
  }, [todayDate]);

  return {
    wisdom,
    today: formattedDate,
    dateKey,
    refresh,
  };
}
