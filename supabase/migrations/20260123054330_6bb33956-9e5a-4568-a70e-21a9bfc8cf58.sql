-- Enable realtime for hotels, flights, and tours tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.hotels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.flights;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tours;