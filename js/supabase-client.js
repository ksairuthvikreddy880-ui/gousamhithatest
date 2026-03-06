// Supabase Client Configuration
// CDN version - no build required

const SUPABASE_URL = 'https://blsgyybaevuytmgpljyk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsc2d5eWJhZXZ1eXRtZ3BsanlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NjcyMjYsImV4cCI6MjA4NzM0MzIyNn0.G4gvoW-_7DxQ1y28oZEHS7OIVpsyHTlZewV02Th_meU';

// Load Supabase from CDN using dynamic import
(async function() {
    try {
        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
        
        // Initialize Supabase client
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // Make globally available
        window.supabase = supabase;
        
        console.log('✅ Supabase connected successfully');
        console.log('📍 Project URL:', SUPABASE_URL);
        
        // Dispatch event to signal Supabase is ready
        window.dispatchEvent(new Event('supabaseReady'));
    } catch (error) {
        console.error('❌ Failed to load Supabase:', error);
    }
})();
