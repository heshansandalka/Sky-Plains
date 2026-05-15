


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

// 1. පිටුව Load වූ පසු Firestore එක Listen කිරීම අරඹන්න
document.addEventListener('DOMContentLoaded', () => {
    listenToCloudGallery();
});

// 2. Database එකේ දත්ත Real-time කියවීම (Cloud Firestore)
function listenToCloudGallery() {
    const galleryGrid = document.getElementById('galleryGrid');
    if (!galleryGrid) return;

    // 'birds' collection එකෙන් අලුත්ම දත්ත මුලට එන සේ query කිරීම
    const q = window.dbFunctions.query(
        window.dbFunctions.collection(window.db, "birds"), 
        window.dbFunctions.orderBy("createdAt", "desc")
    );

    // Database එකේ යමක් වෙනස් වූ වහාම Gallery එක ඉබේම Update වේ
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
                            <img src="${item.img}" alt="${item.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" onerror="this.src='https://via.placeholder.com/400x300?text=Image+Not+Found'">
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

async function addNewCard() {
    const title = document.getElementById('newTitle').value;
    const desc = document.getElementById('newDesc').value;
    const imageFile = document.getElementById('imageInput').files[0];

    // මූලික පරීක්ෂාවන්
    if (!title || !imageFile) {
        alert("කරුණාකර නම සහ පින්තූරය ඇතුළත් කරන්න!");
        return;
    }

    if (!window.dbFunctions || !window.dbFunctions.addDoc) {
        alert("Firebase තාම load වෙනවා. තත්පරයකින් ආයෙත් උත්සාහ කරන්න.");
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(e) {
        const base64Image = e.target.result;
        
        // පින්තූරයේ ප්‍රමාණය පරීක්ෂා කිරීම (1MB ට වඩා වැඩි නම් Firestore reject කරයි)
        if (base64Image.length > 1048487) { 
            alert("පින්තූරය ගොඩක් ලොකුයි! කරුණාකර 1MB ට අඩු පින්තූරයක් තෝරන්න.");
            return;
        }

        try {
            const docRef = await window.dbFunctions.addDoc(window.dbFunctions.collection(window.db, "birds"), {
                title: title,
                desc: desc || "Nature wonder",
                img: base64Image,
                createdAt: new Date()
            });
            
            console.log("Document written with ID: ", docRef.id);
            closeUploadModal();
            clearInputs();
        } catch (error) {
            console.error("Firebase Error: ", error);
            alert("දත්ත ඇතුළත් කිරීමේදී දෝෂයක් ආවා!");
        }
    };
    reader.readAsDataURL(imageFile);
}

// පිටුව Load වූ පසු Firestore එක Listen කිරීම අරඹන්න
document.addEventListener('DOMContentLoaded', () => {
    // තත්පර 1ක් ඉමු Firebase functions ටික window එකට load වෙනකම්
    setTimeout(() => {
        listenToCloudGallery();
    }, 1000);
});

function listenToCloudGallery() {
    const galleryGrid = document.getElementById('galleryGrid');
    
    // Check කරන්න HTML එකේ galleryGrid කියලා ID එකක් තියෙනවද කියලා
    if (!galleryGrid) {
        console.error("Error: 'galleryGrid' element not found in HTML!");
        return;
    }

    if (!window.dbFunctions) {
        console.error("Error: Firebase functions are not loaded yet!");
        return;
    }

    console.log("Listening to Firestore 'birds' collection...");

    const q = window.dbFunctions.query(
        window.dbFunctions.collection(window.db, "birds"), 
        window.dbFunctions.orderBy("createdAt", "desc")
    );

    window.dbFunctions.onSnapshot(q, (snapshot) => {
        console.log("Data received from Firebase. Count:", snapshot.size);
        let htmlContent = "";
        
        if (snapshot.empty) {
            htmlContent = `<p class="text-center text-gray-500 col-span-full py-10">No birds found in database.</p>`;
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
                            <p class="text-gray-500 text-sm">${item.desc || 'Explore Sri Lanka'}</p>
                        </div>
                    </div>`;
            });
        }
        galleryGrid.innerHTML = htmlContent;
    });
}
// --- Helper Functions (මෝඩල් සහ අනෙකුත් දේවල් පාලනයට) ---

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

// Gemini AI function එක (මෙය ඔයාගේ index.html එකේ ඇති callGemini function එක මත පදනම් වේ)
async function askAI(topic) {
    const modalBody = document.getElementById('modalBody');
    const modal = document.getElementById('aiModal');
    
    modalBody.innerHTML = `<div class="text-center py-10"><div class="loader mx-auto"></div><p class="mt-4 text-amber-900">Asking AI about ${topic}...</p></div>`;
    modal.classList.add('active');

    const prompt = `Write a short, luxurious 3-sentence travel blurb about ${topic} bird in Sri Lanka.`;
    
    try {
        const result = await callGemini(prompt); // callGemini function එක ඇති බවට වගබලා ගන්න
        modalBody.innerHTML = `
            <div class="p-2">
                <h2 class="text-3xl font-serif font-bold text-amber-900 mb-4">${topic}</h2>
                <p class="leading-relaxed text-gray-700 italic text-lg">"${result}"</p>
                <button onclick="closeModal()" class="mt-8 w-full bg-amber-800 text-white py-3 rounded-xl font-bold hover:bg-amber-900 transition-colors">Close Explorer</button>
            </div>`;
    } catch (e) {
        modalBody.innerHTML = `<p class="text-red-500 p-4">AI could not fetch information. Please try again.</p>`;
    }
}

function toggleMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    navLinks.classList.toggle('show');
}