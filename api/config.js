// Vercel Serverless Function to inject environment variables
export default function handler(req, res) {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    const config = `
        window.SUPABASE_URL = '${process.env.SUPABASE_URL || ''}';
        window.SUPABASE_ANON_KEY = '${process.env.SUPABASE_ANON_KEY || ''}';
        console.log('Environment config loaded');
    `;
    
    res.status(200).send(config);
}
