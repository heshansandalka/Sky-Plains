// 1. මුලින්ම API Key එක Define කරන්න (ඔබේ Key එක මෙතැනට දාන්න)
const apiKey = "AIzaSyAO5oXRQfDSwC2u-7WcMv5eO4nppQ0_F1E"; 

const galleryItems = [
    { id: 1, title: "Horton Plains", img: "LK751R0100-05-E-1280-720.webp", desc: "The misty highlands." },
    { id: 2, title: "Lion Fortress", img: "01.jpg", desc: "Ancient rock fortress." },
    { id: 3, title: "Nature Trail", img: "LK751R0100-06-E-1280-720.webp", desc: "Walking through the mist." },
    { id: 4, title: "Whale Watching", img: "a27d24_371289c199dc49ffbd44e8e89ebba619~mv2.avif", desc: "Pristine waters." },
    { id: 5, title: "Endemic Birds", img: "Rufous-Babbler-1024x765.jpg", desc: "Sri Lankan Rufous Babbler." },
    { id: 6, title: "Cloud Forest", img: "horton-plains16.jpg", desc: "The heart of Horton Plains." },
    { id: 7, title: "Blue Magpie", img: "270_200_1_1588075838_CeylonBlueMagpie.jpg", desc: "Ceylon Blue Magpie." },
    { id: 8, title: "Scenic Views", img: "speed.jpg", desc: "Nature at its best." },
    { id: 9, title: "Whistling Thrush", img: "Hortain (1).jpg", desc: "Rare birds." },
    { id: 10, title: "Waterfall Trail", img: "horton3.jpg", desc: "Hidden waterfalls." },
    { id: 11, title: "Baker's Falls", img: "01 (1).jpg", desc: "Famous waterfall in the park." },
    { id: 12, title: "Pied Bush Chat", img: "pied-bush-chat-or-saxicola-caprata-at-horton-plains-national-reserve-HJR1P9.jpg", desc: "Wildlife photography." },
    { id: 13, title: "Highland Forest", img: "kitulgala-nuwara-eliya-horton-plains-op-10 (1).jpg", desc: "Lush greenery." },
    { id: 14, title: "World's End", img: "LK75010200-01-E-1280-720.jpg", desc: "Breath-taking drop." },
    { id: 15, title: "Morning Mist", img: "LK751R0100-01-E-1280-720.webp", desc: "Golden hour in the plains." }
];

// 2. DOMContentLoaded එක ඇතුළේ function එක call කරන්න
document.addEventListener('DOMContentLoaded', () => {
    renderGallery();
});

function renderGallery() {
    const galleryContainer = document.getElementById('galleryGrid');
    if (!galleryContainer) {
        console.error("Gallery container not found!");
        return;
    }

    galleryContainer.innerHTML = galleryItems.map(item => `
        <div class="group overflow-hidden rounded-2xl bg-white shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer" onclick="askAI('${item.title}')">
            <div class="relative overflow-hidden h-64">
                <img src="${item.img}" alt="${item.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" onerror="this.src='https://via.placeholder.com/400x300?text=Image+Not+Found'">
            </div>
            <div class="p-4">
                <h3 class="font-bold text-lg text-amber-900">${item.title}</h3>
                <p class="text-gray-500 text-sm">${item.desc || 'Explore the beauty of Sri Lanka.'}</p>
            </div>
        </div>
    `).join('');
}

// 3. callGemini function එක නිවැරදි කිරීම
async function callGemini(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            return data.candidates[0].content.parts[0].text;
        } else {
            return "Could not generate content at this time.";
        }
    } catch (e) {
        console.error("AI Error:", e);
        return "The AI is currently offline.";
    }
}

// Modal helper functions
function closeModal() { document.getElementById('aiModal').classList.remove('active'); }
function openUploadModal() { document.getElementById('uploadModal').classList.add('active'); }
function closeUploadModal() { document.getElementById('uploadModal').classList.remove('active'); }

async function askAI(topic) {
    const modalBody = document.getElementById('modalBody');
    const modal = document.getElementById('aiModal');
    
    modalBody.innerHTML = `<div class="text-center py-10"><div class="loader mx-auto"></div><p class="mt-4">Learning more about ${topic}...</p></div>`;
    modal.classList.add('active');

    const prompt = `Write a short, luxurious 3-sentence travel blurb about ${topic} in Sri Lanka.`;
    const result = await callGemini(prompt);
    
    modalBody.innerHTML = `
        <div class="p-2">
            <h2 class="text-3xl font-serif font-bold text-amber-900 mb-4">${topic}</h2>
            <p class="leading-relaxed text-gray-700 italic text-lg">"${result}"</p>
            <button onclick="closeModal()" class="mt-8 w-full bg-amber-800 text-white py-3 rounded-xl font-bold hover:bg-amber-900 transition-colors">Close Explorer</button>
        </div>
    `;
}

function openRoadMap() {
    const destination = encodeURIComponent("Horton Plains National Park, Sri Lanka");
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
}

document.querySelector('.md\:hidden').addEventListener('click', function() {
    document.getElementById('nav-menu').classList.toggle('hidden');
    document.getElementById('nav-menu').classList.toggle('flex');
    document.getElementById('nav-menu').classList.toggle('flex-col');
    document.getElementById('nav-menu').classList.toggle('absolute');
    document.getElementById('nav-menu').classList.toggle('top-16');
    document.getElementById('nav-menu').classList.toggle('left-0');
    document.getElementById('nav-menu').classList.toggle('w-full');
    document.getElementById('nav-menu').classList.toggle('bg-white');
    document.getElementById('nav-menu').classList.toggle('p-6');
});

function addNewCard() {
    const title = document.getElementById('newTitle').value;
    const desc = document.getElementById('newDesc').value;
    const imageFile = document.getElementById('imageInput').files[0];

    if (!title || !imageFile) {
        alert("කරුණාකර නමක් සහ පින්තූරයක් තෝරන්න!");
        return;
    }

    const reader = new FileReader();

    // පින්තූරය කියවා අවසන් වූ පසු ක්‍රියාත්මක වේ
    reader.onload = function(e) {
        const newId = galleryItems.length + 1;
        const newImageSrc = e.target.result; // මෙය පින්තූරයේ data (Base64) වේ

        // අලුත් item එක Array එකේ මුලටම එකතු කිරීම
        galleryItems.unshift({
            id: newId,
            title: title,
            img: newImageSrc,
            desc: desc || "Added by user"
        });

        // Gallery එක නැවත Render කිරීම
        renderGallery();
        
        // Modal එක වසා දමා Input fields clear කිරීම
        closeUploadModal();
        clearInputs();
    };

    reader.readAsDataURL(imageFile);
}

function clearInputs() {
    document.getElementById('newTitle').value = "";
    document.getElementById('newDesc').value = "";
    document.getElementById('imageInput').value = "";
}

// Modal එක විවෘත කිරීමට
function openUploadModal() {
    const modal = document.getElementById('uploadModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // පිටුව Scroll වීම නවත්වයි
}

// Modal එක වැසීමට
function closeUploadModal() {
    const modal = document.getElementById('uploadModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto'; // නැවත Scroll වීමට ඉඩ දෙයි
}

// Modal එකෙන් පිටත Click කළහොත් වැසීමට
window.onclick = function(event) {
    const modal = document.getElementById('uploadModal');
    if (event.target == modal) {
        closeUploadModal();
    }
}