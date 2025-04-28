import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
        import { getDatabase, ref, update, get } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";
        import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
        import { avatars } from "/js/avatars.js";

        const firebaseConfig = {
            apiKey: "AIzaSyAgI4VQ0yUlcJOm_X7OHkeQ9L3BVlW1wyc",
            authDomain: "app-application-f73b9.firebaseapp.com",
            databaseURL: "https://app-application-f73b9-default-rtdb.firebaseio.com",
            projectId: "app-application-f73b9",
            storageBucket: "app-application-f73b9.appspot.com",
            messagingSenderId: "127997162999",
            appId: "1:127997162999:web:69da92f7a4c8b02631aaf2",
            measurementId: "G-VEWJTWJ710"
        };

        const app = initializeApp(firebaseConfig);
        const db = getDatabase(app);
        const auth = getAuth(app);

        const avatarList = document.getElementById("avatarList");
        avatars.forEach((avatar, index) => {
            const avatarDiv = document.createElement("div");
            avatarDiv.className = "avatar-option";
            avatarDiv.innerHTML = `<img src="${avatar}" data-index="${index}">`;
            avatarDiv.onclick = () => selectAvatar(index);
            avatarList.appendChild(avatarDiv);
        });

        let selectedAvatar = null;

        function selectAvatar(index) {
            selectedAvatar = avatars[index];
            document.querySelectorAll(".avatar-option").forEach(option => {
                option.classList.remove("selected");
            });
            document.querySelector(`.avatar-option img[data-index="${index}"]`).parentElement.classList.add("selected");
            console.log(`Selected avatar: ${selectedAvatar}`);
        }

        window.saveAvatar = async function () {
            if (!selectedAvatar) {
                alert("Please select an avatar!");
                return;
            }

            const user = auth.currentUser;
            if (!user) {
                alert("You are not authenticated. Please log in again.");
                window.location.href = "/pages/login.html";
                return;
            }

            const uid = user.uid;
            const username = sessionStorage.getItem("sender") || user.displayName || "Anonymous";
            const userRef = ref(db, `onlineUsers/${username}`);

            try {
                await update(userRef, {
                    avatar: selectedAvatar,
                    lastActive: Date.now()
                });
                console.log(`Avatar saved for ${username}: ${selectedAvatar}`);
                window.location.href = "/pages/chatRooms.html";
            } catch (error) {
                console.error("Error saving avatar to Firebase:", error);
                alert("Failed to save avatar. Please try again.");
            }
        };

        window.onload = function () {
            onAuthStateChanged(auth, async (user) => {
                if (!user) {
                    alert("You are not authenticated. Please log in again.");
                    window.location.href = "/pages/login.html";
                    return;
                }

                const username = sessionStorage.getItem("sender") || user.displayName || "Anonymous";
                const userRef = ref(db, `onlineUsers/${username}/avatar`);

                try {
                    const snapshot = await get(userRef);
                    const savedAvatar = snapshot.val();
                    console.log(`Loaded avatar for ${username}: ${savedAvatar}`);
                    if (savedAvatar) {
                        const index = avatars.indexOf(savedAvatar);
                        if (index !== -1) {
                            selectAvatar(index);
                        }
                    }
                } catch (error) {
                    console.error("Error loading saved avatar:", error);
                    alert("Failed to load saved avatar. Please try again.");
                }
            });
        };