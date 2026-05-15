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
    reader.onload = async function(e) {
        const base64Image = e.target.result;
        
        // Firestore limit පරීක්ෂාව
        if (base64Image.length > 1048487) { 
            alert("Image is too large! Please select an image under 1MB.");
            return;
        }

        try {
            await window.dbFunctions.addDoc(window.dbFunctions.collection(window.db, "birds"), {
                title: title,
                desc: desc || "Nature wonder",
                img: base64Image,
                createdAt: new Date()
            });
            
            closeUploadModal();
            clearInputs();
        } catch (error) {
            console.error("Firebase Error: ", error);
            alert("Error adding data!");
        }
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