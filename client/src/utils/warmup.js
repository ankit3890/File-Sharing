
export function warmUpServer() {
    // Get base URL logic similar to api.js or direct from env
    const envUrl = import.meta.env.VITE_API_URL;
    let baseURL = '/api';
    
    if (envUrl) {
        baseURL = envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
    }

    // Call /health endpoint
    fetch(`${baseURL}/health`, {
        method: 'GET',
    }).then(() => {
        console.log('Server warm-up ping sent.');
    }).catch(() => {
        // ignore errors – backend may be sleeping or offline
        console.log('Server warm-up ping failed (expected if sleeping).');
    });
}
