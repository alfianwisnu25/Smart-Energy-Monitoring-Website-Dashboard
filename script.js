// Variabel Global
let TARIF_LISTRIK = 1444.70; 
let BATAS_ALARM = 900; 

// DOM Elements
const elVoltage = document.getElementById('val-voltage');
const elCurrent = document.getElementById('val-current');
const elPower = document.getElementById('val-power');
const elPf = document.getElementById('val-pf');
const elEnergy = document.getElementById('val-energy');
const elCost = document.getElementById('val-cost');
const elQuality = document.getElementById('val-quality');
const iconQuality = document.getElementById('icon-quality');

// --- Logika Menu Sidebar (Navigasi Tab) ---
const navItems = document.querySelectorAll('.nav-item');
const viewSections = document.querySelectorAll('.view-section');

navItems.forEach(item => {
    item.addEventListener('click', function() {
        navItems.forEach(nav => nav.classList.remove('active'));
        this.classList.add('active');
        
        viewSections.forEach(section => section.classList.remove('active'));
        const targetId = this.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');
    });
});

// Setup Jam Realtime
function updateClock() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    document.getElementById('realtime-clock').innerText = now.toLocaleDateString('id-ID', options);
}
setInterval(updateClock, 1000);
updateClock();

// Setup Dark Mode
const darkModeBtn = document.getElementById('dark-mode-toggle');
darkModeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const icon = darkModeBtn.querySelector('i');
    if(document.body.classList.contains('dark-mode')) {
        icon.classList.replace('fa-moon', 'fa-sun');
    } else {
        icon.classList.replace('fa-sun', 'fa-moon');
    }
});

// Konfigurasi Dasar Chart.js
Chart.defaults.color = '#888';
Chart.defaults.font.family = 'Poppins';

// 1. Line Chart (Dashboard)
const ctxEnergy = document.getElementById('energyChart').getContext('2d');
const energyChart = new Chart(ctxEnergy, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Daya (Watt)',
            data: [],
            borderColor: '#5BBE8A',
            backgroundColor: 'rgba(91, 190, 138, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } },
        plugins: { legend: { display: false } }
    }
});

// 2. Doughnut Chart (Dashboard)
const ctxDist = document.getElementById('distributionChart').getContext('2d');
const distributionChart = new Chart(ctxDist, {
    type: 'doughnut',
    data: {
        labels: ['Beban Ringan', 'Beban Sedang', 'Beban Tinggi'],
        datasets: [{
            data: [40, 35, 25],
            backgroundColor: ['#5BBE8A', '#ff9800', '#f44336'],
            borderWidth: 0
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: { legend: { position: 'bottom' } }
    }
});

// 3. Bar Chart (Monitoring - Baru)
const ctxWeekly = document.getElementById('weeklyChart').getContext('2d');
const weeklyChart = new Chart(ctxWeekly, {
    type: 'bar',
    data: {
        labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
        datasets: [{
            label: 'Energi (kWh)',
            data: [3.2, 4.1, 3.8, 5.2, 4.8, 6.1, 5.5],
            backgroundColor: '#5BBE8A',
            borderRadius: 6
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } },
        plugins: { legend: { display: false } }
    }
});

// --- Fitur Tabel Riwayat Data (Baru) ---
function generateDummyHistory() {
    const tbody = document.getElementById('history-tbody');
    tbody.innerHTML = ''; 
    
    let time = new Date();
    let currentEnergy = 12.450;

    for (let i = 0; i < 10; i++) {
        time.setSeconds(time.getSeconds() - 5);
        const timeStr = time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second:'2-digit' });
        
        const volt = (220 + (Math.random() * 2 - 1)).toFixed(1);
        const amp = (1.5 + (Math.random() * 0.4)).toFixed(2);
        const pwr = (volt * amp).toFixed(0);
        currentEnergy -= 0.001; 
        
        let statusBadge = pwr > 500 ? `<span class="badge badge-warning">Tinggi</span>` : `<span class="badge badge-normal">Normal</span>`;

        const row = `
            <tr>
                <td>${timeStr}</td>
                <td>${volt}</td>
                <td>${amp}</td>
                <td>${pwr}</td>
                <td>${currentEnergy.toFixed(3)}</td>
                <td>${statusBadge}</td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    }
}
generateDummyHistory();
setInterval(generateDummyHistory, 10000); // Update tabel tiap 10 detik

// --- Fitur Pengaturan Sistem (Baru) ---
document.getElementById('btn-save-sys').addEventListener('click', () => {
    const tarifInput = document.getElementById('input-tarif').value;
    const alarmInput = document.getElementById('input-alarm').value;
    
    TARIF_LISTRIK = parseFloat(tarifInput);
    BATAS_ALARM = parseInt(alarmInput);
    
    const currentEnergy = parseFloat(elEnergy.innerText);
    if(!isNaN(currentEnergy)) {
        elCost.innerText = formatRupiah(currentEnergy * TARIF_LISTRIK);
    }
    
    showNotification('Pengaturan sistem berhasil disimpan!');
});

// Format Rupiah & Notifikasi
const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
};

function showNotification(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// --- FUNGSI UTAMA UPDATE DATA ---
function updateDashboard(data) {
    elVoltage.innerText = data.voltage.toFixed(1);
    elCurrent.innerText = data.current.toFixed(2);
    elPower.innerText = data.power.toFixed(0);
    elPf.innerText = data.pf.toFixed(2);
    elEnergy.innerText = data.energy.toFixed(2);
    
    elCost.innerText = formatRupiah(data.energy * TARIF_LISTRIK);

    if (data.pf >= 0.9) {
        elQuality.innerText = "Baik"; elQuality.style.color = "#5BBE8A";
        iconQuality.className = "fa-solid fa-check-circle"; iconQuality.style.color = "#5BBE8A";
    } else if (data.pf >= 0.8) {
        elQuality.innerText = "Sedang"; elQuality.style.color = "#ff9800";
        iconQuality.className = "fa-solid fa-exclamation-circle"; iconQuality.style.color = "#ff9800";
    } else {
        elQuality.innerText = "Buruk"; elQuality.style.color = "#f44336";
        iconQuality.className = "fa-solid fa-times-circle"; iconQuality.style.color = "#f44336";
    }

    if (data.power > BATAS_ALARM) {
        showNotification(`Peringatan: Daya melonjak ke ${data.power.toFixed(0)} W!`);
    }

    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second:'2-digit' });
    energyChart.data.labels.push(nowTime);
    energyChart.data.datasets[0].data.push(data.power);

    if (energyChart.data.labels.length > 10) {
        energyChart.data.labels.shift();
        energyChart.data.datasets[0].data.shift();
    }
    energyChart.update();
}

// Simulasi Data Masuk (Bisa diganti koneksi MQTT nanti)
let dummyEnergyAccumulator = 12.5;
setInterval(() => {
    const simulatedData = {
        voltage: 220 + (Math.random() * 4 - 2),
        current: 1.5 + (Math.random() * 0.5 - 0.2),
        power: 330 + (Math.random() * 650),
        pf: 0.95 - (Math.random() * 0.1),
        energy: dummyEnergyAccumulator += 0.001
    };
    updateDashboard(simulatedData);
}, 5000);