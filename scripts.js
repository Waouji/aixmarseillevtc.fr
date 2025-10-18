// --- PART 1: GOOGLE PLACES API INTEGRATION ---

// Global variables for Google Maps
let map;
let placesService;
let marker;
let infoWindow;
let businessData = {
    // --- THIS IS YOUR CORRECT, VERIFIED PLACE ID ---
    placeId: 'ChIJq_1gTT3csBIRe_lT0u4-4uU',

    // This location is centered on your service area
    location: { lat: 43.75, lng: 5.78 }, 
    name: 'VTC Aix-Marseille',
    address: 'Service de VTC en Provence', // A descriptive fallback
    phone: '+33 7 43 54 23 09',
    rating: 5.0, // Fallback, will be updated by the API
    reviewsCount: 1, // Fallback, will be updated by the API
    reviews: [],
    openingHours: null,
    isOpenNow: null
};

// Expose initMaps globally for Google Maps API callback
window.initMaps = function() {
    initBusinessMap();
    findCorrectPlaceId();
};

function initBusinessMap() {
    const mapElement = document.getElementById("map");
    if (!mapElement) return;

    map = new google.maps.Map(mapElement, {
        center: businessData.location,
        zoom: 11, // Zoomed out to show a service area
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        styles: getMapStyles() // Dark theme for map
    });

    placesService = new google.maps.places.PlacesService(map);
    infoWindow = new google.maps.InfoWindow({ maxWidth: 320 });

    marker = new google.maps.Marker({
        position: businessData.location,
        map: map,
        animation: google.maps.Animation.DROP,
        title: businessData.name
    });

    marker.addListener('click', () => {
        showBusinessInfoWindow();
    });
}

// Optimized function that uses the hardcoded Place ID directly
function findCorrectPlaceId() {
    if (businessData.placeId) {
        // If we have a Place ID, fetch details directly. This is the fastest method.
        console.log("Using provided owner-verified Place ID:", businessData.placeId);
        fetchBusinessDetails();
    } else {
        // This is a fallback in case the ID is ever removed.
        console.error("CRITICAL: No Place ID provided in businessData object. Please add it for reliability.");
        updateUIAfterPlaceIdFailure("Configuration error: Place ID manquant.");
    }
}

function fetchBusinessDetails() {
    const request = {
        placeId: businessData.placeId,
        fields: ['name', 'formatted_address', 'formatted_phone_number', 'website', 'opening_hours', 'rating', 'user_ratings_total', 'reviews']
    };

    placesService.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            businessData.name = place.name || businessData.name;
            businessData.address = place.formatted_address || businessData.address;
            businessData.phone = place.formatted_phone_number || businessData.phone;
            businessData.rating = place.rating !== undefined ? place.rating : businessData.rating;
            businessData.reviewsCount = place.user_ratings_total !== undefined ? place.user_ratings_total : businessData.reviewsCount;
            businessData.reviews = place.reviews || [];
            businessData.openingHours = place.opening_hours ? place.opening_hours.weekday_text : null;
            businessData.isOpenNow = (place.opening_hours && typeof place.opening_hours.isOpen === 'function') ? place.opening_hours.isOpen() : true; // Default to true for 24/7 service
            
            updateBusinessUI();
            showBusinessInfoWindow(); 
            displayReviews(businessData.reviews); 
        } else {
            console.error("Error fetching business details from Google:", status);
            updateUIAfterPlaceIdFailure(`Erreur lors de la récupération des détails Google (${status}).`);
        }
    });
}

function updateUIAfterPlaceIdFailure(message = "Impossible de charger les avis et informations depuis Google Maps.") {
    updateBusinessUI(); // Update with fallback data
    showBusinessInfoWindow();
    displayFallbackReviewsMessage(message);
    updateGoogleActionButtons();
}

function displayFallbackReviewsMessage(message) {
    const reviewsContainer = document.getElementById('reviews-container');
    if (reviewsContainer) {
        reviewsContainer.innerHTML = `<div class="no-reviews-message"><p>${message}</p></div>`;
    }
    const loadMoreButton = document.getElementById('load-more-reviews');
    if (loadMoreButton) loadMoreButton.style.display = 'none';
}

function updateBusinessUI() {
    document.getElementById('average-rating').textContent = businessData.rating.toFixed(1);
    document.getElementById('rating-stars').innerHTML = generateStarsHTML(businessData.rating);
    document.getElementById('review-count').textContent = `${businessData.reviewsCount} avis`;
    
    document.getElementById('business-address').textContent = businessData.address;
    document.getElementById('business-phone').textContent = businessData.phone;

    updateBusinessHoursUI();
}

function updateBusinessHoursUI() {
    const hoursContainer = document.getElementById('business-hours-container');
    if (!hoursContainer) return;
    // For a 24/7 VTC service, we override with clear information.
    hoursContainer.innerHTML = `<div class="hours-item today"><span class="day">Disponibilité</span> <span class="time">24 heures / 24</span></div>`;
    const statusElement = document.createElement('div');
    statusElement.classList.add('open-status');
    statusElement.textContent = 'Toujours Ouvert';
    statusElement.style.color = 'var(--google-green)';
    hoursContainer.appendChild(statusElement);
}

function showBusinessInfoWindow() {
    if (!infoWindow || !map || !marker) return;
    const destinationQuery = `&destination_place_id=${businessData.placeId}`;

    const content = `
        <div class="map-info-window">
            <div class="map-info-title">${businessData.name}</div>
            <div class="map-info-address">${businessData.address}</div>
            <div class="map-info-rating">
                <span class="map-info-rating-score">${businessData.rating.toFixed(1)}</span>
                <div class="map-info-rating-stars">${generateStarsHTML(businessData.rating, true)}</div>
            </div>
            <div class="map-info-actions">
                <a href="https://wa.me/${businessData.phone.replace(/\s/g, '')}" target="_blank" class="map-info-button">WhatsApp</a>
                <a href="tel:${businessData.phone.replace(/\s/g, '')}" class="map-info-button">Appeler</a>
            </div>
        </div>
    `;
    infoWindow.setContent(content);
    infoWindow.open(map, marker);
}

function displayReviews(reviews) {
    const reviewsContainer = document.getElementById('reviews-container');
    if (!reviewsContainer) return;

    if (!Array.isArray(reviews) || reviews.length === 0) {
        displayFallbackReviewsMessage("Aucun avis Google n'a pu être chargé pour cet établissement.");
        updateGoogleActionButtons();
        return;
    }

    let reviewsHTML = '';
    reviews.slice(0, 6).forEach(review => {
        const avatarText = review.author_name ? review.author_name.charAt(0).toUpperCase() : 'U';
        const reviewText = review.text ? String(review.text).replace(/\n/g, '<br>') : "<i>Cet utilisateur n'a pas laissé de commentaire.</i>";
        reviewsHTML += `
            <div class="review-card">
                <div class="review-header">
                    <div class="review-avatar" style="background-color: ${generateAvatarColor(avatarText)}">${avatarText}</div>
                    <div>
                        <div class="review-author">${review.author_name || 'Utilisateur Google'}</div>
                        <div class="review-date">${formatRelativeTime(review.time)}</div>
                    </div>
                </div>
                <div class="review-stars">${generateStarsHTML(review.rating)}</div>
                <div class="review-content">${reviewText}</div>
            </div>
        `;
    });
    reviewsContainer.innerHTML = reviewsHTML;
    updateGoogleActionButtons(true);
}

function updateGoogleActionButtons(reviewsAvailable = false) {
    const loadMoreButton = document.getElementById('load-more-reviews');
    const leaveReviewButton = document.getElementById('leave-review-button');

    if (loadMoreButton) {
        loadMoreButton.style.display = reviewsAvailable ? 'inline-flex' : 'none';
        if (businessData.placeId) {
            loadMoreButton.href = `https://search.google.com/local/reviews?placeid=${businessData.placeId}`;
        }
    }

    if (leaveReviewButton && businessData.placeId) {
        leaveReviewButton.href = `https://search.google.com/local/writereview?placeid=${businessData.placeId}`;
    }
}

function generateAvatarColor(letter) {
    const hue = (letter.charCodeAt(0) * 137.508) % 360; 
    return `hsl(${hue}, 55%, 65%)`; 
}

function generateStarsHTML(rating, small = false) {
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        const iconClass = i <= rating ? 'fas fa-star' : i - 0.5 <= rating ? 'fas fa-star-half-alt' : 'far fa-star';
        starsHTML += `<i class="${iconClass} star-icon"></i>`;
    }
    return starsHTML;
}

function formatRelativeTime(unixTimestamp) {
    const diffSeconds = Math.round((new Date() - new Date(unixTimestamp * 1000)) / 1000);
    const intervals = [ { label: 'an', seconds: 31536000 }, { label: 'mois', seconds: 2592000 }, { label: 'sem.', seconds: 604800 }, { label: 'jour', seconds: 86400 }];
    for (const i of intervals) {
        const count = Math.floor(diffSeconds / i.seconds);
        if (count > 0) return `il y a ${count} ${i.label}${count > 1 && i.label !== 'mois' ? 's' : ''}`;
    }
    return `à l'instant`;
}

function getMapStyles() {
    // Dark theme for the map to match the website style
    return [
        { elementType: "geometry", stylers: [{ color: "#242f3e" }] }, { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] }, { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] }, { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] }, { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] }, { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] }, { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] }, { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] }, { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] }, { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] }, { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] }, { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] }, { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] }, { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] }, { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] }, { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] }, { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] }, { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
    ];
}


// --- PART 2: ORIGINAL VTC WEBSITE LOGIC ---

document.addEventListener('DOMContentLoaded', function() {
    // Language switching
    const langButtons = document.querySelectorAll('.lang-btn');
    const contentElements = document.querySelectorAll('.content');
    langButtons.forEach(button => {
        button.addEventListener('click', () => {
            const selectedLang = button.getAttribute('data-lang');
            langButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            contentElements.forEach(content => {
                content.classList.toggle('active', content.getAttribute('data-lang') === selectedLang);
            });
            document.documentElement.lang = selectedLang;
        });
    });

    // Mobile menu
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    mobileMenuToggle.addEventListener('click', () => navLinks.classList.toggle('active'));

    // Smooth scrolling & close mobile menu
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                navLinks.classList.remove('active');
            }
        });
    });

    // Scroll animations
    const fadeInObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    document.querySelectorAll('.fade-in').forEach(el => fadeInObserver.observe(el));

    // Header background on scroll
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        header.style.background = window.scrollY > 100 ? 'rgba(26, 26, 26, 0.98)' : 'rgba(26, 26, 26, 0.95)';
    });

    // Form submission
    document.querySelectorAll('.booking-form').forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const lang = document.querySelector('.lang-btn.active').getAttribute('data-lang');
            const data = {
                pickup: this.querySelector(`#pickup-${lang}`).value, destination: this.querySelector(`#destination-${lang}`).value,
                date: this.querySelector(`#date-${lang}`).value, time: this.querySelector(`#time-${lang}`).value,
                passengers: this.querySelector(`#passengers-${lang}`).value, service: this.querySelector(`#service-${lang}`).value,
                name: this.querySelector(`#name-${lang}`).value, phone: this.querySelector(`#phone-${lang}`).value,
                notes: this.querySelector(`#notes-${lang}`).value, method: this.querySelector(`input[name="contact-method-${lang}"]:checked`).value
            };
            if (data.method === 'whatsapp') {
                const text = `Bonjour, je souhaite réserver un VTC:\n\n📍 Départ: ${data.pickup}\n🎯 Destination: ${data.destination}\n📅 Date: ${data.date}\n⏰ Heure: ${data.time}\n👥 Passagers: ${data.passengers}\n🚗 Service: ${data.service}\n👤 Nom: ${data.name}\n📞 Téléphone: ${data.phone}\n📝 Notes: ${data.notes}`;
                window.open(`https://wa.me/33743542309?text=${encodeURIComponent(text)}`, '_blank');
            } else {
                const subject = `Nouvelle Réservation VTC Aix-Marseille`;
                const body = `Bonjour,\n\nJe souhaite effectuer une réservation VTC avec les détails suivants :\n\n- Départ : ${data.pickup}\n- Destination : ${data.destination}\n- Date : ${data.date} à ${data.time}\n- Passagers : ${data.passengers}\n- Service : ${data.service}\n\nCoordonnées :\n- Nom : ${data.name}\n- Téléphone : ${data.phone}\n\nNotes : ${data.notes}\n\nMerci de confirmer.`;
                window.location.href = `mailto:contact@aixmarseillevtc.fr?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            }
        });
    });
    
    // Floating menu
    const menuToggle = document.querySelector('.menu-toggle');
    const floatingMenu = document.querySelector('.floating-menu');
    menuToggle.addEventListener('click', () => {
        floatingMenu.classList.toggle('active');
        menuToggle.classList.toggle('active');
    });
    document.addEventListener('click', (e) => {
        if (!floatingMenu.contains(e.target)) {
            floatingMenu.classList.remove('active');
            menuToggle.classList.remove('active');
        }
    });

    // Update current year in footer
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // Initialize forms
    initializeDateTimeInputs();
    saveUserData();
});


// --- PART 3: ORIGINAL VTC HELPER FUNCTIONS (made globally accessible) ---

// Geolocation
function getLocation(lang) {
    const geoBtn = document.querySelector(`#pickup-${lang}`).nextElementSibling;
    geoBtn.classList.add('loading');
    geoBtn.innerHTML = '<i class="fas fa-spinner"></i>';
    navigator.geolocation.getCurrentPosition(
        pos => reverseGeocodeOSM(pos.coords.latitude, pos.coords.longitude, lang),
        () => {
            geoBtn.classList.remove('loading');
            geoBtn.innerHTML = '<i class="fas fa-crosshairs"></i>';
        }
    );
}
async function reverseGeocodeOSM(lat, lon, lang) {
    const pickupInput = document.querySelector(`#pickup-${lang}`);
    const geoBtn = pickupInput.nextElementSibling;
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        const data = await response.json();
        if (data && data.display_name) {
            pickupInput.value = data.display_name;
            pickupInput.dispatchEvent(new Event('input'));
        }
    } finally {
        geoBtn.classList.remove('loading');
        geoBtn.innerHTML = '<i class="fas fa-crosshairs"></i>';
    }
}

// Set destination from quick buttons
function setDestination(lang, destination) {
    const destInput = document.querySelector(`#destination-${lang}`);
    destInput.value = destination;
    destInput.dispatchEvent(new Event('input'));
}

// Share Modal
function shareWebsite() { document.getElementById('shareModal').classList.add('active'); }
function closeShareModal() { document.getElementById('shareModal').classList.remove('active'); }
function shareToFacebook() { window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank'); }
function shareToTwitter() { window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent('VTC Aix-Marseille - Service Premium 🚗✨')}`, '_blank'); }
function shareToLinkedIn() { window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank'); }
function shareByEmail() { window.location.href = `mailto:?subject=${encodeURIComponent('VTC Aix-Marseille - Service Premium')}&body=${encodeURIComponent(`Découvrez ce service VTC premium: ${window.location.href}`)}`; }
function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        const btn = event.target.closest('.copy-link');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copié!';
        setTimeout(() => { btn.innerHTML = originalText; }, 2000);
    });
}

// Cookie helpers
function setCookie(name, value, days = 365) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/;SameSite=Lax`;
}
function getCookie(name) {
    const ca = document.cookie.split(';');
    for (let c of ca) {
        c = c.trim();
        if (c.startsWith(name + '=')) return c.substring(name.length + 1);
    }
    return null;
}
function saveUserData() {
    document.querySelectorAll('input[id*="phone-"]').forEach(i => i.addEventListener('blur', () => setCookie('vtc_phone', i.value)));
    document.querySelectorAll('input[id*="name-"]').forEach(i => i.addEventListener('blur', () => setCookie('vtc_name', i.value)));
}

// Smart form initialization
function initializeDateTimeInputs() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(input => {
        input.min = today;
        input.value = today;
    });
}

// Expose functions to global scope for onclick attributes
window.getLocation = getLocation;
window.setDestination = setDestination;
window.shareWebsite = shareWebsite;
window.closeShareModal = closeShareModal;
window.shareToFacebook = shareToFacebook;
window.shareToTwitter = shareToTwitter;
window.shareToLinkedIn = shareToLinkedIn;
window.shareByEmail = shareByEmail;
window.copyLink = copyLink;