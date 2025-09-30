class ConferenceApp {
    constructor() {
        this.currentUser = null;
        this.participants = [];
        this.scanner = null;
        this.currentScannerMode = null;
        this.syncInterval = null;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthState();
    }

    setupEventListeners() {
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.closest('.nav-btn').dataset.tab);
            });
        });

        document.getElementById('startScanBtn').addEventListener('click', () => {
            this.startScanner('checkin');
        });

        document.getElementById('stopScanBtn').addEventListener('click', () => {
            this.stopScanner();
        });

        document.getElementById('manualCheckInBtn').addEventListener('click', () => {
            const qrCode = document.getElementById('manualQrInput').value.trim();
            if (qrCode) {
                this.handleCheckIn(qrCode);
                document.getElementById('manualQrInput').value = '';
            }
        });

        document.getElementById('donationForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleDonation();
        });

        document.getElementById('startDonationScanBtn').addEventListener('click', () => {
            this.startScanner('donation');
        });

        document.getElementById('stopDonationScanBtn').addEventListener('click', () => {
            this.stopScanner();
        });

        document.getElementById('participantSearch').addEventListener('input', (e) => {
            this.filterParticipants(e.target.value);
        });

        document.getElementById('exportExcelBtn').addEventListener('click', () => {
            this.exportToExcel();
        });

        document.getElementById('exportDonorsBtn').addEventListener('click', () => {
            this.exportDonors();
        });

        document.getElementById('startLotteryBtn').addEventListener('click', () => {
            this.startLottery();
        });

        document.getElementById('addParticipantForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addParticipant();
        });

        document.getElementById('importBtn').addEventListener('click', () => {
            this.importFromExcel();
        });

        document.getElementById('syncBtn').addEventListener('click', () => {
            this.syncData();
        });

        document.getElementById('importFile').addEventListener('change', (e) => {
            this.selectedFile = e.target.files[0];
        });

        window.addEventListener('online', () => this.updateConnectionStatus(true));
        window.addEventListener('offline', () => this.updateConnectionStatus(false));
    }

    handleLogin() {
        const role = document.getElementById('userRole').value;
        const password = document.getElementById('password').value;

        if (password === CONFIG.AUTH[role]) {
            this.currentUser = { role };
            localStorage.setItem('userRole', role);
            this.showMainApp();
            this.loadParticipants();
            this.startAutoSync();
        } else {
            this.showNotification('Невірний пароль', 'error');
        }
    }

    handleLogout() {
        this.currentUser = null;
        localStorage.removeItem('userRole');
        this.stopAutoSync();
        this.showLoginScreen();
    }

    checkAuthState() {
        const savedRole = localStorage.getItem('userRole');
        if (savedRole) {
            this.currentUser = { role: savedRole };
            this.showMainApp();
            this.loadParticipants();
            this.startAutoSync();
        }
    }

    showMainApp() {
        document.getElementById('loginScreen').classList.remove('active');
        document.getElementById('mainApp').classList.add('active');

        document.getElementById('currentUser').textContent =
            this.currentUser.role === 'admin' ? 'Адміністратор' : 'Хостес';

        if (this.currentUser.role === 'admin') {
            document.getElementById('mainApp').classList.add('is-admin');
        } else {
            document.getElementById('mainApp').classList.remove('is-admin');
        }
    }

    showLoginScreen() {
        document.getElementById('loginScreen').classList.add('active');
        document.getElementById('mainApp').classList.remove('active');
        document.getElementById('password').value = '';
    }

    switchTab(tabName) {
        this.stopScanner();

        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${tabName}Tab`);
        });

        if (tabName === 'participants') {
            this.updateParticipantsTable();
            this.updateStatistics();
        } else if (tabName === 'lottery') {
            this.updateLotteryInfo();
        }
    }

    async loadParticipants() {
        try {
            this.participants = await api.getParticipants();
            this.updateStatistics();
            this.showNotification('Дані завантажено', 'success');
        } catch (error) {
            this.showNotification('Помилка завантаження даних', 'error');
            console.error('Load error:', error);
        }
    }

    async syncData() {
        const syncBtn = document.getElementById('syncBtn');
        syncBtn.disabled = true;

        try {
            await this.loadParticipants();
            document.getElementById('lastSync').textContent =
                `Остання синхронізація: ${new Date().toLocaleTimeString()}`;
            this.showNotification('Синхронізовано успішно', 'success');
        } catch (error) {
            this.showNotification('Помилка синхронізації', 'error');
        } finally {
            syncBtn.disabled = false;
        }
    }

    startAutoSync() {
        this.syncInterval = setInterval(() => {
            this.loadParticipants();
        }, CONFIG.SYNC_INTERVAL);
    }

    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    async handleCheckIn(qrCode) {
        try {
            await api.checkIn(qrCode);
            this.showNotification(`✓ ${qrCode} успішно зареєстрований`, 'success');
            this.loadParticipants();
        } catch (error) {
            this.showNotification(error.message || 'Помилка реєстрації', 'error');
        }
    }

    startScanner(mode = 'checkin') {
        this.currentScannerMode = mode;

        let readerId, startBtnId, stopBtnId;
        if (mode === 'donation') {
            readerId = 'donationQrReader';
            startBtnId = 'startDonationScanBtn';
            stopBtnId = 'stopDonationScanBtn';
        } else {
            readerId = 'qrReader';
            startBtnId = 'startScanBtn';
            stopBtnId = 'stopScanBtn';
        }

        const startBtn = document.getElementById(startBtnId);
        const stopBtn = document.getElementById(stopBtnId);

        startBtn.style.display = 'none';
        stopBtn.style.display = 'inline-block';

        if (this.scanner && this.scanner.isScanning) {
            this.scanner.stop().then(() => {
                this.initializeNewScanner(readerId, mode);
            }).catch(() => {
                this.initializeNewScanner(readerId, mode);
            });
        } else {
            this.initializeNewScanner(readerId, mode);
        }
    }

    initializeNewScanner(readerId, mode) {
        this.scanner = new Html5Qrcode(readerId);

        this.scanner.start(
            { facingMode: "environment" },
            CONFIG.SCANNER,
            (decodedText) => {
                if (mode === 'donation') {
                    document.getElementById('donationQrCode').value = decodedText;
                    document.getElementById('donationAmount').focus();
                } else {
                    this.handleCheckIn(decodedText);
                }
                this.stopScanner();
            },
            (errorMessage) => {
            }
        ).catch((err) => {
            console.error("Scanner error:", err);
            this.showNotification("Помилка камери", 'error');
            this.stopScanner();
        });
    }

    stopScanner() {
        const mode = this.currentScannerMode || 'checkin';

        if (this.scanner && this.scanner.isScanning) {
            this.scanner.stop().then(() => {
                this.scanner = null;
            }).catch(() => {
                this.scanner = null;
            });
        } else if (this.scanner) {
            this.scanner = null;
        }

        document.getElementById('startScanBtn').style.display = 'inline-block';
        document.getElementById('stopScanBtn').style.display = 'none';
        document.getElementById('startDonationScanBtn').style.display = 'inline-block';
        document.getElementById('stopDonationScanBtn').style.display = 'none';

        this.currentScannerMode = null;
    }

    async handleDonation() {
        const qrCode = document.getElementById('donationQrCode').value.trim();
        const amount = parseFloat(document.getElementById('donationAmount').value);

        if (!qrCode || !amount || amount <= 0) {
            this.showNotification('Заповніть всі поля коректно', 'error');
            return;
        }

        try {
            await api.addDonation(qrCode, amount);
            this.showNotification(`✓ Донат ${amount} грн додано`, 'success');
            document.getElementById('donationForm').reset();
            this.loadParticipants();
        } catch (error) {
            this.showNotification(error.message || 'Помилка додавання донату', 'error');
        }
    }

    updateParticipantsTable() {
        const tbody = document.getElementById('participantsTableBody');
        tbody.innerHTML = this.participants.map(p => `
            <tr>
                <td>${p.qrCode}</td>
                <td>${p.name}</td>
                <td>${p.surname}</td>
                <td>${p.visited ? '✓' : '-'}</td>
                <td>${p.donation || 0}</td>
            </tr>
        `).join('');
    }

    filterParticipants(searchTerm) {
        const rows = document.querySelectorAll('#participantsTableBody tr');
        const term = searchTerm.toLowerCase();

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(term) ? '' : 'none';
        });
    }

    updateStatistics() {
        const stats = {
            total: this.participants.length,
            present: this.participants.filter(p => p.visited).length,
            totalDonations: this.participants.reduce((sum, p) => sum + (p.donation || 0), 0),
            bigDonors: this.participants.filter(p => p.donation >= CONFIG.LOTTERY.minimumDonation).length
        };

        document.getElementById('totalParticipants').textContent = stats.total;
        document.getElementById('presentParticipants').textContent = stats.present;
        document.getElementById('totalDonations').textContent = `${stats.totalDonations.toFixed(0)}₴`;
        document.getElementById('bigDonors').textContent = stats.bigDonors;
    }

    exportToExcel() {
        const data = this.participants.map(p => ({
            'QR-код': p.qrCode,
            'Ім\'я': p.name,
            'Прізвище': p.surname,
            'Присутність': p.visited ? 'Так' : 'Ні',
            'Донат (грн)': p.donation || 0
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Учасники");

        const date = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `conference_${date}.xlsx`);

        this.showNotification('Файл експортовано', 'success');
    }

    exportDonors() {
        const donors = this.participants.filter(p => p.donation >= CONFIG.LOTTERY.minimumDonation);

        const data = donors.map(p => ({
            'QR-код': p.qrCode,
            'Ім\'я': p.name,
            'Прізвище': p.surname,
            'Донат (грн)': p.donation
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Донори 500+");

        const date = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `donors_500plus_${date}.xlsx`);

        this.showNotification('Список донорів експортовано', 'success');
    }

    importFromExcel() {
        if (!this.selectedFile) {
            this.showNotification('Виберіть файл для імпорту', 'warning');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                this.participants = jsonData.map(row => ({
                    qrCode: row['QR-код'] || row.qrCode || '',
                    name: row['Ім\'я'] || row.name || '',
                    surname: row['Прізвище'] || row.surname || '',
                    visited: row['Присутність'] === 'Так' || row.visited || false,
                    donation: parseFloat(row['Донат (грн)'] || row.donation || 0)
                }));

                this.updateStatistics();
                this.updateParticipantsTable();
                this.showNotification('Дані імпортовано успішно', 'success');

                document.getElementById('importFile').value = '';
                this.selectedFile = null;
            } catch (error) {
                this.showNotification('Помилка імпорту файлу', 'error');
                console.error('Import error:', error);
            }
        };
        reader.readAsArrayBuffer(this.selectedFile);
    }

    async addParticipant() {
        const qrCode = document.getElementById('newQrCode').value.trim();
        const name = document.getElementById('newName').value.trim();
        const surname = document.getElementById('newSurname').value.trim();

        if (!qrCode || !name || !surname) {
            this.showNotification('Заповніть всі поля', 'error');
            return;
        }

        if (this.participants.find(p => p.qrCode === qrCode)) {
            this.showNotification('Учасник з таким QR-кодом вже існує', 'error');
            return;
        }

        this.participants.push({
            qrCode,
            name,
            surname,
            visited: false,
            donation: 0
        });

        document.getElementById('addParticipantForm').reset();
        this.updateStatistics();
        this.showNotification('Учасника додано', 'success');
    }

    updateLotteryInfo() {
        const eligible = this.participants.filter(p => p.donation >= CONFIG.LOTTERY.minimumDonation);
        document.getElementById('eligibleCount').textContent = eligible.length;

        const totalDonations = eligible.reduce((sum, p) => sum + (p.donation || 0), 0);
        const totalDonationsElement = document.getElementById('totalDonationsLottery');
        if (totalDonationsElement) {
            totalDonationsElement.textContent = totalDonations.toFixed(0) + '₴';
        }

        const maxWinnersElement = document.getElementById('maxWinners');
        if (maxWinnersElement) {
            maxWinnersElement.textContent = eligible.length;
        }
    }

    startLottery() {
        const eligible = this.participants.filter(p => p.donation >= CONFIG.LOTTERY.minimumDonation);
        const count = parseInt(document.getElementById('winnersCount').value);

        if (!count || count < 1) {
            this.showNotification('Введіть кількість переможців', 'warning');
            return;
        }

        if (eligible.length === 0) {
            this.showNotification('Немає учасників з донатом ≥ 500 грн', 'error');
            return;
        }

        if (count > eligible.length) {
            this.showNotification(`Максимум переможців: ${eligible.length}`, 'warning');
            return;
        }

        const winners = [];
        const tempEligible = [...eligible];

        for (let i = 0; i < count; i++) {
            const randomIndex = Math.floor(Math.random() * tempEligible.length);
            winners.push(tempEligible[randomIndex]);
            tempEligible.splice(randomIndex, 1);
        }

        this.showEnhancedLottery(eligible, winners);
    }

    showEnhancedLottery(eligible, winners) {
        const modal = document.getElementById('lotteryModal');
        const container = document.getElementById('lotteryAnimation');

        container.innerHTML = '';

        modal.classList.add('active');

        const lottery = new LotteryAnimation(container, eligible, winners);
        lottery.start();
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        container.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, CONFIG.UI.notificationDuration);
    }

    updateConnectionStatus(isOnline) {
        const indicator = document.getElementById('statusIndicator');
        const text = document.getElementById('statusText');

        if (isOnline) {
            indicator.classList.remove('offline');
            text.textContent = 'Онлайн';
            this.showNotification('З\'єднання відновлено', 'success');
        } else {
            indicator.classList.add('offline');
            text.textContent = 'Офлайн';
            this.showNotification('Відсутнє з\'єднання', 'warning');
        }
    }
}

const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100%); }
    }
    
    .winner-name {
        animation: fadeIn 0.5s ease;
    }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', () => {
    window.app = new ConferenceApp();
});

window.closeLottery = function() {
    document.getElementById('lotteryModal').classList.remove('active');
    if (window.app) {
        window.app.showNotification('Розіграш завершено!', 'success');
    }
}