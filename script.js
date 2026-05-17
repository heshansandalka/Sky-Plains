// --- 1. Navigation & UI Controls ---

// Mobile Menu එක විවෘත කිරීමට සහ වැසීමට
function toggleMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    if (navLinks) {
        navLinks.classList.toggle('show');
    }
}

// Modal පාලනය කරන functions
function closeModal() { 
    document.getElementById('aiModal').classList.remove('active'); 
}

function openUploadModal() { 
    document.getElementById('uploadModal').classList.add('active'); 
    document.body.style.overflow = 'hidden'; 
}

function closeUploadModal() { 
    document.getElementById('uploadModal').classList.remove('active'); 
    document.body.style.overflow = 'auto'; 
}

function clearInputs() {
    document.getElementById('newTitle').value = "";
    document.getElementById('newDesc').value = "";
    document.getElementById('imageInput').value = "";
}

// --- 2. Firebase Data Handling ---

// පිටුව load වූ පසු Firestore සම්බන්ධ කිරීම
document.addEventListener('DOMContentLoaded', () => {
    // Firebase functions window එකට load වන තෙක් තත්පරයක් රැඳී සිටීම
    setTimeout(() => {
        if (window.db && window.dbFunctions) {
            listenToCloudGallery();
        } else {
            console.error("Firebase not initialized properly.");
        }
    }, 1000);
});

// Real-time දත්ත ලබා ගැනීම (Cloud Firestore)
function listenToCloudGallery() {
    const galleryGrid = document.getElementById('galleryGrid');
    if (!galleryGrid) return;

    const q = window.dbFunctions.query(
        window.dbFunctions.collection(window.db, "birds"), 
        window.dbFunctions.orderBy("createdAt", "desc")
    );

    window.dbFunctions.onSnapshot(q, (snapshot) => {
        let htmlContent = "";
        
        if (snapshot.empty) {
            htmlContent = `<p class="text-center text-gray-500 col-span-full py-10">No birds found. Add your first photo!</p>`;
        } else {
            snapshot.forEach((doc) => {
                const item = doc.data();
                htmlContent += `
                    <div class="group overflow-hidden rounded-2xl bg-white shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer" onclick="askAI('${item.title}')">
                        <div class="relative overflow-hidden h-64">
                            <img src="${item.img}" alt="${item.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" onerror="this.src='https://via.placeholder.com/400x300?text=Image+Error'">
                        </div>
                        <div class="p-4">
                            <h3 class="font-bold text-lg text-amber-900">${item.title}</h3>
                            <p class="text-gray-500 text-sm">${item.desc || 'A beautiful resident of Sri Lanka.'}</p>
                        </div>
                    </div>`;
            });
        }
        galleryGrid.innerHTML = htmlContent;
    });
}

// අලුත් පින්තූරයක් ඇතුළත් කිරීම
async function addNewCard() {
    const title = document.getElementById('newTitle').value;
    const desc = document.getElementById('newDesc').value;
    const imageFile = document.getElementById('imageInput').files[0];

    if (!title || !imageFile) {
        alert("Please enter title and select an image!");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.src = e.target.result;
        img.onload = async function() {
            // පින්තූරය කුඩා කිරීමට Canvas එකක් භාවිතා කිරීම
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800; // පින්තූරයේ පළල 800px ට අඩු කිරීම
            const scaleSize = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // පින්තූරයේ Quality එක 0.7 (70%) දක්වා අඩු කර Base64 ලබා ගැනීම
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);

            try {
                await window.dbFunctions.addDoc(window.dbFunctions.collection(window.db, "birds"), {
                    title: title,
                    desc: desc || "Nature wonder",
                    img: compressedBase64,
                    createdAt: new Date()
                });
                
                closeUploadModal();
                clearInputs();
                alert("Image added successfully!");
            } catch (error) {
                console.error("Firebase Error: ", error);
                alert("Error adding data!");
            }
        };
    };
    reader.readAsDataURL(imageFile);
}
// --- 3. AI Features ---

async function askAI(topic) {
    const modalBody = document.getElementById('modalBody');
    const modal = document.getElementById('aiModal');
    
    modalBody.innerHTML = `<div class="text-center py-10"><div class="loader mx-auto"></div><p class="mt-4">Asking AI about ${topic}...</p></div>`;
    modal.classList.add('active');

    try {
        // index.html හි ඇති callGemini function එක භාවිතා කරයි
        const prompt = `Write a short, luxurious 3-sentence travel blurb about ${topic} bird in Sri Lanka.`;
        const result = await callGemini(prompt); 
        modalBody.innerHTML = `
            <div class="p-2">
                <h2 class="text-3xl font-serif font-bold text-amber-900 mb-4">${topic}</h2>
                <p class="leading-relaxed text-gray-700 italic text-lg">"${result}"</p>
                <button onclick="closeModal()" class="mt-8 w-full bg-amber-800 text-white py-3 rounded-xl font-bold hover:bg-amber-900 transition-colors">Close Explorer</button>
            </div>`;
    } catch (e) {
        modalBody.innerHTML = `<p class="text-red-500 p-4">AI could not fetch information.</p>`;
    }
}

function openRoadMap() {
    const destination = encodeURIComponent("Horton Plains National Park, Sri Lanka");
    // සැබෑ Google Maps ලින්ක් එක භාවිතා කරන්න
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
}

// --- Modal පාලනය ---
function openItinerary() {
    document.getElementById('tripModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeTripModal() {
    const tripModal = document.getElementById('tripModal');
    if (tripModal) tripModal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function closeModal() {
    const aiModal = document.getElementById('aiModal');
    if (aiModal) aiModal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// --- Gemini API එකට Call කරන ප්‍රධාන Function එක ---
async function callGemini(prompt) {
    // ඔබේ අලුත්ම API Key එක මෙතැනට දාන්න
    const API_KEY = "AIzaSyDPjBhMdrszeJJO15EnwK-df0CLmGy9S5A"; 
    
    // URL එක මෙලෙස තනි පේළියට ලියන්න. 
    // වැදගත්: ?key= පස්සේ කිසිම Space එකක් හෝ Quote එකක් තියෙන්න බෑ.
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + API_KEY;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        const data = await response.json();

        // පිළිතුර සාර්ථක දැයි බැලීම
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            return data.candidates[0].content.parts[0].text;
        } else {
            // මොකක් හරි Error එකක් ආවොත් ඒක කෙලින්ම UI එකේ පෙන්වමු
            const errorMsg = data.error ? data.error.message : "Structure Error";
            console.error("Gemini Error:", errorMsg);
            return "Error: " + errorMsg;
        }
    } catch (error) {
        console.error("Network Error:", error);
        return "Connection failed. Please check your internet.";
    }
}
// --- ප්ලෑන් එක සහ කාලගුණය සාදන Function එක ---
async function generateAITripPlan() {
    const days = document.getElementById('tripDays').value;
    const interests = document.getElementById('tripInterests').value;
    const modalBody = document.getElementById('modalBody');
    const aiModal = document.getElementById('aiModal');

    if (!days || !interests) {
        alert("Please fill in both fields!");
        return;
    }

    // Modal එක සකස් කිරීම
    closeTripModal();
    aiModal.classList.add('active');
    modalBody.innerHTML = `
        <div class="text-center py-20">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-amber-800 mb-4"></div>
            <p class="text-amber-900 font-medium italic">Gemini is checking weather and crafting your journey...</p>
        </div>`;

    // Gemini සඳහා Prompt එක
    const prompt = `As a Sri Lankan travel expert, create a ${days} day travel itinerary for Horton Plains focusing on ${interests}. 
    Start with a section titled "Weather Insight" about typical ${new Date().toLocaleString('default', { month: 'long' })} weather. 
    Then list the daily plan. Use "Day X:" as headings and use emojis.`;

    const result = await callGemini(prompt); 

    if (!result) {
        modalBody.innerHTML = `
            <div class="p-6 text-center">
                <p class="text-red-600 mb-4">Connection failed. Please check your internet or API key.</p>
                <button onclick="closeModal()" class="bg-gray-200 px-6 py-2 rounded-xl">Close</button>
            </div>`;
        return;
    }

    // සාර්ථකව දත්ත ලැබුණාම UI එක පෙන්වීම
    modalBody.innerHTML = `
        <div class="text-left p-2">
            <div class="bg-amber-50 p-6 rounded-2xl mb-6 border-l-8 border-amber-800 shadow-sm flex justify-between items-center">
                <div>
                    <h2 class="text-2xl font-serif font-bold text-amber-900 mb-1">Your Custom Journey</h2>
                    <p class="text-amber-700 text-sm italic">${days} Day Plan • For ${interests}</p>
                </div>
                <div class="text-4xl animate-bounce">☀️</div>
            </div>

            <div class="px-2 space-y-4 overflow-y-auto max-h-[60vh] custom-scrollbar text-gray-800">
                ${result.split('\n').map(line => {
                    let trimmed = line.trim();
                    if (!trimmed) return '';

                    if (trimmed.toLowerCase().includes('weather')) {
                        return `<div class="bg-blue-50 p-4 rounded-xl border border-blue-200 my-4 shadow-sm">
                                    <h3 class="text-blue-800 font-bold flex items-center gap-2 mb-1">☁️ Weather Insight</h3>
                                    <p class="text-blue-900 text-sm">${trimmed}</p>
                                </div>`;
                    }
                    if (trimmed.toLowerCase().startsWith('day')) {
                        return `<h3 class="text-xl font-bold text-amber-800 mt-6 mb-2 border-b-2 border-amber-100 pb-1">${trimmed}</h3>`;
                    }
                    if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
                        return `<li class="ml-4 mb-2 list-none flex items-start"><span class="text-amber-600 mr-2">🌿</span> ${trimmed.replace(/[*|-]/g, '').trim()}</li>`;
                    }
                    return `<p class="mb-2 leading-relaxed">${trimmed}</p>`;
                }).join('')}
            </div>

            <button onclick="closeModal()" class="mt-8 w-full bg-amber-800 text-white py-4 rounded-2xl font-bold hover:bg-amber-900 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 text-lg">
                <span>Done Reading</span> ✅
            </button>
        </div>`;
}

// --- 4. Like Button Toggle Function ---
function toggleLike(button) {
    const likeIcon = document.getElementById('likeIcon');
    const likeText = document.getElementById('likeText');
    
    // බටන් එක දැනටමත් ලයික් කරලාද බලන්න ක්ලාස් එකක් චෙක් කරනවා
    const isLiked = button.classList.contains('bg-amber-700');

    if (!isLiked) {
        // ලයික් කළ විට බටන් එක සම්පූර්ණ තද පාටක් කරනවා
        button.classList.remove('bg-white', 'text-amber-700', 'hover:bg-amber-50');
        button.classList.add('bg-amber-700', 'text-white', 'hover:bg-amber-800');
        likeText.innerText = "Mission Liked!";
        likeIcon.innerText = "💖";
    } else {
        // නැවත ක්ලික් කරලා ලයික් එක අයින් කළ විට පරණ තත්වයට පත් කරනවා
        button.classList.remove('bg-amber-700', 'text-white', 'hover:bg-amber-800');
        button.classList.add('bg-white', 'text-amber-700', 'hover:bg-amber-50');
        likeText.innerText = "Like our mission";
        likeIcon.innerText = "❤️";
    }
}