import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type RealtimeCallback<T = any> = (payload: RealtimePostgresChangesPayload<T>) => void;

export function useRealtimeSubscription<T = any>(
  table: string,
  callback: RealtimeCallback<T>,
  deps: any[] = [],
  filter?: string,
) {
  useEffect(() => {
    const channel = supabase
      .channel(`${table}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter: filter ?? undefined },
        callback,
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, deps);
}
