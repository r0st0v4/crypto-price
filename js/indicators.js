/**
 * Bitcoin Technical Indicators API
 * Clean JavaScript API for fetching and calculating Bitcoin technical indicators
 * Data source: Binance API (free, unlimited)
 * Timeframe: Daily (1d)
 */

const BitcoinIndicators = (() => {
    const BINANCE_API = 'https://api.binance.com/api/v3';
    const SYMBOL = 'BTCUSDT';
    const INTERVAL = '1d';
    const CANDLES_LIMIT = 200;

    // ============================================
    // DATA FETCHING
    // ============================================

    /**
     * Fetch historical OHLC data from Binance
     * @returns {Promise<Array>} Array of candle objects with {timestamp, open, high, low, close, volume}
     */
    async function fetchKlines() {
        const url = `${BINANCE_API}/klines?symbol=${SYMBOL}&interval=${INTERVAL}&limit=${CANDLES_LIMIT}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch klines from Binance');

        const data = await response.json();
        return data.map(candle => ({
            timestamp: candle[0],
            open: parseFloat(candle[1]),
            high: parseFloat(candle[2]),
            low: parseFloat(candle[3]),
            close: parseFloat(candle[4]),
            volume: parseFloat(candle[5])
        }));
    }

    // ============================================
    // INDICATOR CALCULATIONS
    // ============================================

    /**
     * Calculate RSI (Relative Strength Index)
     * @param {Array<number>} closes - Array of closing prices
     * @param {number} period - RSI period (default: 14)
     * @returns {number} RSI value (0-100)
     */
    function calculateRSI(closes, period = 14) {
        if (closes.length < period + 1) return null;

        let gains = 0, losses = 0;

        for (let i = 1; i <= period; i++) {
            const change = closes[i] - closes[i - 1];
            if (change > 0) gains += change;
            else losses -= change;
        }

        let avgGain = gains / period;
        let avgLoss = losses / period;

        for (let i = period + 1; i < closes.length; i++) {
            const change = closes[i] - closes[i - 1];
            const gain = change > 0 ? change : 0;
            const loss = change < 0 ? -change : 0;

            avgGain = (avgGain * (period - 1) + gain) / period;
            avgLoss = (avgLoss * (period - 1) + loss) / period;
        }

        if (avgLoss === 0) return 100;
        return 100 - (100 / (1 + avgGain / avgLoss));
    }

    /**
     * Calculate EMA (Exponential Moving Average)
     * @param {Array<number>} closes - Array of closing prices
     * @param {number} period - EMA period
     * @returns {number} EMA value
     */
    function calculateEMA(closes, period) {
        if (closes.length < period) return null;

        const k = 2 / (period + 1);
        let ema = closes.slice(0, period).reduce((a, b) => a + b) / period;

        for (let i = period; i < closes.length; i++) {
            ema = closes[i] * k + ema * (1 - k);
        }

        return ema;
    }

    /**
     * Calculate MACD (Moving Average Convergence Divergence)
     * @param {Array<number>} closes - Array of closing prices
     * @param {number} fastPeriod - Fast EMA period (default: 12)
     * @param {number} slowPeriod - Slow EMA period (default: 26)
     * @param {number} signalPeriod - Signal line period (default: 9)
     * @returns {Object} {macd, signal, histogram}
     */
    function calculateMACD(closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
        if (closes.length < slowPeriod + signalPeriod) return null;

        const fastK = 2 / (fastPeriod + 1);
        const slowK = 2 / (slowPeriod + 1);

        let fastEMA = closes.slice(0, fastPeriod).reduce((a, b) => a + b) / fastPeriod;
        let slowEMA = closes.slice(0, slowPeriod).reduce((a, b) => a + b) / slowPeriod;

        const macdLine = [];

        for (let i = Math.max(fastPeriod, slowPeriod); i < closes.length; i++) {
            fastEMA = closes[i] * fastK + fastEMA * (1 - fastK);
            slowEMA = closes[i] * slowK + slowEMA * (1 - slowK);
            macdLine.push(fastEMA - slowEMA);
        }

        const signalK = 2 / (signalPeriod + 1);
        let signalEMA = macdLine.slice(0, signalPeriod).reduce((a, b) => a + b) / signalPeriod;

        for (let i = signalPeriod; i < macdLine.length; i++) {
            signalEMA = macdLine[i] * signalK + signalEMA * (1 - signalK);
        }

        const currentMACD = macdLine[macdLine.length - 1];

        return {
            macd: currentMACD,
            signal: signalEMA,
            histogram: currentMACD - signalEMA
        };
    }

    /**
     * Calculate Bollinger Bands
     * @param {Array<number>} closes - Array of closing prices
     * @param {number} period - Period (default: 20)
     * @param {number} stdDev - Standard deviation multiplier (default: 2)
     * @returns {Object} {upper, middle, lower}
     */
    function calculateBollingerBands(closes, period = 20, stdDev = 2) {
        if (closes.length < period) return null;

        const recentCloses = closes.slice(-period);
        const sma = recentCloses.reduce((a, b) => a + b) / period;

        const squaredDiffs = recentCloses.map(close => Math.pow(close - sma, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b) / period;
        const standardDeviation = Math.sqrt(variance);

        return {
            upper: sma + (standardDeviation * stdDev),
            middle: sma,
            lower: sma - (standardDeviation * stdDev)
        };
    }

    /**
     * Calculate Bull Market Indicator (composite score 0-100)
     * @param {number} rsi - RSI value
     * @param {Object} macd - MACD object
     * @param {number} ema50 - EMA 50 value
     * @param {number} ema200 - EMA 200 value
     * @param {number} currentPrice - Current BTC price
     * @returns {Object} {score, phase, phaseColor, signals}
     */
    function calculateBullMarketIndicator(rsi, macd, ema50, ema200, currentPrice) {
        let score = 0;
        const signals = [];

        // RSI between 40-70 (healthy uptrend)
        if (rsi >= 40 && rsi <= 70) {
            score += 20;
            signals.push('RSI sain');
        } else if (rsi > 70) {
            signals.push('RSI surachat');
        } else {
            signals.push('RSI faible');
        }

        // MACD histogram positive
        if (macd.histogram > 0) {
            score += 25;
            signals.push('MACD positif');
        } else {
            signals.push('MACD négatif');
        }

        // Golden Cross
        if (ema50 > ema200) {
            score += 30;
            signals.push('Golden Cross');
        } else {
            signals.push('Death Cross');
        }

        // Price above EMA50
        if (currentPrice > ema50) {
            score += 15;
            signals.push('Prix > EMA50');
        }

        // Price above EMA200
        if (currentPrice > ema200) {
            score += 10;
            signals.push('Prix > EMA200');
        }

        // Determine phase
        let phase, phaseColor;
        if (score >= 80) {
            phase = 'Bull Market Fort 🚀';
            phaseColor = 'up';
        } else if (score >= 60) {
            phase = 'Bull Market Modéré 📈';
            phaseColor = 'up';
        } else if (score >= 40) {
            phase = 'Neutre / Consolidation ⚖️';
            phaseColor = 'neutral';
        } else if (score >= 20) {
            phase = 'Bear Market Modéré 📉';
            phaseColor = 'down';
        } else {
            phase = 'Bear Market Fort 🔻';
            phaseColor = 'down';
        }

        return { score, phase, phaseColor, signals };
    }

    // ============================================
    // PUBLIC API
    // ============================================

    /**
     * Get all Bitcoin indicators
     * @returns {Promise<Object>} Complete indicators data
     */
    async function getAllIndicators() {
        const klines = await fetchKlines();
        const closes = klines.map(k => k.close);
        const currentPrice = closes[closes.length - 1];

        const rsi = calculateRSI(closes, 14);
        const macd = calculateMACD(closes, 12, 26, 9);
        const bollinger = calculateBollingerBands(closes, 20, 2);
        const ema50 = calculateEMA(closes, 50);
        const ema200 = calculateEMA(closes, 200);
        const bullMarket = calculateBullMarketIndicator(rsi, macd, ema50, ema200, currentPrice);

        // Calculate Bollinger spread category
        const spread = bollinger.upper - bollinger.lower;
        let spreadCategory;
        if (spread > 20000) spreadCategory = 'Élevé (Forte volatilité)';
        else if (spread < 10000) spreadCategory = 'Faible (Consolidation)';
        else spreadCategory = 'Moyen (Volatilité normale)';

        // Determine EMA trend
        let emaTrend;
        if (ema50 > ema200) emaTrend = 'Haussier (Golden Cross)';
        else if (ema50 < ema200) emaTrend = 'Baissier (Death Cross)';
        else emaTrend = 'Neutre';

        return {
            currentPrice,
            timestamp: Date.now(),
            rsi: {
                value: rsi,
                period: 14,
                timeframe: 'Daily'
            },
            macd: {
                macd: macd.macd,
                signal: macd.signal,
                histogram: macd.histogram,
                periods: '12/26/9',
                timeframe: 'Daily'
            },
            bollinger: {
                upper: bollinger.upper,
                middle: bollinger.middle,
                lower: bollinger.lower,
                spread: spread,
                spreadCategory: spreadCategory,
                period: 20,
                timeframe: 'Daily'
            },
            ema: {
                ema50: ema50,
                ema200: ema200,
                trend: emaTrend,
                timeframe: 'Daily'
            },
            bullMarket: {
                score: bullMarket.score,
                phase: bullMarket.phase,
                phaseColor: bullMarket.phaseColor,
                signals: bullMarket.signals
            }
        };
    }

    // Expose public API
    return {
        getAllIndicators,
        // Expose individual calculators if needed
        calculateRSI,
        calculateEMA,
        calculateMACD,
        calculateBollingerBands,
        calculateBullMarketIndicator
    };
})();

// ============================================
// USAGE EXAMPLE
// ============================================

/*
// Get all indicators
const indicators = await BitcoinIndicators.getAllIndicators();

console.log('Current BTC Price:', indicators.currentPrice);
console.log('RSI:', indicators.rsi.value);
console.log('MACD Histogram:', indicators.macd.histogram);
console.log('Bull Market Score:', indicators.bullMarket.score);
console.log('Market Phase:', indicators.bullMarket.phase);

// The data structure returned:
{
    currentPrice: 94523.45,
    timestamp: 1732704000000,
    rsi: { value: 52.3, period: 14, timeframe: 'Daily' },
    macd: { macd: 737.41, signal: 691.84, histogram: 45.57, periods: '12/26/9', timeframe: 'Daily' },
    bollinger: { upper: 107245.99, middle: 93982.23, lower: 80718.46, spread: 26527.53, spreadCategory: 'Élevé (Forte volatilité)', period: 20, timeframe: 'Daily' },
    ema: { ema50: 89234.56, ema200: 87456.23, trend: 'Haussier (Golden Cross)', timeframe: 'Daily' },
    bullMarket: { score: 85, phase: 'Bull Market Fort 🚀', phaseColor: 'up', signals: ['RSI sain', 'MACD positif', 'Golden Cross', 'Prix > EMA50', 'Prix > EMA200'] }
}
*/
