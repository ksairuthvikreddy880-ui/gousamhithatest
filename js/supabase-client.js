// Supabase Client Configuration
// Hardcoded credentials with fallback from window object

const SUPABASE_URL = window.SUPABASE_URL || 'https://blsgyybaevuytmgpljyk.supabase.co';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsc2d5eWJhZXZ1eXRtZ3BsanlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NjcyMjYsImV4cCI6MjA4NzM0MzIyNn0.G4gvoW-_7DxQ1y28oZEHS7OIVpsyHTlZewV02Th_meU';

console.log('🔧 Initializing Supabase...');
console.log('📍 Supabase URL:', SUPABASE_URL);
console.log('🔑 Supabase Key:', SUPABASE_ANON_KEY ? 'Present ✓' : 'Missing ✗');

// Wait for supabase library to load (loaded via script tag in HTML)
(function initSupabase() {
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max
    
    function tryInit() {
        attempts++;
        
        if (typeof supabase !== 'undefined' && supabase.createClient) {
            console.log('📚 Supabase library loaded, creating client...');
            
            try {
                // Create client
                const supabaseClient = supabase.createClient(
                    SUPABASE_URL,
                    SUPABASE_ANON_KEY
                );
                
                // Make available globally
                window.supabaseClient = supabaseClient;
                window.supabase = supabaseClient;
                
                console.log('✅ Supabase client initialized successfully');
                console.log('🔗 Client methods available:', typeof supabaseClient.from === 'function' ? 'Yes' : 'No');
                
                // Dispatch ready event
                window.dispatchEvent(new Event('supabaseReady'));
            } catch (error) {
                console.error('❌ Error creating Supabase client:', error);
            }
        } else {
            if (attempts < maxAttempts) {
                setTimeout(tryInit, 100);
            } else {
                console.error('❌ Timeout: Supabase library failed to load after 5 seconds');
                console.error('Check if https://unpkg.com/@supabase/supabase-js@2 is accessible');
            }
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryInit);
    } else {
        tryInit();
    }
})();
