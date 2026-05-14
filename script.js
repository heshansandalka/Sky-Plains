import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyAO5oXRQfDSwC2u-7WcMv5eO4nppQ0_F1E");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function run() {
  const prompt = "සැප සනීප කොහොමද?";
  const result = await model.generateContent(prompt);
  console.log(result.response.text());
}

run();
const galleryItems = [
    { id: 1, title: "Horton plains", img: "LK751R0100-05-E-1280-720.webp", desc: "The ancient lion fortress." },
    { id: 2, title: "Horton plains", img: "01.jpg", desc: "The famous railway bridge in Ella." },
    { id: 3, title: "Horton plains", img: "LK751R0100-06-E-1280-720.webp" },
    { id: 4, title: "Horton plains", img: "a27d24_371289c199dc49ffbd44e8e89ebba619~mv2.avif", desc: "Pristine waters and whale watching." },
    { id: 5, title: "Horton plains", img: "Rufous-Babbler-1024x765.jpg", desc: "Pristine waters and whale watching." },
    { id: 6, title: "Horton plains", img: "horton-plains16.jpg", desc: "Pristine waters and whale watching." },
    { id: 7, title: "Horton plains", img: "270_200_1_1588075838_CeylonBlueMagpie.jpg", desc: "Pristine waters and whale watching." },
    { id: 8, title: "Horton plains", img: "speed.jpg", desc: "Pristine waters and whale watching." },
    { id: 9, title: "Horton plains", img: "Sri-Lanka-Whistling-Thrush_DSC1323-Enhanced-NR_Horton-Plains-Sri-Lanka-Mar-19-2025-1160x770.jpg", desc: "Pristine waters and whale watching." },
    { id: 10, title: "Horton plains", img: "kitulgala-nuwara-eliya-horton-plains-op-12.jpg", desc: "Pristine waters and whale watching." },
    { id: 11, title: "Horton plains", img: "01 (1).jpg", desc: "Pristine waters and whale watching." },
    { id: 12, title: "Horton plains", img: "pied-bush-chat-or-saxicola-caprata-at-horton-plains-national-reserve-HJR1P9.jpg", desc: "Pristine waters and whale watching." },
    { id: 13, title: "Horton plains", img: "kitulgala-nuwara-eliya-horton-plains-op-10 (1).jpg", desc: "Pristine waters and whale watching." },
    { id: 14, title: "Horton plains", img: "LK75010200-01-E-1280-720.jpg", desc: "Pristine waters and whale watching." },
    { id: 15, title: "Horton plains", img: "LK751R0100-01-E-1280-720.webp", desc: "Pristine waters and whale watching." }
    
];

document.addEventListener('DOMContentLoaded', () => {
    renderGallery();
});

function renderGallery() {
    const galleryContainer = document.getElementById('galleryGrid');
    if(!galleryContainer) return;

    galleryContainer.innerHTML = galleryItems.map(item => `
        <div class="group overflow-hidden rounded-2xl bg-white shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer" onclick="askAI('${item.title}')">
            <div class="relative overflow-hidden h-64">
                <img src="${item.img}" alt="${item.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
            </div>
            <div class="p-4">
                <h3 class="font-bold text-lg text-amber-900">${item.title}</h3>
                <p class="text-gray-500 text-sm">${item.desc}</p>
            </div>
        </div>
    `).join('');
}

async function askAI(topic) {
    showLoading(`Learning more about ${topic}...`);
    const prompt = `Write a short, luxurious 3-sentence travel blurb about ${topic} in Sri Lanka.`;
    const result = await callGemini(prompt);
    
    document.getElementById('modalBody').innerHTML = `
        <div class="p-2">
            <h2 class="text-3xl font-serif font-bold text-amber-900 mb-4">${topic}</h2>
            <p class="leading-relaxed text-gray-700 italic text-lg">"${result}"</p>
            <button onclick="closeModal()" class="mt-8 w-full bg-amber-800 text-white py-3 rounded-xl font-bold">Close Explorer</button>
        </div>
    `;
}

async function callGemini(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (e) {
        return "The AI is currently offline.";
    }
}

// Modal helper functions
function closeModal() { document.getElementById('aiModal').classList.remove('active'); }
function openUploadModal() { document.getElementById('uploadModal').classList.add('active'); }
function closeUploadModal() { document.getElementById('uploadModal').classList.remove('active'); }
function showLoading(msg) {
    document.getElementById('modalBody').innerHTML = `<div class="text-center py-10"><p>${msg}</p></div>`;
    document.getElementById('aiModal').classList.add('active');
    
}



function openRoadMap() {
   
    const destination = encodeURIComponent("Horton Plains National Park, Sri Lanka");
    
    
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    
    
    window.open(googleMapsUrl, '_blank');
}
function toggleLike(btn) {
    const icon = document.getElementById('likeIcon');
    const text = document.getElementById('likeText');
    
    // Toggle state
    if (btn.classList.contains('bg-amber-700')) {
        // Unlike state
        btn.classList.remove('bg-amber-700', 'text-white');
        btn.classList.add('bg-white', 'text-amber-700');
        text.innerText = "Like our mission";
    } else {
        // Like state
        btn.classList.remove('bg-white', 'text-amber-700');
        btn.classList.add('bg-amber-700', 'text-white');
        text.innerText = "Thanks for the love!";
        
        // Simple pop animation for the heart
        icon.classList.add('animate-bounce');
        setTimeout(() => icon.classList.remove('animate-bounce'), 1000);
    }
}