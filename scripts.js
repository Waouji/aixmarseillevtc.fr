// === VTC Aix-Marseille - MODERN SCRIPTS WITH EXPRESS BUTTON ===

// === GLOBAL CONFIG ===
const CONFIG = {
    businessData: {
        placeId: 'ChIJq91hT37csBIRb6oNxMGAwKk',
        reviewUrl: 'https://tinyurl.com/3r5juu95',
        location: { lat: 43.4689, lng: 5.3444 },
        name: 'VTC Aix-Marseille Premium',
        phone: '+33743542309',
        rating: 5.0,
        reviewsCount: 20
    }
};

let map, placesService, marker, infoWindow;

// === GOOGLE MAPS INITIALIZATION ===
window.initMaps = function() {
    try {
        if (document.getElementById("map")) {
            initBusinessMap();
            fetchBusinessDetails();
        }
    } catch (error) {
        console.error('Maps init error:', error);
    }
};

function initBusinessMap() {
    try {
        map = new google.maps.Map(document.getElementById("map"), {
            center: CONFIG.businessData.location,
            zoom: 12,
            mapTypeControl: false,
            streetViewControl: false,
            styles: getMapStyles()
        });

        placesService = new google.maps.places.PlacesService(map);
        infoWindow = new google.maps.InfoWindow({ maxWidth: 320 });

        marker = new google.maps.Marker({
            position: CONFIG.businessData.location,
            map: map,
            animation: google.maps.Animation.DROP,
            title: CONFIG.businessData.name
        });
        
        marker.addListener('click', showBusinessInfoWindow);
    } catch (error) {
        console.error('Map init error:', error);
    }
}

function fetchBusinessDetails() {
    if (!placesService) return;
    
    placesService.getDetails({
        placeId: CONFIG.businessData.placeId,
        fields: ['name', 'formatted_address', 'formatted_phone_number', 'rating', 'user_ratings_total', 'reviews']
    }, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            Object.assign(CONFIG.businessData, {
                name: place.name || CONFIG.businessData.name,
                address: place.formatted_address || CONFIG.businessData.address,
                rating: place.rating || CONFIG.businessData.rating,
                reviewsCount: place.user_ratings_total || CONFIG.businessData.reviewsCount
            });
            updateBusinessUI();
            displayReviews(place.reviews);
        }
    });
}

function updateBusinessUI() {
    const updates = {
        'average-rating': CONFIG.businessData.rating.toFixed(1),
        'rating-stars': generateStarsHTML(CONFIG.businessData.rating),
        'review-count': `${CONFIG.businessData.reviewsCount} avis`
    };
    
    Object.entries(updates).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = value;
    });
}

function displayReviews(reviews) {
    const container = document.getElementById('reviews-container');
    if (!container || !Array.isArray(reviews)) return;

    container.innerHTML = reviews.slice(0, 6).map(review => {
        const avatar = review.author_name.charAt(0).toUpperCase();
        const hue = (avatar.charCodeAt(0) * 137.508) % 360;
        return `
            <div class="review-card fade-in">
                <div class="review-header">
                    <div class="review-avatar" style="background: hsl(${hue}, 60%, 60%)">${avatar}</div>
                    <div>
                        <div class="review-author">${review.author_name}</div>
                        <div class="review-date">${new Date(review.time * 1000).toLocaleDateString('fr-FR')}</div>
                    </div>
                </div>
                <div class="review-stars">${generateStarsHTML(review.rating)}</div>
                <div class="review-content">${review.text || "<i>Aucun commentaire</i>"}</div>
            </div>`;
    }).join('');
}

function generateStarsHTML(rating) {
    return Array.from({length: 5}, (_, i) => 
        `<i class="${i < rating ? 'fas' : 'far'} fa-star star-icon"></i>`
    ).join('');
}

function showBusinessInfoWindow() {
    if (!infoWindow) return;
    infoWindow.setContent(`
        <div style="font-family: 'Inter', sans-serif; padding: 5px;">
            <strong style="color: #D4AF37;">${CONFIG.businessData.name}</strong>
            <div style="margin: 8px 0;">${generateStarsHTML(CONFIG.businessData.rating)} ${CONFIG.businessData.rating.toFixed(1)}</div>
        </div>
    `);
    infoWindow.open(map, marker);
}

function getMapStyles() {
    return [
        { elementType: "geometry", stylers: [{ color: "#0a0a0a" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#D4AF37" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#1a1a1a" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d1117" }] },
        { featureType: "poi", stylers: [{ visibility: "off" }] }
    ];
}

// === EXPRESS DEMAND BUTTON - SIMPLIFIED ===
function initExpressButton() {
    const expressBtn = document.getElementById('express-demand-btn');
    if (!expressBtn) return;

    expressBtn.addEventListener('click', handleExpressDemand);
}

function handleExpressDemand() {
    const btn = document.getElementById('express-demand-btn');
    if (!btn) return;

    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fab fa-whatsapp fa-spin"></i> Localisation...';
    btn.disabled = true;

    if (!navigator.geolocation) {
        alert("Géolocalisation non supportée");
        resetButton(btn, originalHTML);
        return;
    }

    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords;
            const gmapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
            
            const message = `🚨 DEMANDE EXPRESS VTC 🚨\n\n` +
                          `Je suis ici et j'ai besoin d'un chauffeur maintenant:\n` +
                          `📍 ${gmapsLink}\n\n` +
                          `Merci de me contacter rapidement !`;

            resetButton(btn, originalHTML);
            window.open(`https://wa.me/${CONFIG.businessData.phone.replace(/\s/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
        },
        error => {
            console.error('Geolocation error:', error);
            alert(getGeolocationError(error.code));
            resetButton(btn, originalHTML);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

function getGeolocationError(code) {
    const errors = {
        1: "Veuillez autoriser la géolocalisation",
        2: "Position indisponible",
        3: "Délai expiré"
    };
    return errors[code] || "Erreur inconnue";
}

function resetButton(btn, html) {
    btn.innerHTML = html;
    btn.disabled = false;
}

// === MAIN INITIALIZATION ===
document.addEventListener('DOMContentLoaded', function() {
    try {
        initMobileMenu();
        initScrollAnimations();
        initFloatingMenu();
        initExpressButton();
        initializeForms();
        generateReviewQRCode();
        updateCopyrightYear();
    } catch (error) {
        console.error('Init error:', error);
    }
});

function initMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (toggle && navLinks) {
        toggle.addEventListener('click', () => navLinks.classList.toggle('active'));
        
        // Close on link click
        document.querySelectorAll('.nav-links a:not(.dropdown > a)').forEach(link => {
            link.addEventListener('click', () => navLinks.classList.remove('active'));
        });
    }

    // Dropdown for mobile
    document.querySelectorAll('.nav-links .dropdown > a').forEach(link => {
        link.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                this.parentElement.classList.toggle('open');
            }
        });
    });
}

function initScrollAnimations() {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

function initFloatingMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            menuToggle.parentElement.classList.toggle('active');
        });
    }
}

// === FORMS ===
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
        if (!form.dataset.listenerAttached) {
            form.addEventListener('submit', handleBookingSubmit);
            form.dataset.listenerAttached = 'true';
        }
    });
}

function handleBookingSubmit(e) {
    e.preventDefault();
    const form = e.target;
    
    const data = {
        pickup: form.querySelector('#pickup-fr')?.value,
        destination: form.querySelector('#destination-fr')?.value,
        date: form.querySelector('#date-fr')?.value,
        time: form.querySelector('#time-fr')?.value,
        passengers: form.querySelector('#passengers-fr')?.value,
        phone: form.querySelector('#phone-fr')?.value,
        notes: form.querySelector('#notes-fr')?.value || ''
    };
    
    if (!data.phone || !data.pickup || !data.destination) {
        alert('Veuillez remplir tous les champs obligatoires.');
        return;
    }
    
    const message = `🚗 RÉSERVATION VTC\n\n` +
                   `📞 ${data.phone}\n` +
                   `📍 Départ: ${data.pickup}\n` +
                   `🎯 Arrivée: ${data.destination}\n` +
                   `📅 ${data.date} à ${data.time}\n` +
                   `👥 ${data.passengers} passager(s)\n` +
                   (data.notes ? `📝 ${data.notes}` : '');

    window.open(`https://wa.me/${CONFIG.businessData.phone.replace(/\s/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
}

// === UTILITY FUNCTIONS ===
function generateReviewQRCode() {
    const qrImg = document.getElementById('review-qr-code');
    if (!qrImg) return;
    
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(CONFIG.businessData.reviewUrl)}`;
    qrImg.onerror = () => {
        qrImg.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="%23ccc"/></svg>';
    };
}

function updateCopyrightYear() {
    const yearEl = document.getElementById('currentYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
}

// === GLOBAL FUNCTIONS (for inline handlers) ===
window.getLocation = function(lang) {
    const input = document.querySelector(`#pickup-${lang}`);
    if (!input) return;
    
    const originalValue = input.value;
    input.value = "Géolocalisation...";
    
    navigator.geolocation.getCurrentPosition(
        pos => {
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`)
                .then(res => res.json())
                .then(data => {
                    input.value = data.display_name || originalValue;
                })
                .catch(() => {
                    input.value = originalValue;
                    alert("Erreur de géolocalisation");
                });
        },
        () => {
            input.value = originalValue;
            alert("Géolocalisation refusée");
        }
    );
};

window.setDestination = function(lang, destination) {
    const input = document.querySelector(`#destination-${lang}`);
    if (input) input.value = destination;
};

// === SHARE MODAL ===
window.shareWebsite = function() {
    const modal = document.getElementById('shareModal');
    if (modal) modal.classList.add('active');
};

window.closeShareModal = function() {
    const modal = document.getElementById('shareModal');
    if (modal) modal.classList.remove('active');
};

const shareURL = () => encodeURIComponent(window.location.href);
const shareText = () => encodeURIComponent('Service VTC Premium à Aix-Marseille');

window.shareToFacebook = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareURL()}`, '_blank');
window.shareToTwitter = () => window.open(`https://twitter.com/intent/tweet?url=${shareURL()}&text=${shareText()}`, '_blank');
window.shareToLinkedIn = () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${shareURL()}`, '_blank');
window.shareByEmail = () => window.location.href = `mailto:?subject=${shareText()}&body=${shareURL()}`;

window.copyLink = function() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        const btn = event.target.closest('.copy-link');
        if (btn) {
            const original = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> Copié !';
            setTimeout(() => btn.innerHTML = original, 2000);
        }
    }).catch(() => alert('Erreur de copie'));
};