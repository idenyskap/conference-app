class LotteryAnimation {
    constructor(container, eligible, winners) {
        this.container = container;
        this.eligible = eligible;
        this.winners = winners;
        this.isRevealed = false;
    }

    start() {
        const winnerCount = this.winners.length;

        if (winnerCount === 1) {
            this.showSingleWinnerAnimation();
        } else if (winnerCount >= 2 && winnerCount <= 5) {
            this.showMultipleWinnersAnimation();
        } else if (winnerCount >= 6) {
            this.showManyWinnersAnimation();
        }
    }

    async showSingleWinnerAnimation() {
        this.container.innerHTML = `
            <button class="lottery-close-btn" onclick="closeLottery()">✕</button>
            
            <div class="lottery-single-winner">
                <h2 class="lottery-title">🎯 Розіграш призу</h2>
                
                <div class="lottery-main-stage">
                    <div class="names-roller-container">
                        ${this.createContinuousScroll()}
                    </div>
                    
                    <div class="mystery-card" id="mysteryCard">
                        <div class="mystery-front">
                            <div class="mystery-icon">❓</div>
                        </div>
                        <div class="mystery-back">
                            <div class="winner-reveal">
                                <div class="winner-crown">👑</div>
                                <div class="winner-name-big">${this.winners[0].name}</div>
                                <div class="winner-surname-big">${this.winners[0].surname}</div>
                                <div class="winner-donation-info">${this.winners[0].donation} грн</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="action-area">
                    <button id="revealBtn" class="reveal-button">Показати переможця!</button>
                    <button id="completeBtn" class="complete-button" style="display: none;" onclick="closeLottery()">Завершити розіграш</button>
                </div>
            </div>
            
            ${this.createConfetti()}
        `;

        this.startScrolling();

        const revealBtn = document.getElementById('revealBtn');

        const revealWinner = () => {
            this.revealSingleWinner();
            revealBtn.style.display = 'none';
            document.getElementById('completeBtn').style.display = 'inline-block';
        };

        revealBtn.addEventListener('click', revealWinner);

        setTimeout(revealWinner, 5000);
    }

    revealSingleWinner() {
        const card = document.getElementById('mysteryCard');
        const roller = document.querySelector('.names-roller');

        if (roller) roller.style.animationPlayState = 'paused';
        if (card) card.classList.add('revealed');

        this.isRevealed = true;
        this.triggerConfetti();
    }

    async showMultipleWinnersAnimation() {
        this.container.innerHTML = `
            <button class="lottery-close-btn" onclick="closeLottery()">✕</button>
            
            <div class="lottery-multiple-winners">
                <h2 class="lottery-title">🎯 Розіграш призів</h2>
                
                <div class="lottery-stage-multiple">
                    ${this.createBackgroundScroll()}
                    
                    <div class="mystery-cards-grid">
                        ${this.winners.map((winner, index) => `
                            <div class="mystery-card-multi" data-index="${index}">
                                <div class="card-flipper">
                                    <div class="card-front-multi">
                                        <div class="card-number">${index + 1}</div>
                                        <div class="card-question">❓</div>
                                    </div>
                                    <div class="card-back-multi">
                                        <div class="mini-crown">👑</div>
                                        <div class="winner-name-multi">${winner.name}</div>
                                        <div class="winner-surname-multi">${winner.surname}</div>
                                        <div class="winner-amount-multi">${winner.donation} грн</div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="action-area">
                    <button id="revealBtn" class="reveal-button">Показати переможців!</button>
                    <button id="completeBtn" class="complete-button" style="display: none;" onclick="closeLottery()">Завершити розіграш</button>
                </div>
            </div>
            
            ${this.createConfetti()}
        `;

        const revealBtn = document.getElementById('revealBtn');

        const revealWinners = () => {
            this.revealMultipleWinners();
            revealBtn.style.display = 'none';
            document.getElementById('completeBtn').style.display = 'inline-block';
        };

        revealBtn.addEventListener('click', revealWinners);

        setTimeout(revealWinners, 5000);
    }

    revealMultipleWinners() {
        const cards = document.querySelectorAll('.mystery-card-multi');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('flipped');
            }, index * 300);
        });

        this.isRevealed = true;
        setTimeout(() => this.triggerConfetti(), 500);
    }

    async showManyWinnersAnimation() {
        this.container.innerHTML = `
            <button class="lottery-close-btn" onclick="closeLottery()">✕</button>
            
            <div class="lottery-many-winners">
                <h2 class="lottery-title">🎯 Розіграш призів</h2>
                
                <div class="lottery-stage-many">
                    <div class="carousel-container" id="carouselContainer">
                        <div class="carousel-track">
                            ${this.createCarouselItems()}
                            ${this.createCarouselItems()}
                        </div>
                    </div>
                    
                    <div class="countdown-display" id="countdownDisplay">
                        <div class="countdown-number">3</div>
                        <div class="countdown-label">Підготовка...</div>
                    </div>
                </div>
                
                <div class="action-area" id="actionArea">
                    <button id="revealBtn" class="reveal-button">Показати переможців!</button>
                    <button id="completeBtn" class="complete-button" style="display: none;" onclick="closeLottery()">Завершити розіграш</button>
                </div>
                
                <div class="winners-list-container" id="winnersList" style="display: none;">
                    <h3>🏆 Переможці:</h3>
                    <div class="winners-grid">
                        ${this.winners.map((winner, index) => `
                            <div class="winner-card-list">
                                <div class="winner-position">${index + 1}</div>
                                <div class="winner-info">
                                    <strong>${winner.name} ${winner.surname}</strong>
                                    <div class="winner-donation">${winner.donation} грн</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            ${this.createConfetti()}
        `;

        const revealBtn = document.getElementById('revealBtn');

        const revealWinners = () => {
            this.startCountdown();
            revealBtn.style.display = 'none';
        };

        revealBtn.addEventListener('click', revealWinners);

        setTimeout(revealWinners, 3000);
    }

    startCountdown() {
        const display = document.getElementById('countdownDisplay');
        let count = 3;

        const countInterval = setInterval(() => {
            if (count > 0) {
                display.innerHTML = `
                    <div class="countdown-number" style="animation: countdownPulse 1s ease">${count}</div>
                    <div class="countdown-label">Розкриваємо...</div>
                `;
                count--;
            } else {
                clearInterval(countInterval);
                this.showWinnersList();
            }
        }, 1000);
    }

    showWinnersList() {
        const carousel = document.getElementById('carouselContainer');
        const countdown = document.getElementById('countdownDisplay');
        const winnersList = document.getElementById('winnersList');
        const completeBtn = document.getElementById('completeBtn');

        if (carousel) carousel.style.display = 'none';
        if (countdown) countdown.style.display = 'none';
        if (winnersList) winnersList.style.display = 'block';
        if (completeBtn) completeBtn.style.display = 'inline-block';

        this.triggerConfetti();
    }

    createContinuousScroll() {
        const names = [...this.eligible, ...this.eligible];
        return `
            <div class="names-roller">
                ${names.map(p => `
                    <div class="scroll-name-item">${p.name} ${p.surname}</div>
                `).join('')}
            </div>
        `;
    }

    startScrolling() {
        const roller = document.querySelector('.names-roller');
        if (roller) {
            roller.style.animation = 'rollNames 2s linear infinite';
        }
    }

    createBackgroundScroll() {
        const names = this.eligible.map(p => `${p.name} ${p.surname}`);
        const lines = Array(5).fill(names).flat();

        return `
            <div class="names-background-scroll">
                ${Array(3).fill(0).map((_, i) => `
                    <div class="bg-scroll-line ${i % 2 ? 'reverse' : ''}">
                        ${lines.map(name => `<span class="bg-name">${name}</span>`).join('')}
                    </div>
                `).join('')}
            </div>
        `;
    }

    createCarouselItems() {
        return this.eligible.map(p => `
            <div class="carousel-item">
                <div class="carousel-name">${p.name}</div>
                <div class="carousel-surname">${p.surname}</div>
            </div>
        `).join('');
    }

    createConfetti() {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#FFD93D', '#6BCF7F'];
        const pieces = Array.from({ length: 50 }, (_, i) => {
            const left = Math.random() * 100;
            const delay = Math.random() * 5;
            const duration = 3 + Math.random() * 2;
            const color = colors[Math.floor(Math.random() * colors.length)];

            return `
                <div class="confetti-piece" style="
                    left: ${left}%;
                    animation-delay: ${delay}s;
                    animation-duration: ${duration}s;
                    background: ${color};
                "></div>
            `;
        });

        return `<div class="confetti-wrapper" style="display: none;">${pieces.join('')}</div>`;
    }

    triggerConfetti() {
        const confetti = document.querySelector('.confetti-wrapper');
        if (confetti) {
            confetti.style.display = 'block';
            setTimeout(() => {
                confetti.style.display = 'none';
            }, 5000);
        }
    }
}