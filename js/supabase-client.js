// Supabase Client Configuration
// Reads from environment variables injected by Vercel

// Get credentials from window object (injected by config script)
const SUPABASE_URL = window.SUPABASE_URL || 'https://blsgyybaevuytmgpljyk.supabase.co';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsc2d5eWJhZXZ1eXRtZ3BsanlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NjcyMjYsImV4cCI6MjA4NzM0MzIyNn0.G4gvoW-_7DxQ1y28oZEHS7OIVpsyHTlZewV02Th_meU';

console.log('Supabase URL:', SUPABASE_URL);
console.log('Supabase Key:', SUPABASE_ANON_KEY ? 'Present' : 'Missing');

// Wait for supabase library to load (loaded via script tag in HTML)
(function initSupabase() {
    function tryInit() {
        if (typeof supabase !== 'undefined' && supabase.createClient) {
            console.log('Supabase library loaded, creating client...');
            
            // Create client
            const supabaseClient = supabase.createClient(
                SUPABASE_URL,
                SUPABASE_ANON_KEY
            );
            
            // Make available globally
            window.supabaseClient = supabaseClient;
            window.supabase = supabaseClient;
            
            console.log('✅ Supabase client initialized successfully');
            
            // Dispatch ready event
            window.dispatchEvent(new Event('supabaseReady'));
        } else {
            console.log('Waiting for Supabase library...');
            setTimeout(tryInit, 100);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryInit);
    } else {
        tryInit();
    }
})();
