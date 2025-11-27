/**
 * Indicators UI Controller
 * Handles the rendering of the Bitcoin Indicators page
 */

document.addEventListener('DOMContentLoaded', async () => {
    const loadingOverlay = document.querySelector('.loading-overlay');

    // Initial render
    await updateUI();

    // Update every 5 minutes
    setInterval(updateUI, 5 * 60 * 1000);

    async function updateUI() {
        try {
            const data = await BitcoinIndicators.getAllIndicators();
            renderBentoGrid(data);

            // Hide loading after first render
            if (loadingOverlay && !loadingOverlay.classList.contains('hidden')) {
                loadingOverlay.classList.add('hidden');
            }
        } catch (error) {
            console.error('Failed to update UI:', error);
        }
    }

    function renderBentoGrid(data) {
        const grid = document.querySelector('.bento-grid');
        if (!grid) return;

        grid.innerHTML = `
            ${createBullCard(data.bullMarket, data.currentPrice)}
            ${createCard('RSI (14)', data.rsi.value.toFixed(1), getRsiStatus(data.rsi.value), 'rsi')}
            ${createCard('MACD', data.macd.histogram.toFixed(2), data.macd.histogram > 0 ? 'Positive' : 'Negative', data.macd.histogram > 0 ? 'up' : 'down')}
            ${createCard('Bollinger', data.bollinger.spreadCategory.split(' ')[0], 'Spread', 'neutral')}
            ${createCard('Trend', data.ema.trend.includes('Haussier') ? 'Bullish' : 'Bearish', 'EMA 50/200', data.ema.trend.includes('Haussier') ? 'up' : 'down')}
        `;
    }

    function createBullCard(bullData, currentPrice) {
        const score = bullData.score;
        const phase = bullData.phase.split(' ')[0] + ' ' + bullData.phase.split(' ')[1]; // Keep just "Bull Market" or "Bear Market"
        const emoji = bullData.phase.split(' ').pop(); // Get emoji
        const colorClass = bullData.phaseColor;

        // Calculate circle circumference for progress
        // r=100, circumference = 2 * pi * 100 ≈ 628
        const maxDash = 628;
        const dashOffset = maxDash - (score / 100 * maxDash);

        return `
            <div class="bento-card card-bull ${colorClass}">
                <div class="bull-label">BULL MARKET INDICATOR</div>
                <div class="bull-ring-container">
                    <svg viewBox="0 0 220 220">
                        <circle cx="110" cy="110" r="100" class="ring-bg"></circle>
                        <circle cx="110" cy="110" r="100" class="ring-progress" style="stroke-dashoffset: ${dashOffset}"></circle>
                    </svg>
                    <div class="bull-score">${score}</div>
                </div>
                <div class="bull-info">
                    <div class="bull-phase">${phase} ${emoji}</div>
                    <div class="bull-price">BTC $${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                </div>
            </div>
        `;
    }

    function createCard(title, value, status, statusClass) {
        let statusColor = '';
        if (statusClass === 'up') statusColor = 'text-up';
        if (statusClass === 'down') statusColor = 'text-down';

        // Special handling for RSI status color
        if (statusClass === 'rsi') {
            if (value > 70) statusColor = 'text-down'; // Overbought
            else if (value < 30) statusColor = 'text-up'; // Oversold
            else statusColor = 'text-neutral';
        }

        return `
            <div class="bento-card">
                <div class="card-header">
                    <span class="card-title">${title}</span>
                </div>
                <div class="card-content">
                    <div class="card-value ${statusColor}">${value}</div>
                    <div class="card-status">${status}</div>
                </div>
            </div>
        `;
    }

    function getRsiStatus(value) {
        if (value > 70) return 'Overbought';
        if (value < 30) return 'Oversold';
        return 'Neutral';
    }
});
