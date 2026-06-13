"use client";

import { useMemo, useState, useCallback } from "react";
import { wisdomData } from "../data/wisdom";
import { formatFullDate, getLocalDateKey } from "@/lib/format-date";

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

  const formattedDate = useMemo(() => formatFullDate(todayDate), [todayDate]);

  // Local day, not UTC — keeps "today's" reflection filed under the user's
  // actual date instead of rolling over in the early morning.
  const dateKey = useMemo(() => getLocalDateKey(todayDate), [todayDate]);

  return {
    wisdom,
    today: formattedDate,
    dateKey,
    refresh,
  };
}
