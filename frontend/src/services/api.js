const getHeaders = () => {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

// Generic fetch wrapper
const request = async (url, options = {}) => {
    const res = await fetch(url, {
        ...options,
        headers: {
            ...getHeaders(),
            ...options.headers,
        },
    });

    if (res.status === 401) {
        // Handle Token Expiry by redirecting to login (basic implementation)
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Unauthorized');
    }

    if (!res.ok) {
        let errorMessage = 'API request failed';
        try {
            const error = await res.json();
            errorMessage = error.message || error.code || errorMessage;
        } catch {
            // If JSON parse fails, try text
            const text = await res.text();
            if (text) errorMessage = text.slice(0, 100); // Limit length
        }
        throw new Error(errorMessage);
    }

    return res.json();
};

export const api = {
    get: (url) => request(url),
    post: (url, body) => request(url, { method: 'POST', body: JSON.stringify(body) }),
    patch: (url, body) => request(url, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (url) => request(url, { method: 'DELETE' }),
};
