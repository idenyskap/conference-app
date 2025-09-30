// config.js - Application Configuration

const CONFIG = {
    API_BASE_URL: 'http://localhost:8080/api',

    WS_URL: 'ws://localhost:8080/updates',

    AUTH: {
        hostess: '1234',
        admin: 'admin123'
    },

    UI: {
        notificationDuration: 5000,
        animationDuration: 300,
        debounceDelay: 300
    },

    SCANNER: {
        fps: 10,
        qrbox: {
            width: 250,
            height: 250
        }
    },

    LOTTERY: {
        minimumDonation: 500,
        animations: {
            wheel: {
                spinDuration: 3000,
                maxSegments: 20,
                rotations: 5
            },
            sequential: {
                revealDelay: 2000,
                drumRollDuration: 1500
            },
            slots: {
                spinTime: 2500,
                stopDelay: 300
            },
            elimination: {
                roundDelay: 1000,
                finalDelay: 2000
            }
        }
    },

    SYNC_INTERVAL: 30000
};