let map = null; 
let allMarkers = []; 
let emergencyPlaces = []; 
let selectedDistance = 3000; // INICIA COM 3000m (3 km)
let centerCoords = { lat: -19.922835610378083, lng: -43.99259054280393 }; 
const BASE_TEXT = 'Serviços de Emergência';


// ----------------------------------------------------------------------
// 1. CARREGAMENTO DOS DADOS (JSON)
// ----------------------------------------------------------------------

async function loadEmergencyData() {
    try {
        const response = await fetch('./localizacao.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        emergencyPlaces = await response.json();
        console.log(`Dados de emergência carregados: ${emergencyPlaces.length} locais.`);
    } catch (error) {
        console.error("Erro ao carregar o arquivo data.json. O filtro não funcionará.", error);
        emergencyPlaces = [];
    }
}

// ----------------------------------------------------------------------
// 2. FUNÇÃO PRINCIPAL DE INICIALIZAÇÃO (Adaptada para Web Component)
// ----------------------------------------------------------------------

async function init() {
    console.log("1. Iniciando carregamento de dados e componentes...");
    
    // 1. Carrega o JSON primeiro
    await loadEmergencyData();
    
    // 2. GARANTIA: Espera o Web Component do mapa ser definido
    await customElements.whenDefined('gmp-map');
    
    // 3. Acessa o elemento HTML do mapa
    const gmpMapElement = document.getElementById('emergency-map');

    if (gmpMapElement) {
        // 4. Espera o objeto nativo do mapa do Google ser carregado dentro do Web Component
        // Isso é CRÍTICO para o Web Component.
        await new Promise(resolve => {
            const checkMap = setInterval(() => {
                if (gmpMapElement.innerMap) {
                    map = gmpMapElement.innerMap; // ARMAZENA O OBJETO MAP NATIVO AQUI
                    clearInterval(checkMap);
                    resolve();
                }
            }, 100);
        });
        
        console.log("2. Objeto Google Map nativo acessado com sucesso.");
    } else {
        console.error("ERRO CRÍTICO: Elemento <gmp-map id='emergency-map'> não encontrado. Verifique seu HTML.");
        return;
    }

    // 5. Carrega a biblioteca InfoWindow (necessária para exibir informações)
    try {
        const mapsLibrary = await google.maps.importLibrary("maps");
        window.InfoWindow = mapsLibrary.InfoWindow;
    } catch (error) {
        console.error("Erro ao carregar InfoWindow:", error);
    }

    // 6. Inicializa a interface (Dropdown) e aplica o filtro inicial
    initializeDropdownControl();
    initializeDistanceDropdown();
    filterMarkersByType('all'); // Aplica o primeiro filtro automaticamente
}


// ----------------------------------------------------------------------
// 3. LÓGICA DO DROPDOWN
// ----------------------------------------------------------------------

function initializeDropdownControl() {
    const toggleButton = document.getElementById('dropdown-toggle');
    const distanceButton = document.getElementById('dropdown-toggle-distance'); // Novo
    const dropdownMenu = document.getElementById('dropdown-menu');
    
    // Define o texto inicial como 'Mostrar Todos'
    const initialText = document.getElementById('filter-todos').textContent.trim();
    toggleButton.innerHTML = `${initialText} <span class="tab-icon">▼</span>`;
    // O botão principal já tem a classe 'active' no HTML

    // ABRIR/FECHAR
    toggleButton.addEventListener('click', () => {
        dropdownMenu.classList.toggle('show');
        toggleButton.classList.toggle('open');
        
        // Ativa o botão de Serviços e desativa o de Distância (efeito de aba)
        toggleButton.classList.add('active');
        distanceButton.classList.remove('active');
    });
    
    // ... (restante da lógica de fechar ao clicar fora)

    // MUDANÇA DE TEXTO E FILTRO
        document.querySelectorAll('#dropdown-menu .dropdown-option').forEach(option => { 
            option.addEventListener('click', function(e) {
                e.preventDefault();
            
            // Esconde o menu
            dropdownMenu.classList.remove('show');
            toggleButton.classList.remove('open');
            
            // Marca ativo no menu
            document.querySelectorAll('#dropdown-menu .dropdown-option').forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');

            // Aplica a lógica de texto
            const selectedText = this.textContent.trim();
            const type = this.getAttribute('data-type');
            
            let newText;
            if (type === 'all') {
                newText = BASE_TEXT; // "Mostrar Todos"
            } else {
                newText = `${BASE_TEXT}: ${selectedText}`;
            }
            
            toggleButton.innerHTML = `${newText} <span class="tab-icon">▼</span>`;
            
            // Reativa a aba de Serviços
            toggleButton.classList.add('active');
            distanceButton.classList.remove('active');
            
            // CHAMA O FILTRO
            filterMarkersByType(type); 
        });
    });
}

// ----------------------------------------------------------------------
// 4. LÓGICA DE MARCADORES E FILTRAGEM (CORRIGIDA)
// ----------------------------------------------------------------------

function clearMarkers() {
    allMarkers.forEach(marker => {
        // Usa o método nativo da API
        marker.setMap(null); 
    });
    allMarkers = [];
}
function filterMarkersByType(type) {
    if (!map) {
        console.error("Mapa ainda não inicializado. Não é possível filtrar.");
        return;
    }

    clearMarkers();

    // Pega todos os lugares
    let placesToDisplay = [];

    if (type === 'all') {
        placesToDisplay = emergencyPlaces;
    } else {
        placesToDisplay = emergencyPlaces.filter(place => place.type === type);
    }

    // 🔽 Verifica se selectedDistance está definido
    if (!selectedDistance) {
        selectedDistance = 5000; // valor padrão, por exemplo
    }

    // 🔽 Aplica o filtro de distância
    const center = new google.maps.LatLng(centerCoords.lat, centerCoords.lng);
    placesToDisplay = placesToDisplay.filter(place => {
        const pos = new google.maps.LatLng(place.lat, place.lng);
        const distance = google.maps.geometry.spherical.computeDistanceBetween(center, pos);
        return distance <= selectedDistance;
    });

    addMarkersToMap(placesToDisplay);
}



function addMarkersToMap(places) {
    if (!map) return;
    
    const bounds = new google.maps.LatLngBounds();
    const center = new google.maps.LatLng(centerCoords.lat, centerCoords.lng);
    bounds.extend(center);
    
    places.forEach(place => {
        const position = new google.maps.LatLng(place.lat, place.lng);
        const icon = getIconForType(place.type);

        
        const marker = new google.maps.Marker({
            position: position,
            map: map, // O objeto map é garantido aqui
            title: place.name,
            icon: icon,
        });
        
        allMarkers.push(marker);
        bounds.extend(position);
        
        // Adiciona InfoWindow
        const infowindow = new window.InfoWindow({ // Usa o InfoWindow carregado
            content: `<strong>${place.name}</strong><br>${place.address}`
        });
        
        marker.addListener("click", () => {
            // O infowindow abre no objeto map nativo
            infowindow.open(map, marker); 
        });
    });
    
    // Centraliza o mapa se houver marcadores
    if (places.length > 0) {
        map.fitBounds(bounds);
    } else {
        map.setCenter(centerCoords);
        map.setZoom(13);
    }
}

function getIconForType(type) {
    const icons = {
        'hospital': { url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' },
        'police': { url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png' },
        'fire_station': { url: 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png' },
    };
    return icons[type] || null; 
}


// ----------------------------------------------------------------------
// 5. CHAMADA DE INICIALIZAÇÃO
// ----------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', init);

// ----------------------------------------------------------------------
// 6. DROPDOWN DE DISTÂNCIA
// ----------------------------------------------------------------------
function initializeDistanceDropdown() {
    const toggleButton = document.getElementById('dropdown-toggle-distance');
    const serviceButton = document.getElementById('dropdown-toggle'); // Novo
    const dropdownMenu = document.getElementById('dropdown-menu-distance');
    const distanceOptions = dropdownMenu.querySelectorAll('.dropdown-option');

    // O texto inicial já é definido no HTML
    // toggleButton.innerHTML = `Distância: 3 km <span class="tab-icon">▼</span>`;

    // Abre/fecha menu
    toggleButton.addEventListener('click', () => {
        dropdownMenu.classList.toggle('show');
        toggleButton.classList.toggle('open');
        
        // Ativa o botão de Distância e desativa o de Serviços (efeito de aba)
        toggleButton.classList.add('active');
        serviceButton.classList.remove('active');
    });

    // ... (restante da lógica de fechar ao clicar fora)

    // Quando uma opção for selecionada
    distanceOptions.forEach(option => {
        option.addEventListener('click', e => {
            e.preventDefault();
            
            // Atualiza estado visual no menu
            distanceOptions.forEach(o => o.classList.remove('active'));
            option.classList.add('active');

            // Atualiza valor global
            selectedDistance = parseInt(option.getAttribute('data-distance'));

            // Atualiza texto do botão
            const selectedText = option.textContent.trim();
            toggleButton.innerHTML = `Distância: ${selectedText} <span class="tab-icon">▼</span>`;

            // Fecha menu
            dropdownMenu.classList.remove('show');
            toggleButton.classList.remove('open');
            
            // Reativa a aba de Distância
            toggleButton.classList.add('active');
            serviceButton.classList.remove('active');

            // Reaplica filtro atual (usando o tipo de filtro de serviço selecionado)
            // Certifique-se de que a query pega o elemento correto
            const activeServiceElement = document.querySelector('#dropdown-menu .dropdown-option.active');
            const activeType = activeServiceElement ? activeServiceElement.dataset.type : 'all';
            
            filterMarkersByType(activeType);
        });
    });
}