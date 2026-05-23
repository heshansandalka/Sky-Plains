// --- 1. Navigation & UI Controls ---

//To open and close the mobile menu
function toggleMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    if (navLinks) {
        navLinks.classList.toggle('show');
    }
}

//Modal control functions
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

//Connecting to Firestore after the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait a second for the Firebase functions window to load.
    setTimeout(() => {
        if (window.db && window.dbFunctions) {
            listenToCloudGallery();
        } else {
            console.error("Firebase not initialized properly.");
        }
    }, 1000);
});

// Real-time data retrieval (Cloud Firestore)
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

// Inserting a new picture
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
            // Using a Canvas to make the image smaller
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800; // Reducing the image width to 800px
            const scaleSize = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Reduce the image quality to 0.7 (70%) and get Base64
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
        // Uses the callGemini function in index.html
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
    // Use the real Google Maps link
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
}

// --- Modal cotrol ---
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

// ---The main function that calls the Gemini API is ---
async function callGemini(prompt) {
    
    const API_KEY = "AIzaSyDPjBhMdrszeJJO15EnwK-df0CLmGy9S5A"; 
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

// Check if the response was successful
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            return data.candidates[0].content.parts[0].text;
        } else {
            // If there is an error, we will display it directly in the UI.
            const errorMsg = data.error ? data.error.message : "Structure Error";
            console.error("Gemini Error:", errorMsg);
            return "Error: " + errorMsg;
        }
    } catch (error) {
        console.error("Network Error:", error);
        return "Connection failed. Please check your internet.";
    }
}
// ---The plan and the function that creates the weather ---
async function generateAITripPlan() {
    const days = document.getElementById('tripDays').value;
    const interests = document.getElementById('tripInterests').value;
    const modalBody = document.getElementById('modalBody');
    const aiModal = document.getElementById('aiModal');

    if (!days || !interests) {
        alert("Please fill in both fields!");
        return;
    }

    //Setting up the modal
    closeTripModal();
    aiModal.classList.add('active');
    modalBody.innerHTML = `
        <div class="text-center py-20">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-amber-800 mb-4"></div>
            <p class="text-amber-900 font-medium italic">Gemini is checking weather and crafting your journey...</p>
        </div>`;

    //Prompt for Gemini
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

    //Displaying the UI when data is successfully received
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

// --- 4. Firebase Like Counter System ---
let userHasLiked = false; 

// Get and display the current number of Likes from Firebase as the page loads
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(async () => {
        const likeCountSpan = document.getElementById('likeCount');
        if (!likeCountSpan) return;

        if (window.db && window.dbFunctions) {
            try {
                // Reading the 'likesCount' document in the 'stats' collection
                const docRef = window.dbFunctions.doc(window.db, "stats", "likesCount");
                const likeDoc = await window.dbFunctions.getDoc(docRef);
                
                if (likeDoc.exists()) {
                    likeCountSpan.innerText = likeDoc.data().count || 0;
                }
            } catch (error) {
                console.error("Error fetching likes from Firebase:", error);
            }
        }
    }, 1500);// Firebase waits 1.5 seconds to load first
});

//The main function that saves data when the button is clicked
async function toggleLike(button) {
    if (!window.db || !window.dbFunctions) {
        alert("Firebase values are still loading... Please wait a moment.");
        return;
    }

    const likeIcon = document.getElementById('likeIcon');
    const likeText = document.getElementById('likeText');
    const likeCountSpan = document.getElementById('likeCount');
    
    const docRef = window.dbFunctions.doc(window.db, "stats", "likesCount");
    let currentLikes = parseInt(likeCountSpan.innerText) || 0;

    if (!userHasLiked) {
        // 1.Adding a like (+1)
        currentLikes += 1;
        
        // Firebase save
        await window.dbFunctions.setDoc(docRef, { count: currentLikes }, { merge: true });
        
        // Changing the appearance of the UI (bold color)
        button.classList.remove('bg-white', 'text-amber-700', 'hover:bg-amber-50');
        button.classList.add('bg-amber-700', 'text-white', 'hover:bg-amber-800');
        likeText.innerText = "Mission Liked!";
        likeIcon.innerText = "💖";
        userHasLiked = true;
    } else {
        // 2.Clicking the like again and removing it (-1)
        currentLikes = Math.max(0, currentLikes - 1);
        
        // Firebase update
        await window.dbFunctions.setDoc(docRef, { count: currentLikes }, { merge: true });
        
        // Making the UI look old (white)
        button.classList.remove('bg-amber-700', 'text-white', 'hover:bg-amber-800');
        button.classList.add('bg-white', 'text-amber-700', 'hover:bg-amber-50');
        likeText.innerText = "Like our mission";
        likeIcon.innerText = "❤️";
        userHasLiked = false;
    }
    
    // Updating the latest number inside the button
    likeCountSpan.innerText = currentLikes;
}