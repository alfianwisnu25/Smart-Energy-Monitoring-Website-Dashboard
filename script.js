// ==========================================
// VARIABEL GLOBAL & DOM ELEMENTS
// ==========================================
let TARIF_LISTRIK = 1444.70; 
let BATAS_ALARM = 900; 

const elVoltage = document.getElementById('val-voltage');
const elCurrent = document.getElementById('val-current');
const elPower = document.getElementById('val-power');
const elPf = document.getElementById('val-pf');
const elEnergy = document.getElementById('val-energy');
const elCost = document.getElementById('val-cost');
const elQuality = document.getElementById('val-quality');
const iconQuality = document.getElementById('icon-quality');

const elEfficiency = document.getElementById('val-efficiency');
const barEfficiency = document.getElementById('bar-efficiency');
const elSavings = document.getElementById('val-savings');
const elPeakLoad = document.getElementById('val-peak-load');
const elDailyAvg = document.getElementById('val-daily-avg');
const elEstBill = document.getElementById('val-est-bill');

let peakPower = 0; // Variabel untuk menyimpan rekor daya tertinggi

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

// ==========================================
// INISIALISASI CHART.JS (DATA KOSONG/REAL)
// ==========================================
Chart.defaults.color = '#888';
Chart.defaults.font.family = 'Poppins';

// 1. Line Chart (Dashboard) - Mulai kosong
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

// 2. Doughnut Chart (Dashboard) - Dihitung Realtime
let distDataCount = [0, 0, 0]; // [Ringan, Sedang, Tinggi]
const ctxDist = document.getElementById('distributionChart').getContext('2d');
const distributionChart = new Chart(ctxDist, {
    type: 'doughnut',
    data: {
        labels: ['Beban Ringan (<300W)', 'Beban Sedang (300-600W)', 'Beban Tinggi (>600W)'],
        datasets: [{
            data: distDataCount,
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

// 3. Bar Chart (Monitoring) - Tanpa Database (0)
const ctxWeekly = document.getElementById('weeklyChart').getContext('2d');
const weeklyChart = new Chart(ctxWeekly, {
    type: 'bar',
    data: {
        labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
        datasets: [{
            label: 'Energi (kWh)',
            data: [0, 0, 0, 0, 0, 0, 0], // Dikosongkan karena tidak ada database
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

// ==========================================
// FITUR PENGATURAN & NOTIFIKASI
// ==========================================
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

// ==========================================
// FUNGSI UTAMA: UPDATE DATA DARI MQTT
// ==========================================
function updateDashboard(data) {
    // 1. Update Kartu Angka
    elVoltage.innerText = data.voltage.toFixed(1);
    elCurrent.innerText = data.current.toFixed(2);
    elPower.innerText = data.power.toFixed(0);
    elPf.innerText = data.pf.toFixed(2);
    elEnergy.innerText = data.energy.toFixed(3);
    elCost.innerText = formatRupiah(data.energy * TARIF_LISTRIK);

    // 2. Update Status Power Quality (PF)
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

    // 3. Cek Batas Alarm Daya
    if (data.power > BATAS_ALARM) {
        showNotification(`Peringatan: Daya melonjak ke ${data.power.toFixed(0)} W!`);
    }

    // 4. Update Line Chart (Realtime)
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second:'2-digit' });
    energyChart.data.labels.push(nowTime);
    energyChart.data.datasets[0].data.push(data.power);
    if (energyChart.data.labels.length > 10) {
        energyChart.data.labels.shift();
        energyChart.data.datasets[0].data.shift();
    }
    energyChart.update();

    // 5. Update Doughnut Chart (Distribusi Beban)
    if (data.power < 300) distDataCount[0]++;
    else if (data.power <= 600) distDataCount[1]++;
    else distDataCount[2]++;
    distributionChart.update();

    // 6. Update Tabel Riwayat Data
    updateHistoryTable(data, nowTime);
    // ==========================================
    // 7. UPDATE STATISTIK LANJUTAN & EFISIENSI
    // ==========================================
    
    // a. Efisiensi diambil dari Power Factor (contoh: PF 0.95 = 95%)
    let efisiensi = Math.round(data.pf * 100);
    if (elEfficiency && barEfficiency) {
        elEfficiency.innerText = efisiensi + "%";
        barEfficiency.style.width = efisiensi + "%";
    }

    // b. Total Penghematan (Simulasi: hemat 5% tagihan jika efisiensi kelistrikan >= 90%)
    let savings = 0;
    if (efisiensi >= 90) {
        savings = (data.energy * TARIF_LISTRIK) * 0.05;
    }
    if (elSavings) elSavings.innerText = formatRupiah(savings);

    // c. Beban Puncak (Mencatat daya tertinggi selama website dibuka)
    if (data.power > peakPower) {
        peakPower = data.power;
    }
    if (elPeakLoad) elPeakLoad.innerText = peakPower.toFixed(0) + " W";

    // d. Proyeksi Rata-rata Harian (Daya saat ini x 24 jam)
    let dailyEst = (data.power * 24) / 1000;
    if (elDailyAvg) elDailyAvg.innerText = dailyEst.toFixed(1) + " kWh";

    // e. Proyeksi Estimasi Tagihan Bulanan (Proyeksi harian x 30 hari x Tarif)
    let monthlyEst = dailyEst * 30 * TARIF_LISTRIK;
    if (elEstBill) elEstBill.innerText = formatRupiah(monthlyEst);
}

// Fungsi Update Tabel Berdasarkan Data Realtime
function updateHistoryTable(data, timeStr) {
    const tbody = document.getElementById('history-tbody');
    
    // Tentukan badge status berdasarkan daya
    let statusBadge = data.power > BATAS_ALARM ? 
        `<span style="background:#f44336; color:#fff; padding:4px 8px; border-radius:4px; font-size:12px;">Tinggi</span>` : 
        `<span style="background:#5BBE8A; color:#fff; padding:4px 8px; border-radius:4px; font-size:12px;">Normal</span>`;

    // Buat baris baru
    const row = `
        <tr>
            <td>${timeStr}</td>
            <td>${data.voltage.toFixed(1)}</td>
            <td>${data.current.toFixed(2)}</td>
            <td>${data.power.toFixed(0)}</td>
            <td>${data.energy.toFixed(3)}</td>
            <td>${statusBadge}</td>
        </tr>
    `;
    
    // Masukkan baris baru di posisi paling atas
    tbody.insertAdjacentHTML('afterbegin', row);

    // Hapus baris paling bawah jika lebih dari 10 baris
    if (tbody.children.length > 10) {
        tbody.removeChild(tbody.lastChild);
    }
}

// ==========================================
// KONEKSI MQTT KE EMQX CLOUD (WEBSOCKETS)
// ==========================================
const mqttHost = 'wss://p5161151.ala.asia-southeast1.emqxsl.com:8084/mqtt';
const mqttOptions = {
    clientId: 'WebDashboard_' + Math.random().toString(16).substring(2, 8),
    username: 'admin', 
    password: 'admin', 
    clean: true,
    reconnectPeriod: 2000,
};

const mqttStatusText = document.getElementById('mqtt-status');
const mqttDot = document.getElementById('mqtt-dot');

console.log("Mencoba terhubung ke Broker MQTT...");
const client = mqtt.connect(mqttHost, mqttOptions);

client.on('connect', () => {
    console.log('Berhasil terhubung ke EMQX Cloud via WebSocket!');
    mqttStatusText.innerText = 'MQTT Connected';
    mqttDot.style.backgroundColor = 'var(--primary-color)';
    mqttDot.style.boxShadow = '0 0 8px var(--primary-color)';

    client.subscribe('sensor/pzem004t/data', { qos: 0 });
});

client.on('message', (topic, message) => {
    try {
        const dataPzem = JSON.parse(message.toString());
        updateDashboard(dataPzem); 
    } catch (e) {
        console.error("Format JSON tidak valid!", e);
    }
});

client.on('error', (err) => {
    console.error('Koneksi MQTT Gagal: ', err);
    mqttStatusText.innerText = 'MQTT Error';
    mqttDot.style.backgroundColor = '#f44336';
    mqttDot.style.boxShadow = '0 0 8px #f44336';
});

client.on('offline', () => {
    mqttStatusText.innerText = 'MQTT Disconnected';
    mqttDot.style.backgroundColor = '#888';
    mqttDot.style.boxShadow = 'none';
});