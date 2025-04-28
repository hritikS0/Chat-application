import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getDatabase, ref, set, remove } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getDatabase(app);

window.login = function () {
    const username = document.getElementById("username")?.value.trim();
    const password = document.getElementById("password")?.value.trim();

    if (!username || !password) {
        alert("Username and password cannot be empty!");
        console.error("Login failed: Empty username or password");
        return;
    }

    const email = `${username}@chatapp.com`;
    console.log("Attempting login with:", email);

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log("Login successful:", userCredential.user.email);
            sessionStorage.setItem("sender", username);

            // Set user as online with consistent structure
            return set(ref(db, `onlineUsers/${username}`), {
                username: username,
                lastActive: Date.now()
            });
        })
        .then(() => {
            console.log("User marked as online, redirecting...");
            window.location.href = "/pages/chatRooms.html";
        })
        .catch((error) => {
            console.error("Login error:", error.code, error.message);
            alert("Invalid username or password. Please check your credentials.");
        });
};

window.logout = function () {
    const username = sessionStorage.getItem("sender");

    if (username) {
        remove(ref(db, `onlineUsers/${username}`))
            .then(() => console.log("User removed from online list"))
            .catch(error => console.error("Error removing user:", error));
        sessionStorage.removeItem("sender");
    }

    signOut(auth)
        .then(() => {
            console.log("Logout successful");
            window.location.href = "/index.html";
        })
        .catch(error => console.error("Logout error:", error));
};

window.addEventListener("beforeunload", function () {
    const username = sessionStorage.getItem("sender");
    if (username) {
        remove(ref(db, `onlineUsers/${username}`))
            .catch(error => console.error("Error on tab close:", error));
    }
});

onAuthStateChanged(auth, (user) => {
    if (user && window.location.pathname === "/index.html") {
        console.log("User already logged in, redirecting...");
        window.location.href = "/pages/chatRooms.html";
    } else if (!user && window.location.pathname !== "/index.html") {
        console.log("No user logged in, redirecting to login...");
        // window.location.href = "/index.html";
    }
});