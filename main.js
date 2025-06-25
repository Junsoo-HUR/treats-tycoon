import { firebaseConfig, FLAVORS, SYNERGY_SCORES, CONFLICT_SCORES, CRAFTING_RECIPES, TUTORIAL, DOM_IDS } from './game-data.js';
import * as UIManager from './ui-manager.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// ... (이하 모든 게임 로직 관련 함수) ...
