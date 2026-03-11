// HydBlooms - Hyderabad Tree & Biodiversity Dashboard Logic

let map;
let markerCluster;
let treesData = [];
let markers = []; // Track all markers for quick filtering

const infoCard = document.getElementById('info-card');
const closeInfoBtn = document.getElementById('close-info');
const speciesList = document.getElementById('species-list');
const totalTreesEl = document.getElementById('total-trees');
const totalSpeciesEl = document.getElementById('total-species');
const searchInput = document.getElementById('search-input');
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const homeBtn = document.getElementById('home-btn');
const addBloomBtn = document.getElementById('add-bloom-btn');
const bloomModal = document.getElementById('bloom-modal');
const closeModalBtn = document.getElementById('close-modal');
const bloomForm = document.getElementById('bloom-form');
const fetchLocationBtn = document.getElementById('fetch-location-btn');
const bloomLocationInput = document.getElementById('bloom-location');
const bloomLatInput = document.getElementById('bloom-lat');
const bloomLngInput = document.getElementById('bloom-lng');
const photoInputs = document.querySelectorAll('.photo-btn input');
const photoPreview = document.getElementById('photo-preview');
const flowerContainer = document.getElementById('falling-flowers-container');

// Color mapping based on Hyderabad species features
const speciesColors = {
    "Peltophorum pterocarpum": "#f1c40f", // Yellow
    "Cassia fistula": "#f1c40f",           // Yellow
    "Delonix regia": "#e74c3c",           // Red
    "Spathodea campanulata": "#e67e22",   // Orange
    "Bauhinia purpurea": "#9b59b6",       // Purple/Pink
    "Plumeria alba": "#ffffff",           // White
    "Tabebuia rosea": "#ff9ff3",          // Pink
    "Jacaranda mimosifolia": "#5f27cd",   // Purple
    "Lagerstroemia speciosa": "#ff6b6b",  // Pinkish Red
    "Azadirachta indica": "#2ecc71",      // Green
    "Albizia lebbeck": "#7ed6df",         // Pale Yellow
    "Tamarindus indica": "#f39c12",       // Orange-Yellow
    "Animalia": "#3498db",                // Blue for wildlife
    "default": "#27ae60"                  // Deep Green
};

const HYDERABAD_CENTER = [17.4184, 78.41];

// Initialize Map
function initMap() {
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM' });
    const esriSat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: '&copy; Esri' });
    const cartoDark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; CARTO' });

    map = L.map('map', {
        center: HYDERABAD_CENTER,
        zoom: 12,
        layers: [esriSat],
        zoomControl: false
    });

    const baseMaps = {
        "Satellite": esriSat,
        "Street Map": osm,
        "Modern Dark": cartoDark
    };

    L.control.layers(baseMaps).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    markerCluster = L.markerClusterGroup({
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        maxClusterRadius: 50,
        iconCreateFunction: (cluster) => {
            return L.divIcon({
                html: `<span>${cluster.getChildCount()}</span>`,
                className: 'custom-cluster-icon',
                iconSize: [40, 40]
            });
        }
    });
    map.addLayer(markerCluster);

    // Manual Location Picker on Map
    map.on('click', (e) => {
        if (!bloomModal.classList.contains('hidden')) {
            const { lat, lng } = e.latlng;
            setBloomLocation(lat, lng, "Custom Map Location");
        }
    });
}

// Load Data
async function loadData() {
    try {
        const response = await fetch('trees.json');
        treesData = await response.json();

        displayTrees(treesData);
        updateStats(treesData);
        populateSpeciesList(treesData);
        createFallingFlowers();
    } catch (err) {
        console.error("Failed to load survey data:", err);
    }
}

// Display Markers
function displayTrees(data) {
    markerCluster.clearLayers();
    markers = [];

    data.forEach(tree => {
        const color = tree.kingdom === "Animalia" ? speciesColors["Animalia"] : (speciesColors[tree.scientificName] || speciesColors["default"]);
        const emoji = tree.kingdom === "Animalia" ? "🦋" : "🌳";

        const treeIcon = L.divIcon({
            className: 'custom-tree-icon',
            html: `<div class="tree-inner" style="background: ${color}; border: 2px solid #fff; box-shadow: 0 0 10px ${color}">${emoji}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });

        const marker = L.marker([tree.lat, tree.lng], { icon: treeIcon });
        marker.on('click', () => {
            showInfo(tree);
            map.flyTo([tree.lat, tree.lng], 16);
            if (window.innerWidth < 768) sidebar.classList.add('hidden');
        });
        marker.on('mouseover', () => showInfo(tree));

        markerCluster.addLayer(marker);
        markers.push({ leafMarker: marker, data: tree });
    });
}

// Show Info Card
function showInfo(tree) {
    infoCard.classList.remove('hidden');
    const color = tree.kingdom === "Animalia" ? speciesColors["Animalia"] : (speciesColors[tree.scientificName] || speciesColors["default"]);

    document.getElementById('card-common-name').textContent = tree.commonName || tree.scientificName;
    document.getElementById('card-scientific-name').textContent = tree.scientificName;
    document.getElementById('card-locality').textContent = tree.locality || "Hyderabad, Telangana";
    document.getElementById('card-date').textContent = tree.date || "2024 Survey";
    document.getElementById('card-remarks').textContent = tree.remarks && tree.remarks !== '-' ? tree.remarks : "Healthy mature specimen recorded.";
    document.getElementById('card-recorded-by').textContent = tree.recordedBy ? `Observed by: ${tree.recordedBy}` : "Surveyed by: WWF HATS Team";

    infoCard.style.borderLeft = `8px solid ${color}`;
    infoCard.style.borderImage = `linear-gradient(to bottom, ${color}, ${color}44) 1`;
}

// Stats and Sidebar
function updateStats(data) {
    totalTreesEl.textContent = data.filter(t => t.kingdom === "Plantae").length;
    const speciesSet = new Set(data.map(t => t.scientificName));
    totalSpeciesEl.textContent = speciesSet.size;
}

function populateSpeciesList(data) {
    speciesList.innerHTML = '';
    const counts = {};
    data.forEach(t => { counts[t.scientificName] = (counts[t.scientificName] || 0) + 1; });

    Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 40).forEach(scName => {
        const entry = treesData.find(t => t.scientificName === scName);
        if (!entry) return;

        const color = entry.kingdom === "Animalia" ? speciesColors["Animalia"] : (speciesColors[scName] || speciesColors["default"]);
        const li = document.createElement('li');
        li.className = 'species-item';
        li.innerHTML = `
            <div class="color-dot" style="background: ${color}; box-shadow: 0 0 5px ${color}"></div>
            <div class="species-info">
                <span class="common" style="color: ${color === '#ffffff' ? '#fff' : color}">${entry.commonName}</span>
                <span class="sc">${scName} (${counts[scName]})</span>
            </div>
        `;
        li.addEventListener('click', () => {
            const filtered = treesData.filter(t => t.scientificName === scName);
            displayTrees(filtered);
            if (filtered.length > 0) {
                const bounds = L.latLngBounds(filtered.map(t => [t.lat, t.lng]));
                map.fitBounds(bounds, { padding: [100, 100], maxZoom: 16 });
            }
        });
        speciesList.appendChild(li);
    });
}

// Functionality
function createFallingFlowers() {
    const flowers = ['🌸', '🌼', '🌺', '🍃', '🏵️'];
    for (let i = 0; i < 15; i++) {
        setTimeout(() => {
            const flower = document.createElement('div');
            flower.className = 'falling-flower';
            flower.textContent = flowers[Math.floor(Math.random() * flowers.length)];
            flower.style.left = Math.random() * 100 + 'vw';
            flower.style.animationDuration = (Math.random() * 10 + 5) + 's';
            flower.style.animationDelay = (Math.random() * 5) + 's';
            flowerContainer.appendChild(flower);
        }, i * 200);
    }
}

function setBloomLocation(lat, lng, label = "") {
    bloomLatInput.value = lat;
    bloomLngInput.value = lng;
    bloomLocationInput.value = label || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    // Show a temporary marker if needed
    if (window.tempMarker) map.removeLayer(window.tempMarker);
    window.tempMarker = L.marker([lat, lng], {
        icon: L.divIcon({
            className: 'temp-marker',
            html: '📍',
            iconSize: [30, 30]
        })
    }).addTo(map);
}

async function fetchGPSLocation() {
    fetchLocationBtn.textContent = '⌛';
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        fetchLocationBtn.textContent = '🛰️';
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            map.flyTo([latitude, longitude], 16);
            setBloomLocation(latitude, longitude, "GPS Coordinates Fetched");
            fetchLocationBtn.textContent = '✅';
            setTimeout(() => fetchLocationBtn.textContent = '🛰️', 2000);
        },
        (error) => {
            alert("Unable to retrieve your location");
            fetchLocationBtn.textContent = '❌';
            setTimeout(() => fetchLocationBtn.textContent = '🛰️', 2000);
        }
    );
}

// Event Listeners
addBloomBtn.addEventListener('click', () => {
    bloomModal.classList.remove('hidden');
    if (window.innerWidth < 768) {
        sidebar.classList.add('hidden');
    }
});

closeModalBtn.addEventListener('click', () => {
    bloomModal.classList.add('hidden');
    if (window.tempMarker) map.removeLayer(window.tempMarker);
});

fetchLocationBtn.addEventListener('click', fetchGPSLocation);

photoInputs.forEach(input => {
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                photoPreview.style.backgroundImage = `url(${event.target.result})`;
                photoPreview.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    });
});

bloomForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(bloomForm);
    const data = Object.fromEntries(formData.entries());

    // Add manual fields
    data.lat = bloomLatInput.value;
    data.lng = bloomLngInput.value;
    data.locationName = bloomLocationInput.value;
    data.timestamp = new Date().toISOString();

    console.log("New Bloom Submission:", data);

    // Simulate saving
    alert("Thank you! Your bloom has been spotted. In a real app, this would be saved to the database.");

    // Reset and close
    bloomForm.reset();
    photoPreview.classList.add('hidden');
    bloomModal.classList.add('hidden');
    if (window.tempMarker) map.removeLayer(window.tempMarker);
});
homeBtn.addEventListener('click', () => {
    map.flyTo(HYDERABAD_CENTER, 12);
    displayTrees(treesData);
    updateStats(treesData);
    populateSpeciesList(treesData);
});

closeInfoBtn.addEventListener('click', () => infoCard.classList.add('hidden'));

searchInput.addEventListener('input', () => {
    const term = searchInput.value.toLowerCase();
    const filtered = treesData.filter(t =>
        (t.scientificName && t.scientificName.toLowerCase().includes(term)) ||
        (t.commonName && t.commonName.toLowerCase().includes(term)) ||
        (t.locality && t.locality.toLowerCase().includes(term))
    );
    displayTrees(filtered);
    updateStats(filtered);
});

sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('hidden'));

// Kingdom Filtering
document.querySelectorAll('input[name="kingdom"]').forEach(cb => {
    cb.addEventListener('change', () => {
        const checkedKingdoms = Array.from(document.querySelectorAll('input[name="kingdom"]:checked')).map(v => v.value);
        const filtered = treesData.filter(t => checkedKingdoms.includes(t.kingdom));
        displayTrees(filtered);
        updateStats(filtered);
        populateSpeciesList(filtered);
    });
});

window.addEventListener('DOMContentLoaded', () => {
    initMap();
    if (window.innerWidth < 768) sidebar.classList.add('hidden');
    loadData();
});
