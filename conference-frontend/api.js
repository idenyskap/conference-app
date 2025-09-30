// api.js - API Service Module

class ApiService {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: 'Network error' }));
                throw new Error(error.error || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Error: ${endpoint}`, error);
            throw error;
        }
    }

    async getParticipants() {
        return this.request('/participants');
    }

    async checkIn(qrCode) {
        return this.request('/participants/checkin', {
            method: 'POST',
            body: JSON.stringify({ qrCode })
        });
    }

    async addDonation(qrCode, amount) {
        return this.request('/participants/donation', {
            method: 'POST',
            body: JSON.stringify({ qrCode, amount })
        });
    }

    async testConnection() {
        return this.request('/participants/test').catch(() => false);
    }
}

const api = new ApiService(CONFIG.API_BASE_URL);