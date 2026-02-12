// CSV data
const csvData = `name,description,lat,long,url,email,phone,category,service_for (?),is_funding,inperson_service,street_address,building_room,building_accesibilty,mon_open,mon_close,tue_open,tue_close,wed_open,wed_close,thu_open,thu_close,fri_open,fri_close
Michigan Institute for Data and AI in Society,"The Michigan Institute for Data and AI in Society (MIDAS) advances data science and AI and enables their transformative use across disciplines to achieve lasting scientific and societal impact. With almost 700 affiliated faculty members from all schools and colleges at the U-M Ann Arbor campus, as well as from U-M Dearborn and U-M Flint, MIDAS is one of the largest data science and AI institutes at a U.S. university. MIDAS is also home to a vibrant community of more than 1,000 students and postdocs and 180 staff scientists who collaborate across 70 campus units through the Staff Collective for Data Science. Faculty, staff, and students help shape and lead MIDAS programs, driving innovation and advancing the impact of data science and AI through partnerships across U-M and beyond.MIDAS offers a comprehensive portfolio of research, training, and partnership development programs.",42.276678,-83.7352768,https://midas.umich.edu/,midas-research@umich.edu,,research;training,undergradute;graduate;faculty;staff;public,no,yes,500 Church Street,"Weiser Hall, 600","Enter through the main entrance (North side), make a left at the end of the hallway, and make another left. Elevators will be on both sides. Enter through the farthest south entrance, and there will be an elevator within the stairwell.",9:00,17:00,9:00,17:00,9:00,17:00,9:00,17:00,0,0
Michigan AI Research Hub,Interdisciplinary hub supporting AI research collaborations across campus,42.8808,-90.256,https://aihub.umich.edu,aihub@umich.edu,734-555-0101,research,faculty;grads;postdocs,yes,yes,500 S State St,Weiser Hall 300,Automatic doors and elevator access via south entrance,9:00,17:00,9:00,17:00,9:00,17:00,9:00,17:00,9:00,16:00
AI Computing Lab @ Duderstadt,High performance computing lab for machine learning and data science projects,42.2914,-83.7165,https://mlab.dc.umich.edu,mlab@umich.edu,734-555-0102,lab,undergraduate; graduate,no,yes,2281 Bonisteel Blvd,Duderstadt Center 3400,Wheelchair accessible with elevators near main entrance,10:00,22:00,10:00,22:00,10:00,22:00,10:00,22:00,10:00,18:00
Center for AI in Education,Supports research and teaching innovation using AI in classrooms,42.2765,-83.7406,https://aied.umich.edu,aied@umich.edu,734-555-0103,research,faculty; staff,yes,yes,610 E University Ave,School of Education 2310,Ramp access and elevator available near east entrance,9:00,16:30,9:00,16:30,9:00,16:30,9:00,16:30,9:00,15:00
Student AI Consulting Collective,Student-run group offering AI and data consulting to campus partners,42.2786,-83.7369,https://saicc.umich.edu,saicc@umich.edu,734-555-0104,Consulting,"undergrads,student orgs",no,yes,701 Tappan Ave,Ross School of Business K2570,Accessible entrance on Thayer St with elevator,11:00,19:00,11:00,19:00,11:00,19:00,11:00,19:00,11:00,17:00`;

// Parse CSV
function parseCSV(csv) {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',');
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const obj = {};
        let currentField = '';
        let inQuotes = false;
        let fieldIndex = 0;
        
        for (let j = 0; j < lines[i].length; j++) {
            const char = lines[i][j];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                obj[headers[fieldIndex]] = currentField.trim();
                currentField = '';
                fieldIndex++;
            } else {
                currentField += char;
            }
        }
        obj[headers[fieldIndex]] = currentField.trim();
        data.push(obj);
    }
    
    return data;
}

const locations = parseCSV(csvData);

// Initialize map centered on Ann Arbor
const map = L.map('map').setView([42.2808, -83.7430], 13);

// Add tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
}).addTo(map);

// Store markers
let markers = [];

// Get unique categories and services
const categories = new Set();
const services = new Set();

locations.forEach(loc => {
    if (loc.category) {
        loc.category.split(';').forEach(cat => {
            categories.add(cat.trim());
        });
    }
    if (loc['service_for (?)']) {
        loc['service_for (?)'].split(/[;,]/).forEach(service => {
            services.add(service.trim());
        });
    }
});

// Populate filter dropdowns
const categoryFilter = document.getElementById('categoryFilter');
const serviceFilter = document.getElementById('serviceFilter');

Array.from(categories).sort().forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
});

Array.from(services).sort().forEach(service => {
    const option = document.createElement('option');
    option.value = service;
    option.textContent = service;
    serviceFilter.appendChild(option);
});

// Format hours
function formatHours(loc) {
    const days = ['mon', 'tue', 'wed', 'thu', 'fri'];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    let hours = [];
    
    days.forEach((day, idx) => {
        const open = loc[`${day}_open`];
        const close = loc[`${day}_close`];
        if (open && close && open !== '0') {
            hours.push(`${dayNames[idx]}: ${open}-${close}`);
        }
    });
    
    return hours.length > 0 ? hours.join('<br>') : 'Hours not available';
}

// Create marker for location
function createMarker(loc) {
    const lat = parseFloat(loc.lat);
    const lng = parseFloat(loc.long);
    
    if (isNaN(lat) || isNaN(lng)) return null;

    const tooltipContent = `
        <div class="tooltip-title">${loc.name}</div>
        <div class="tooltip-description">${loc.description || 'No description available'}</div>
        <div class="tooltip-info">
            ${loc.street_address ? `<strong>📍 Address:</strong> ${loc.street_address}<br>${loc.building_room || ''}<br>` : ''}
            ${loc.category ? `<strong>📂 Category:</strong> ${loc.category}<br>` : ''}
            ${loc['service_for (?)'] ? `<strong>👥 Service For:</strong> ${loc['service_for (?)']}<br>` : ''}
            ${loc.email ? `<strong>📧 Email:</strong> ${loc.email}<br>` : ''}
            ${loc.phone ? `<strong>📞 Phone:</strong> ${loc.phone}<br>` : ''}
            <strong>🕐 Hours:</strong><br>${formatHours(loc)}
            ${loc.building_accesibilty ? `<br><strong>♿ Accessibility:</strong> ${loc.building_accesibilty}` : ''}
        </div>
        ${loc.url ? `<a href="${loc.url}" target="_blank" class="tooltip-link">🔗 Visit Website</a>` : ''}
    `;

    const marker = L.marker([lat, lng])
        .bindTooltip(tooltipContent, {
            className: 'custom-tooltip',
            maxWidth: 350,
            direction: 'top'
        });

    marker.locationData = loc;
    return marker;
}

// Add all markers initially
function updateMarkers() {
    const categoryValue = categoryFilter.value;
    const serviceValue = serviceFilter.value;

    // Remove all markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    // Add filtered markers
    let count = 0;
    locations.forEach(loc => {
        let showMarker = true;

        // Filter by category
        if (categoryValue !== 'all') {
            const locCategories = loc.category ? loc.category.split(';').map(c => c.trim()) : [];
            if (!locCategories.includes(categoryValue)) {
                showMarker = false;
            }
        }

        // Filter by service
        if (serviceValue !== 'all' && showMarker) {
            const locServices = loc['service_for (?)'] ? 
                loc['service_for (?)'].split(/[;,]/).map(s => s.trim()) : [];
            if (!locServices.includes(serviceValue)) {
                showMarker = false;
            }
        }

        if (showMarker) {
            const marker = createMarker(loc);
            if (marker) {
                marker.addTo(map);
                markers.push(marker);
                count++;
            }
        }
    });

    // Update count
    document.getElementById('countText').textContent = 
        `Showing ${count} of ${locations.length} locations`;
}

// Event listeners
categoryFilter.addEventListener('change', updateMarkers);
serviceFilter.addEventListener('change', updateMarkers);

// Initial render
updateMarkers();
