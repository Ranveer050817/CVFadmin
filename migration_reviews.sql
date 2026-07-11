CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_name TEXT NOT NULL,
    image_url TEXT,
    text TEXT NOT NULL,
    rating INTEGER NOT NULL,
    event_type TEXT,
    event_date TIMESTAMP WITH TIME ZONE,
    is_featured BOOLEAN DEFAULT false,
    display_order INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Enable read access for all users'
    ) THEN
        CREATE POLICY "Enable read access for all users" ON public.reviews FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Enable insert for authenticated users only'
    ) THEN
        CREATE POLICY "Enable insert for authenticated users only" ON public.reviews FOR INSERT TO authenticated WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Enable update for authenticated users only'
    ) THEN
        CREATE POLICY "Enable update for authenticated users only" ON public.reviews FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Enable delete for authenticated users only'
    ) THEN
        CREATE POLICY "Enable delete for authenticated users only" ON public.reviews FOR DELETE TO authenticated USING (true);
    END IF;
END $$;
