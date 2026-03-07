// Vercel Serverless Function to inject environment variables
export default function handler(req, res) {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    const supabaseUrl = process.env.SUPABASE_URL || 'https://blsgyybaevuytmgpljyk.supabase.co';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsc2d5eWJhZXZ1eXRtZ3BsanlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NjcyMjYsImV4cCI6MjA4NzM0MzIyNn0.G4gvoW-_7DxQ1y28oZEHS7OIVpsyHTlZewV02Th_meU';
    
    const config = `
        window.SUPABASE_URL = '${supabaseUrl}';
        window.SUPABASE_ANON_KEY = '${supabaseKey}';
        console.log('Environment config loaded from Vercel');
        console.log('Supabase URL:', window.SUPABASE_URL);
    `;
    
    res.status(200).send(config);
}
