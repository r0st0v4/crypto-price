const priceElement = document.getElementById('price');
const symbolNameElement = document.getElementById('symbol-name');
const canvas = document.getElementById('chart');
const ctx = canvas.getContext('2d');
const body = document.body;

let width, height;
let priceData = [];
const maxDataPoints = 150;
let ws = null;
let currentSymbol = 'btc';

// Theme Logic
let startPrice = null;

// Get crypto from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const cryptoParam = urlParams.get('crypto');
if (cryptoParam) {
    currentSymbol = cryptoParam;
}

// Update active nav link
document.querySelectorAll('.nav-link[data-crypto]').forEach(link => {
    if (link.dataset.crypto === currentSymbol) {
        link.classList.add('active');
    } else {
        link.classList.remove('active');
    }
});

// Resize canvas
function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}
window.addEventListener('resize', resize);
resize();

function connect(symbol) {
    if (ws) ws.close();

    // Reset data for new symbol
    priceData = [];
    startPrice = null;
    priceElement.innerHTML = 'Loading...';

    const pair = symbol + 'usdt';
    let streamPair = pair;
    if (symbol === 'usdt') streamPair = 'usdcusdt';

    ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streamPair}@trade`);

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        let price = parseFloat(data.p);

        if (startPrice === null) startPrice = price;

        // Update Text
        priceElement.innerHTML = `${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}<span class="currency">USD</span>`;
        document.title = `${symbol.toUpperCase()}: $${price}`;

        // Update Theme
        if (price >= startPrice) {
            body.classList.remove('mortuary');
            body.classList.add('paradise');
        } else {
            body.classList.remove('paradise');
            body.classList.add('mortuary');
        }

        // Update Chart Data
        priceData.push(price);
        if (priceData.length > maxDataPoints) {
            priceData.shift();
            startPrice = priceData[0];
        }
    };
}

// Update symbol name
const names = {
    'btc': 'Bitcoin',
    'eth': 'Ethereum',
    'sol': 'Solana',
    'usdt': 'Tether (USDC Pair)'
};
symbolNameElement.innerText = names[currentSymbol];

// Initial connection
connect(currentSymbol);

// Chart Rendering Loop
function drawChart() {
    ctx.clearRect(0, 0, width, height);

    if (priceData.length < 2) {
        requestAnimationFrame(drawChart);
        return;
    }

    const minPrice = Math.min(...priceData);
    const maxPrice = Math.max(...priceData);
    const range = maxPrice - minPrice || 0.00000001;

    const paddingY = height * 0.3;

    // Get current theme color from CSS variable
    const computedStyle = getComputedStyle(body);
    const themeColor = computedStyle.getPropertyValue('--theme-color').trim();

    ctx.beginPath();
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowBlur = 20;
    ctx.shadowColor = themeColor;

    // Create gradient for fill
    const gradient = ctx.createLinearGradient(0, 0, 0, height);

    const hex2rgba = (hex, alpha = 1) => {
        if (!hex) return `rgba(0,0,0,${alpha})`;
        if (hex.startsWith('#')) {
            const [r, g, b] = hex.match(/\w\w/g).map(x => parseInt(x, 16));
            return `rgba(${r},${g},${b},${alpha})`;
        }
        if (hex.startsWith('rgb')) {
            return hex.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
        }
        return hex;
    };

    gradient.addColorStop(0, hex2rgba(themeColor, 0.2));
    gradient.addColorStop(1, hex2rgba(themeColor, 0));

    for (let i = 0; i < priceData.length; i++) {
        const x = (i / (maxDataPoints - 1)) * width;
        const normalizedY = (priceData[i] - minPrice) / range;
        const y = height - (normalizedY * (height - 2 * paddingY) + paddingY);

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            const prevX = ((i - 1) / (maxDataPoints - 1)) * width;
            const prevNormalizedY = (priceData[i - 1] - minPrice) / range;
            const prevY = height - (prevNormalizedY * (height - 2 * paddingY) + paddingY);

            const cp1x = prevX + (x - prevX) / 2;
            const cp1y = prevY;
            const cp2x = prevX + (x - prevX) / 2;
            const cp2y = y;

            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
        }
    }

    ctx.stroke();

    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    requestAnimationFrame(drawChart);
}

drawChart();
