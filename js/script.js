import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
//Paste your firebase api
const firebaseConfig = {
    apiKey: "",
    authDomain: "",
    databaseURL: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    measurementId: ""
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth();

window.signUp = async function () {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    // Validate inputs
    if (username.length < 3) {
        alert("Username must be at least 3 characters long!");
        return;
    }
    if (password.length < 6) {
        alert("Password must be at least 6 characters long!");
        return;
    }

    const email = `${username}@chatapp.com`;

    try {
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Check if username exists in the database
        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, `users/${username}`));

        if (snapshot.exists()) {
            // If username is taken, delete the newly created auth user and notify
            await user.delete();
            alert("Username already taken! Try another one.");
            return;
        }

        // Store user in Firebase Database (without password)
        await set(ref(db, 'users/' + username), {
            username: username,
            createdAt: Date.now() // Optional: timestamp for reference
        });

        sessionStorage.setItem('sender', username);
        window.location.href = "/pages/profilesetup.html"; // Redirect
    } catch (error) {
        alert("Error: " + error.message);
    }
};
