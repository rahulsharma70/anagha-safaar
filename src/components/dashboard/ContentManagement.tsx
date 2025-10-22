import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Hotel, Plane, Camera } from "lucide-react";
import { HotelsManagement } from "./HotelsManagement";
import { ToursManagement } from "./ToursManagement";
import { FlightsManagement } from "./FlightsManagement";

export const ContentManagement = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Content Management</h2>
        <p className="text-muted-foreground">Add, edit, and remove hotels, tours, and flights</p>
      </div>

      <Tabs defaultValue="hotels" className="space-y-4">
        <TabsList>
          <TabsTrigger value="hotels">
            <Hotel className="h-4 w-4 mr-2" />
            Hotels
          </TabsTrigger>
          <TabsTrigger value="tours">
            <Camera className="h-4 w-4 mr-2" />
            Tours
          </TabsTrigger>
          <TabsTrigger value="flights">
            <Plane className="h-4 w-4 mr-2" />
            Flights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hotels">
          <HotelsManagement />
        </TabsContent>

        <TabsContent value="tours">
          <ToursManagement />
        </TabsContent>

        <TabsContent value="flights">
          <FlightsManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};
