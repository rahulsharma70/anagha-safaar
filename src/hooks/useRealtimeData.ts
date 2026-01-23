import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type TableName = "hotels" | "flights" | "tours";

export const useRealtimeData = (tableName: TableName, queryKey: string[]) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`${tableName}-changes`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: tableName,
        },
        (payload) => {
          console.log(`Realtime update for ${tableName}:`, payload.eventType);
          // Invalidate and refetch the query when data changes
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName, queryClient, queryKey]);
};
