const valueEl = document.getElementById('value');
const statusEl = document.getElementById('status');
const body = document.body;
const orb = document.querySelector('.orb');

async function fetchData() {
    try {
        const response = await fetch('https://api.alternative.me/fng/');
        const data = await response.json();
        const result = data.data[0];

        const value = parseInt(result.value);
        const classification = result.value_classification;

        // Update Text
        valueEl.innerText = value;
        statusEl.innerText = classification;

        // Update Theme
        updateTheme(value);

    } catch (error) {
        console.error('Error fetching data:', error);
        statusEl.innerText = 'Error';
    }
}

function updateTheme(value) {
    // 0 (Extreme Fear) -> 100 (Extreme Greed)

    let color;
    if (value < 25) {
        // Extreme Fear - Deep Red / Purple
        color = '#4a0e0e';
        body.className = 'fear';
    } else if (value < 45) {
        // Fear - Orange/Brown
        color = '#8a4b0e';
        body.className = 'fear';
    } else if (value < 55) {
        // Neutral - Grey/Yellow
        color = '#8a8a0e';
        body.className = '';
    } else if (value < 75) {
        // Greed - Green
        color = '#0e8a4b';
        body.className = 'greed';
    } else {
        // Extreme Greed - Neon Green / Cyan
        color = '#0e8a8a';
        body.className = 'greed';
    }

    document.documentElement.style.setProperty('--orb-color', color);
}

fetchData();
