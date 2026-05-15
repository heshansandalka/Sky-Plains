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

// Trip Planner Modal පාලනය
function openItinerary() {
    document.getElementById('tripModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeTripModal() {
    document.getElementById('tripModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

function closeModal() {
    document.getElementById('aiModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Gemini AI හරහා Plan එක සෑදීම
async function generateAITripPlan() {
    const days = document.getElementById('tripDays').value;
    const interests = document.getElementById('tripInterests').value;
    const modalBody = document.getElementById('modalBody');
    const aiModal = document.getElementById('aiModal');

    if (!days || !interests) {
        alert("Please fill in both fields!");
        return;
    }

    // Input Modal එක වසා Result Modal එක පෙන්වීම
    closeTripModal();
    modalBody.innerHTML = `<div class="text-center py-10"><div class="loader mx-auto"></div><p class="mt-4 text-amber-900 font-medium">Gemini is crafting your itinerary...</p></div>`;
    aiModal.classList.add('active');

    // Gemini සඳහා දෙන Prompt එක
    const tripPrompt = `As an expert Sri Lankan tour guide, create a professional ${days} travel itinerary for Horton Plains. The user's interests are: ${interests}. Format the response with clear day-by-day headings.`;

    try {
        // ඔබ සතුව ඇති callGemini function එක මෙහිදී භාවිතා වේ
        const result = await callGemini(tripPrompt); 
        
        modalBody.innerHTML = `
            <div class="text-left p-2 max-h-[75vh] overflow-y-auto">
                <h2 class="text-2xl font-serif font-bold text-amber-900 mb-4 border-b pb-2">Your Personal Trip Plan</h2>
                <div class="prose prose-amber text-gray-800 leading-relaxed">
                    ${result.split('\n').map(line => line ? `<p class="mb-2">${line}</p>` : '<br>').join('')}
                </div>
                <button onclick="closeModal()" class="mt-8 w-full bg-amber-800 text-white py-3 rounded-xl font-bold hover:bg-amber-900 transition-colors shadow-lg">Done Reading</button>
            </div>`;
    } catch (e) {
        console.error("AI Error:", e);
        modalBody.innerHTML = `<p class="text-red-500 p-6 text-center">AI could not generate the plan. Please check your API connection.</p>`;
    }
}
async function callGemini(prompt) {
    const API_KEY = "AIzaSyCiLrYeDfS6aZ4u4Eg0bRY-go2wpPcLyAE"; // ඔබ ලබාගත් API Key එක
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // පිළිතුරේ ව්‍යුහය පරීක්ෂා කර ආරක්ෂිතව දත්ත ලබා ගැනීම
        const candidate = data?.candidates?.[0];
        const textResponse = candidate?.content?.parts?.[0]?.text;

        if (textResponse) {
            return textResponse;
        } else {
            console.warn("Gemini returned an empty response structure:", data);
            return "I'm sorry, I couldn't generate a plan right now. Please try again.";
        }

    } catch (error) {
        console.error("Gemini API Error:", error);
        // Error එකක් throw කරනවා වෙනුවට පරිශීලකයාට පෙන්විය හැකි පණිවිඩයක් යවමු
        return "Connection failed. Please check your internet or API key.";
    }
}

