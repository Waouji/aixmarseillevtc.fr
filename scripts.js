// --- VTC Aix-Marseille - Guru Scripts ---

// --- PART 1: GOOGLE PLACES API INTEGRATION ---

let map, placesService, marker, infoWindow;
const businessData = {
    placeId: 'ChIJq91hT37csBIRb6oNxMGAwKk', // Your Verified Google Place ID
    reviewUrl: 'https://tinyurl.com/3r5juu95', // UPDATED: Short URL for reviews
    location: { lat: 43.4689, lng: 5.3444 }, 
    name: 'VTC Aix-Marseille Premium',
    address: 'Service VTC Premium en Provence',
    phone: '+33 7 43 54 23 09',
    rating: 5.0,
    reviewsCount: 20,
};

// Expose initMaps globally for Google Maps API callback
window.initMaps = function() {
    if (document.getElementById("map")) {
        initBusinessMap();
        fetchBusinessDetails();
    }
};

function initBusinessMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: businessData.location,
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        styles: getMapStyles()
    });

    placesService = new google.maps.places.PlacesService(map);
    infoWindow = new google.maps.InfoWindow({ maxWidth: 320 });

    marker = new google.maps.Marker({
        position: businessData.location,
        map: map,
        animation: google.maps.Animation.DROP,
        title: businessData.name
    });
    marker.addListener('click', showBusinessInfoWindow);
}

function fetchBusinessDetails() {
    if (!placesService || !businessData.placeId) {
        console.warn("Google Places API not available on this page or Place ID missing.");
        updateUIWithFallbackData("Les informations Google ne sont pas disponibles sur cette page.");
        return;
    }
    const request = {
        placeId: businessData.placeId,
        fields: ['name', 'formatted_address', 'formatted_phone_number', 'rating', 'user_ratings_total', 'reviews', 'opening_hours']
    };

    placesService.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            businessData.name = place.name || businessData.name;
            businessData.address = place.formatted_address || businessData.address;
            businessData.phone = place.formatted_phone_number || businessData.phone;
            businessData.rating = place.rating || businessData.rating;
            businessData.reviewsCount = place.user_ratings_total || businessData.reviewsCount;
            
            updateBusinessUI();
            displayReviews(place.reviews);
        } else {
            console.error("Error fetching Google details:", status);
            updateUIWithFallbackData(`Erreur Google: ${status}`);
        }
    });
}

function updateUIWithFallbackData(message) {
    updateBusinessUI(); // Uses hardcoded data
    const reviewsContainer = document.getElementById('reviews-container');
    if (reviewsContainer) {
        reviewsContainer.innerHTML = `<div class="no-reviews-message"><p>${message}</p></div>`;
    }
    updateGoogleActionButtons();
}

function updateBusinessUI() {
    const el = (id) => document.getElementById(id);
    if (el('average-rating')) el('average-rating').textContent = businessData.rating.toFixed(1);
    if (el('rating-stars')) el('rating-stars').innerHTML = generateStarsHTML(businessData.rating);
    if (el('review-count')) el('review-count').textContent = `${businessData.reviewsCount} avis`;
    if (el('business-address')) el('business-address').textContent = businessData.address;
    if (el('business-phone')) el('business-phone').textContent = businessData.phone;
    if (el('business-hours-container')) {
        el('business-hours-container').innerHTML = `<div class="hours-item today"><span class="day">Disponibilité</span> <span class="time">24h / 24 - 7j / 7</span></div><div class="open-status" style="color: var(--google-green);">Toujours Ouvert</div>`;
    }
}

function displayReviews(reviews) {
    const reviewsContainer = document.getElementById('reviews-container');
    if (!reviewsContainer) return;

    if (!Array.isArray(reviews) || reviews.length === 0) {
        reviewsContainer.innerHTML = `<div class="no-reviews-message">Aucun avis Google n'a pu être chargé.</div>`;
        updateGoogleActionButtons();
        return;
    }

    reviewsContainer.innerHTML = reviews.slice(0, 6).map(review => {
        const avatarText = review.author_name.charAt(0).toUpperCase();
        const reviewText = review.text ? String(review.text).replace(/\n/g, '<br>') : "<i>Cet utilisateur n'a pas laissé de commentaire.</i>";
        return `
            <div class="review-card fade-in">
                <div class="review-header">
                    <div class="review-avatar" style="background-color: hsl(${(avatarText.charCodeAt(0) * 137.508) % 360}, 55%, 65%)">${avatarText}</div>
                    <div>
                        <div class="review-author">${review.author_name}</div>
                        <div class="review-date">${new Date(review.time * 1000).toLocaleDateString('fr-FR')}</div>
                    </div>
                </div>
                <div class="review-stars">${generateStarsHTML(review.rating)}</div>
                <div class="review-content">${reviewText}</div>
            </div>`;
    }).join('');
    updateGoogleActionButtons(true);
}

function updateGoogleActionButtons(reviewsAvailable = false) {
    const loadMoreBtn = document.getElementById('load-more-reviews');
    const leaveReviewBtn = document.getElementById('leave-review-button');
    const reviewLink = businessData.reviewUrl; // UPDATED
    
    if (loadMoreBtn) {
        loadMoreBtn.style.display = reviewsAvailable ? 'inline-flex' : 'none';
        loadMoreBtn.href = `https://search.google.com/local/reviews?placeid=${businessData.placeId}`;
    }
    if (leaveReviewBtn) leaveReviewBtn.href = reviewLink;
}

function showBusinessInfoWindow() {
    if (!infoWindow || !map || !marker) return;
    infoWindow.setContent(`
        <div style="font-family: 'Inter', sans-serif; padding: 5px;">
            <strong style="color: var(--primary-color);">${businessData.name}</strong>
            <p style="margin: 5px 0;">${businessData.address}</p>
            <div style="display: flex; align-items: center;">${generateStarsHTML(businessData.rating)} <span style="margin-left: 5px;">${businessData.rating.toFixed(1)}</span></div>
        </div>
    `);
    infoWindow.open(map, marker);
}

function generateStarsHTML(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<i class="${i <= rating ? 'fas' : 'far'} fa-star star-icon"></i>`;
    }
    return stars;
}

function getMapStyles() {
    return [
        { elementType: "geometry", stylers: [{ color: "#242f3e" }] }, { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] }, { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] }, { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
        { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] }, { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
        { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] }, { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] }, { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
        { featureType: "poi", stylers: [{ visibility: "off" }] } // Hides points of interest for a cleaner map
    ];
}


// --- PART 2: WEBSITE INTERACTIVITY ---

document.addEventListener('DOMContentLoaded', function() {
    // --- General Setup ---
    const isMobile = window.innerWidth <= 768;

    // Mobile menu toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    mobileMenuToggle.addEventListener('click', () => navLinks.classList.toggle('active'));

    // Dropdown menu logic
    document.querySelectorAll('.nav-links .dropdown > a').forEach(link => {
        link.addEventListener('click', function(e) {
            if (isMobile) {
                e.preventDefault();
                this.parentElement.classList.toggle('open');
            }
        });
    });

    // Close mobile menu when a link is clicked
    document.querySelectorAll('.nav-links a:not(.dropdown > a)').forEach(anchor => {
        anchor.addEventListener('click', () => {
            if (isMobile) navLinks.classList.remove('active');
        });
    });

    // Scroll animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
    
    // Floating menu
    const menuToggle = document.querySelector('.menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            menuToggle.parentElement.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
    }

    // --- Page Specific Initializations ---
    if (document.getElementById('review-qr-code')) {
        generateReviewQRCode();
    }
    initializeForms();
    initializeQuickAskForm();
    
    document.getElementById('currentYear').textContent = new Date().getFullYear();
});

// --- PART 3: FORM HANDLING & HELPERS ---

function initializeQuickAskForm() {
    const quickAskForm = document.getElementById('quick-ask-form');
    if (quickAskForm) {
        quickAskForm.addEventListener('submit', handleQuickAskSubmit);
    }
}

function handleQuickAskSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const button = form.querySelector('button[type="submit"]');
    const askInput = form.querySelector('#quick-ask-input');
    const originalButtonText = button.innerHTML;
    
    if (!askInput.value.trim()) {
        alert("Veuillez décrire votre demande.");
        askInput.focus();
        return;
    }

    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Géolocalisation...';
    button.disabled = true;

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            const userAsk = askInput.value.trim();
            const gmapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

            const text = `🚨 Nouvelle Demande Express 🚨\n\n` +
                         `Demande: ${userAsk}\n\n` +
                         `📍 Ma position: ${gmapsLink}`;
            
            button.innerHTML = originalButtonText;
            button.disabled = false;
            askInput.value = '';

            window.open(`https://wa.me/${businessData.phone.replace(/\s/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
        },
        (error) => {
            alert("Impossible d'obtenir votre position. Veuillez autoriser la géolocalisation dans votre navigateur et réessayer. C'est nécessaire pour une prise en charge rapide.");
            console.error("Geolocation error:", error);
            button.innerHTML = originalButtonText;
            button.disabled = false;
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

function initializeForms() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);

    document.querySelectorAll('input[type="date"]').forEach(input => {
        input.min = today;
        if (!input.value) input.value = today;
    });
    document.querySelectorAll('input[type="time"]').forEach(input => {
        if (!input.value) input.value = currentTime;
    });

    document.querySelectorAll('.booking-form').forEach(form => {
        if (!form.getAttribute('data-event-listener-attached')) {
            form.addEventListener('submit', handleBookingFormSubmit);
            form.setAttribute('data-event-listener-attached', 'true');
        }
    });
}

function handleBookingFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const getVal = (id) => form.querySelector(`#${id}-fr`)?.value || '';
    
    const data = {
        pickup: getVal('pickup'), destination: getVal('destination'),
        date: getVal('date'), time: getVal('time'),
        passengers: getVal('passengers'), name: getVal('name'), 
        phone: getVal('phone'), notes: form.querySelector('#notes-fr')?.value || ''
    };
    
    const text = `Bonjour, je souhaite une réservation VTC:\n\n` +
                 (data.name ? `👤 Nom: ${data.name}\n` : '') +
                 `📞 Téléphone: ${data.phone}\n` +
                 `📍 Départ: ${data.pickup}\n` +
                 `🎯 Destination: ${data.destination}\n` +
                 `📅 Date: ${data.date} à ${data.time}\n` +
                 `👥 Passagers: ${data.passengers}\n` +
                 (data.notes ? `📝 Notes: ${data.notes}\n` : '');

    window.open(`https://wa.me/${businessData.phone.replace(/\s/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
}


function generateReviewQRCode() {
    const qrImg = document.getElementById('review-qr-code');
    if (!qrImg) return;
    const reviewUrl = businessData.reviewUrl; // UPDATED
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(reviewUrl)}`;
}

window.getLocation = function(lang) {
    const input = document.querySelector(`#pickup-${lang}`);
    const originalValue = input.value;
    input.value = "Géolocalisation en cours...";
    navigator.geolocation.getCurrentPosition(
        pos => {
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.display_name) {
                    input.value = data.display_name;
                    input.focus();
                } else {
                   input.value = originalValue; 
                   alert("Adresse non trouvée. Veuillez la saisir manuellement.");
                }
            }).catch(() => {
                input.value = originalValue;
                alert("Erreur lors de la recherche d'adresse.");
            });
        },
        err => {
            input.value = originalValue;
            alert("Impossible d'obtenir la localisation. Veuillez l'autoriser et réessayer.");
        }
    );
};

window.setDestination = function(lang, destination) {
    const destInput = document.querySelector(`#destination-${lang}`);
    destInput.value = destination;
    destInput.focus();
};

// Share Modal
window.shareWebsite = function() { document.getElementById('shareModal').classList.add('active'); };
window.closeShareModal = function() { document.getElementById('shareModal').classList.remove('active'); };
const shareURL = () => encodeURIComponent(window.location.href);
const shareText = () => encodeURIComponent('Découvrez ce service VTC premium à Aix-Marseille !');
window.shareToFacebook = function() { window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareURL()}`, '_blank'); };
window.shareToTwitter = function() { window.open(`https://twitter.com/intent/tweet?url=${shareURL()}&text=${shareText()}`, '_blank'); };
window.shareToLinkedIn = function() { window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${shareURL()}`, '_blank'); };
window.shareByEmail = function() { window.location.href = `mailto:?subject=${shareText()}&body=${shareURL()}`; };
window.copyLink = function() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        const btn = event.target.closest('.copy-link');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copié !';
        setTimeout(() => { btn.innerHTML = originalText; }, 2000);
    });
};