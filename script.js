import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Firebase 설정 ---
const firebaseConfig = {
  apiKey: "AIzaSyCTPywMmKT_Hv47Seo6AIhN515_PgIlm50",
  authDomain: "treats-ty.firebaseapp.com",
  projectId: "treats-ty",
  storageBucket: "treats-ty.firebasestorage.app",
  messagingSenderId: "237687562163",
  appId: "1:237687562163:web:07fa35e6fd8b28950735c6",
  measurementId: "G-R001G0DS6W"
};

let db, auth;
try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (e) {
    console.error("Firebase 초기화 중 오류 발생:", e);
}

const dom = {};
const ids = ['login-container', 'game-container', 'email-input', 'password-input', 'login-btn', 'signup-btn', 'guest-login-btn', 'logout-btn', 'auth-error', 'user-email', 'cash', 'monthly-sales', 'company-level', 'skill-level', 'best-recipe-name', 'log', 'vg-slider', 'nicotine-slider', 'cooling-slider', 'price-slider', 'vg-value', 'nicotine-value', 'cooling-value', 'price-value', 'summary-vg', 'summary-pg', 'summary-flavor', 'summary-nicotine', 'summary-cooling', 'recipe-name-input', 'create-batch-btn', 'market-trend', 'upgrades-container', 'open-flavor-popup-btn', 'selected-flavors-display', 'flavor-popup', 'close-flavor-popup-btn', 'flavor-grid', 'confirm-flavor-selection-btn', 'individual-flavor-sliders', 'ratio-section', 'naming-section', 'pricing-section', 'summary-section', 'manufacture-cost', 'open-leaderboard-popup-btn', 'leaderboard-popup', 'close-leaderboard-popup-btn', 'leaderboard-content'];
ids.forEach(id => {
    if (document.getElementById(id)) {
        dom[id.replace(/-/g, '_')] = document.getElementById(id);
    }
});

const FLAVORS = [
    { name: '딸기', category: '과일', icon: '🍓' }, { name: '바나나', category: '과일', icon: '🍌' }, { name: '블루베리', category: '과일', icon: '🫐' }, { name: '망고', category: '과일', icon: '🥭' }, { name: '레몬', category: '과일', icon: '🍋' }, { name: '라임', category: '과일', icon: '🍈' }, { name: '사과', category: '과일', icon: '🍎' }, { name: '복숭아', category: '과일', icon: '🍑' }, { name: '자두', category: '과일', icon: '🟣' }, { name: '파인애플', category: '과일', icon: '🍍' }, { name: '포도', category: '과일', icon: '🍇' },
    { name: '바닐라', category: '디저트', icon: '🍦' }, { name: '커스타드', category: '디저트', icon: '🍮' }, { name: '치즈케이크', category: '디저트', icon: '🍰' }, { name: '초콜릿', category: '디저트', icon: '🍫' }, { name: '카라멜', category: '디저트', icon: '🍬' }, { name: '요거트', category: '디저트', icon: '🥛' },
    { name: '연초', category: '연초', icon: '🚬' }, { name: '시가', category: '연초', icon: '💨' },
    { name: '멘솔', category: '멘솔', icon: '❄️' }, { name: '스피어민트', category: '멘솔', icon: '🍃' },
    { name: '커피', category: '음료', icon: '☕' }, { name: '콜라', category: '음료', icon: '🥤' }
];

const SYNERGY_SCORES = { '딸기-바나나': 1.2, '딸기-요거트': 1.15, '망고-파인애플': 1.1, '레몬-라임': 1.2, '복숭아-요거트': 1.25, '블루베리-치즈케이크': 1.3, '연초-카라멜': 1.1, '연초-바닐라': 1.15, '커피-시가': 1.2, '초콜릿-스피어민트': 1.1, '사과-멘솔': 1.1 };
const CONFLICT_SCORES = { '레몬-연초': 0.5, '콜라-커피': 0.6 };

let gameState = {};
let currentUser = null;
let unsubscribeLeaderboard = null;
let tempSelectedFlavors = [];

function getBaseGameState() {
    return {
        email: '', cash: 1000, monthlySales: 0, companyLevel: 1, skillExp: 0,
        bestRecipe: { name: '-', score: 0 },
        upgrades: {
            lab: { level: 0, cost: 250, baseCost: 250, bonus: 0, bonusPerLevel: 0.01, maxLevel: 10, name: "🔬 연구실 확장" },
            marketing: { level: 0, cost: 400, baseCost: 400, bonus: 0, bonusPerLevel: 0.05, maxLevel: 15, name: "📢 마케팅" },
            flavor_rnd: { level: 0, cost: 1000, baseCost: 1000, bonus: 0, bonusPerLevel: 0.02, maxLevel: 5, name: "⚗️ 향료 R&D" }
        },
        marketTrend: { category: null, duration: 0, bonus: 1.5 },
        lastLoginMonth: new Date().getMonth()
    };
}
if (auth) {
    onAuthStateChanged(auth, async user => {
        if (user) {
            currentUser = user;
            dom.user_email.textContent = user.isAnonymous ? '게스트' : user.email;
            dom.login_container.classList.add('hidden');
            dom.game_container.classList.remove('hidden');
            await loadGameData(user.uid);
            initGame();
        } else {
            currentUser = null;
            dom.login_container.classList.remove('hidden');
            dom.game_container.classList.add('hidden');
            if (unsubscribeLeaderboard) unsubscribeLeaderboard();
        }
    });
}
async function handleAuth(action) {
    if (!auth) { dom.auth_error.textContent = "서버 연결이 필요합니다."; return; }
    const email = dom.email_input.value;
    const password = dom.password_input.value;
    dom.auth_error.textContent = '';
    try {
        if (action === 'login') {
            await signInWithEmailAndPassword(auth, email, password);
        } else {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await saveGameData(userCredential.user.uid, true);
        }
    } catch (error) {
        let errorMessage = "오류가 발생했습니다.";
        switch (error.code) {
            case 'auth/invalid-email': errorMessage = '유효하지 않은 이메일 형식입니다.'; break;
            case 'auth/user-not-found': case 'auth/wrong-password': errorMessage = '이메일 또는 비밀번호가 틀렸습니다.'; break;
            case 'auth/email-already-in-use': errorMessage = '이미 사용 중인 이메일입니다.'; break;
            case 'auth/weak-password': errorMessage = '비밀번호는 6자 이상이어야 합니다.'; break;
            case 'auth/operation-not-allowed': errorMessage = '이메일 로그인이 활성화되지 않았습니다.'; break;
            default: errorMessage = `오류: ${error.code}`; break;
        }
        dom.auth_error.textContent = errorMessage;
    }
}
dom.login_btn.addEventListener('click', () => handleAuth('login'));
dom.signup_btn.addEventListener('click', () => handleAuth('signup'));
dom.guest_login_btn.addEventListener('click', () => {
     currentUser = { uid: 'guest', isAnonymous: true, email: '게스트' };
     dom.user_email.textContent = '게스트';
     dom.login_container.classList.add('hidden');
     dom.game_container.classList.remove('hidden');
     loadGameData('guest');
     initGame();
});
dom.logout_btn.addEventListener('click', () => {
    if (currentUser && !currentUser.isAnonymous) { signOut(auth); }
    else { currentUser = null; dom.login_container.classList.remove('hidden'); dom.game_container.classList.add('hidden'); }
});
async function loadGameData(userId) {
    if (userId === 'guest') {
        const savedData = localStorage.getItem('treats-tycoon-guest-save');
        gameState = savedData ? JSON.parse(savedData) : getBaseGameState();
    } else {
        if (!db) { gameState = getBaseGameState(); return; }
        const userDocRef = doc(db, 'players', userId);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            gameState = docSnap.data();
            const currentMonth = new Date().getMonth();
            if (gameState.lastLoginMonth !== currentMonth) {
                gameState.monthlySales = 0;
                gameState.lastLoginMonth = currentMonth;
                logMessage('이달의 첫 접속입니다! 월간 매출이 초기화되었습니다.', 'system');
            }
        } else {
            gameState = getBaseGameState();
            gameState.email = currentUser.email;
        }
    }
    if (!gameState.skillExp) gameState.skillExp = 0;
}
async function saveGameData(userId, isNewUser = false) {
    if (!userId) return;
    if (userId === 'guest') {
        localStorage.setItem('treats-tycoon-guest-save', JSON.stringify(gameState));
        return;
    }
    if (!db) return;
    const userDocRef = doc(db, 'players', userId);
    let dataToSave = isNewUser ? { ...getBaseGameState(), email: currentUser.email, uid: userId } : { ...gameState, uid: userId };
    await setDoc(userDocRef, dataToSave, { merge: true });
}
function listenToLeaderboard() {
    if (!db || (currentUser && currentUser.isAnonymous)) {
        dom.leaderboard_content.innerHTML = '<p class="text-center text-gray-400 p-4">리더보드는<br>이메일로 로그인 후<br>이용 가능합니다.</p>';
        return;
    }
    const q = query(collection(db, "players"), orderBy("monthlySales", "desc"), limit(10));
    unsubscribeLeaderboard = onSnapshot(q, (snapshot) => {
        dom.leaderboard_content.innerHTML = snapshot.docs.map((doc, index) => {
            const data = doc.data();
            return `<div class="flex justify-between items-center p-2 rounded ${data.uid === currentUser?.uid ? 'bg-indigo-500' : ''}"><div class="flex items-center"><span class="font-bold w-6">${index + 1}.</span><span class="truncate">${data.email || '익명'}</span></div><span class="font-bold text-green-400">$${Math.round(data.monthlySales || 0)}</span></div>`;
        }).join('') || '<p class="text-center text-gray-400">아직 순위가 없습니다.</p>';
    }, (error) => {
        console.error("리더보드 로딩 실패:", error);
        dom.leaderboard_content.innerHTML = '<p class="text-center text-red-400">리더보드를 불러오는 데 실패했습니다.</p>';
    });
}
function initGame() {
    renderFlavorGrid();
    renderUpgrades();
    addEventListeners();
    updateAllUI();
    listenToLeaderboard();
}
function addEventListeners() {
    dom.open_flavor_popup_btn.addEventListener('click', () => dom.flavor_popup.classList.replace('hidden', 'flex'));
    dom.close_flavor_popup_btn.addEventListener('click', () => dom.flavor_popup.classList.replace('flex', 'hidden'));
    dom.confirm_flavor_selection_btn.addEventListener('click', confirmFlavorSelection);
    dom.open_leaderboard_popup_btn.addEventListener('click', () => dom.leaderboard_popup.classList.replace('hidden', 'flex'));
    dom.close_leaderboard_popup_btn.addEventListener('click', () => dom.leaderboard_popup.classList.replace('flex', 'hidden'));
    ['vg_slider', 'nicotine_slider', 'cooling_slider', 'price_slider'].forEach(key => dom[key].addEventListener('input', updateRecipeAndCost));
    dom.create_batch_btn.addEventListener('click', createAndSellBatch);
    dom.upgrades_container.addEventListener('click', e => { if (e.target.closest('button')?.dataset.key) buyUpgrade(e.target.closest('button').dataset.key); });
}
function renderFlavorGrid() {
    dom.flavor_grid.innerHTML = FLAVORS.map(f => `
        <div class="flavor-item flex flex-col items-center justify-center p-2 bg-gray-700 rounded-lg" data-flavor-name="${f.name}">
            <span class="text-2xl">${f.icon}</span>
            <span class="text-xs mt-1 text-center">${f.name}</span>
        </div>
    `).join('');
    dom.flavor_grid.addEventListener('click', (e) => {
        const item = e.target.closest('.flavor-item');
        if (!item) return;
        const flavorName = item.dataset.flavorName;
        const index = tempSelectedFlavors.indexOf(flavorName);
        if (index > -1) {
            tempSelectedFlavors.splice(index, 1);
            item.classList.remove('selected');
        } else {
            if (tempSelectedFlavors.length < 5) {
                tempSelectedFlavors.push(flavorName);
                item.classList.add('selected');
            } else {
                logMessage('향료는 최대 5개까지 선택할 수 있습니다.', 'error');
            }
        }
    });
}
function confirmFlavorSelection() {
    selectedFlavors = [...tempSelectedFlavors];
    dom.flavor_popup.classList.replace('flex', 'hidden');
    updateSelectedFlavorsDisplay();
    renderIndividualFlavorSliders();
    updateRecipeAndCost();
    showRecipeCreationSteps();
}
function updateSelectedFlavorsDisplay() {
    if (selectedFlavors.length === 0) {
        dom.selected_flavors_display.innerHTML = '<span class="text-gray-500 italic">버튼을 눌러 향료를 선택하세요...</span>';
        return;
    }
    dom.selected_flavors_display.innerHTML = selectedFlavors.map(name => {
        const flavor = FLAVORS.find(f => f.name === name);
        return `<span class="bg-indigo-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">${flavor.icon} ${flavor.name}</span>`;
    }).join('');
}
function renderIndividualFlavorSliders() {
    dom.individual_flavor_sliders.innerHTML = selectedFlavors.map(name => `
        <div>
            <label for="flavor-slider-${name}" class="flex justify-between text-xs"><span>${name}</span><span id="flavor-value-${name}" class="font-bold text-indigo-300"></span></label>
            <input id="flavor-slider-${name}" data-flavor-name="${name}" type="range" min="1" max="20" value="5" class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb flavor-ratio-slider">
        </div>
    `).join('');
    document.querySelectorAll('.flavor-ratio-slider').forEach(slider => slider.addEventListener('input', updateRecipeAndCost));
}
function showRecipeCreationSteps() {
    const show = selectedFlavors.length > 0;
    dom.ratio_section.classList.toggle('hidden', !show);
    dom.naming_section.classList.toggle('hidden', !show);
    dom.pricing_section.classList.toggle('hidden', !show);
    dom.summary_section.classList.toggle('hidden', !show);
    dom.create_batch_btn.disabled = !show;
}
function updateAllUI() {
    dom.cash.textContent = `$${Math.round(gameState.cash)}`;
    dom.monthly_sales.textContent = `$${Math.round(gameState.monthlySales)}`;
    dom.best_recipe_name.textContent = gameState.bestRecipe.name;
    const skillLevel = Math.floor(Math.log10(gameState.skillExp / 100 + 1)) + 1;
    dom.company_level.textContent = gameState.companyLevel;
    dom.skill_level.textContent = `Lv.${skillLevel}`;
    renderUpgrades();
}
function renderUpgrades() {
    dom.upgrades_container.innerHTML = Object.keys(gameState.upgrades).map(key => {
        const upg = gameState.upgrades[key];
        const canAfford = gameState.cash >= upg.cost;
        const isMax = upg.level >= upg.maxLevel;
        return `
            <div class="bg-gray-900 p-4 rounded-lg">
                <div class="flex justify-between items-center mb-2">
                    <h4 class="font-bold">${upg.name} (Lv.${upg.level})</h4>
                    <p class="text-sm text-gray-400">${upg.name.split(" ")[1]} +${Math.round(upg.bonus*100)}%</p>
                </div>
                <button data-key="${key}" class="w-full bg-indigo-600 text-white font-bold py-2 px-3 rounded-lg btn" ${isMax || !canAfford ? 'disabled' : ''}>
                    ${isMax ? 'MAX 레벨' : `업그레이드: $${upg.cost}`}
                </button>
            </div>`;
    }).join('');
}
function updateRecipeAndCost() {
    const values = {
        vg: parseInt(dom.vg_slider.value),
        nicotine: parseInt(dom.nicotine_slider.value),
        cooling: parseInt(dom.cooling_slider.value),
        price: parseInt(dom.price_slider.value),
        flavorRatios: {}
    };
    let totalFlavorPerc = 0;
    document.querySelectorAll('.flavor-ratio-slider').forEach(slider => {
        const perc = parseInt(slider.value);
        totalFlavorPerc += perc;
        values.flavorRatios[slider.dataset.flavorName] = perc;
        document.getElementById(`flavor-value-${slider.dataset.flavorName}`).textContent = `${perc}%`;
    });

    values.pg = 100 - values.vg - totalFlavorPerc;

    dom.vg_value.textContent = `${values.vg}%`;
    dom.nicotine_value.textContent = `${values.nicotine}mg`;
    dom.cooling_value.textContent = `${values.cooling}`;
    dom.price_value.textContent = `$${values.price}`;
    
    dom.summary_vg.textContent = `${values.vg}%`;
    dom.summary_pg.textContent = `${values.pg < 0 ? 'Error!' : `${values.pg}%`}`;
    dom.summary_pg.classList.toggle('text-red-500', values.pg < 0);
    dom.summary_flavor.textContent = `${totalFlavorPerc}%`;
    dom.summary_nicotine.textContent = `${values.nicotine}mg`;
    dom.summary_cooling.textContent = `${values.cooling}`;

    const cost = 10 + (selectedFlavors.length * 5) + (values.nicotine * 0.5) + (values.cooling * 0.5) + (totalFlavorPerc * 0.2);
    dom.manufacture_cost.textContent = `$${Math.round(cost)}`;
    dom.create_batch_btn.disabled = values.pg < 0;
}
async function createAndSellBatch() {
    let manufactureCost = parseFloat(dom.manufacture_cost.textContent.replace('$', ''));
    if (gameState.cash < manufactureCost) {
        logMessage('❌ 자본금이 부족하여 제조할 수 없습니다.', 'error'); return;
    }
    // ... 이하 판매 로직
}
//... And so on for all the other functions like createAndSellBatch, calculateScores, etc.
