"use client";

import {
  type RealtimePostgresChangesPayload,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { useEffect, useRef } from "react";

import { type Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/client";

type PublicSchema = Database["public"];
type TableName = keyof PublicSchema["Tables"];
type RowOf<T extends TableName> = PublicSchema["Tables"][T]["Row"];

interface UseRealtimeTableOptions<T extends TableName> {
  /** Table to watch. Must have realtime enabled and an RLS SELECT policy. */
  table: T;
  /** Server-side filter, e.g. `project_id=eq.${projectId}`. */
  filter?: string;
  /** Fires for every insert, update and delete the user is allowed to see. */
  onChange: (payload: RealtimePostgresChangesPayload<RowOf<T>>) => void;
}

/**
 * Subscribes to Postgres changes on one table.
 *
 * The rows a client receives are decided by that table's RLS policies, not by
 * this hook. `filter` narrows the stream; it does not secure it. Any table
 * subscribed to here needs a reviewed SELECT policy.
 *
 * Pass server-rendered rows as the initial state and use this only to apply
 * deltas, so the first paint doesn't wait on a websocket.
 */
export function useRealtimeTable<T extends TableName>({
  table,
  filter,
  onChange,
}: UseRealtimeTableOptions<T>): void {
  // Keep the latest callback without re-subscribing on every render.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const supabase: SupabaseClient<Database> = createClient();
    const channel = supabase
      .channel(`realtime:${table}${filter ?? ""}`)
      .on<RowOf<T>>(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          ...(filter === undefined ? {} : { filter }),
        },
        (payload) => {
          onChangeRef.current(payload);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [table, filter]);
}
