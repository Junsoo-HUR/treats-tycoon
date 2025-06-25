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
const ids = ['login-container', 'game-container', 'email-input', 'password-input', 'login-btn', 'signup-btn', 'guest-login-btn', 'logout-btn', 'auth-error', 'user-email', 'cash', 'monthly-sales', 'company-level', 'skill-level', 'best-recipe-name', 'log', 'vg-slider', 'nicotine-slider', 'cooling-slider', 'price-slider', 'vg-value', 'nicotine-value', 'cooling-value', 'price-value', 'summary-vg', 'summary-pg', 'summary-flavor', 'summary-nicotine', 'summary-cooling', 'recipe-name-input', 'create-batch-btn', 'market-trend', 'upgrades-container', 'open-flavor-popup-btn', 'selected-flavors-display', 'flavor-popup', 'close-flavor-popup-btn', 'flavor-grid', 'confirm-flavor-selection-btn', 'individual-flavor-sliders', 'ratio-section', 'naming-section', 'pricing-section', 'summary-section', 'manufacture-cost', 'open-leaderboard-popup-btn', 'leaderboard-popup', 'close-leaderboard-popup-btn', 'leaderboard-content', 'open-recipebook-popup-btn', 'recipebook-popup', 'close-recipebook-popup-btn', 'recipebook-content', 'open-guide-popup-btn', 'tutorial-section', 'task-list', 'mentor-popup', 'mentor-message', 'close-mentor-popup-btn', 'bug-notice'];
ids.forEach(id => {
    if (document.getElementById(id)) {
        dom[id.replace(/-/g, '_')] = document.getElementById(id);
    }
});

const FLAVORS = [
    { name: '딸기', category: '과일', icon: '🍓' }, { name: '바나나', category: '과일', icon: '🍌' }, { name: '블루베리', category: '과일', icon: '🫐' }, { name: '망고', category: '과일', icon: '🥭' }, { name: '레몬', category: '과일', icon: '🍋' }, { name: '라임', category: '과일', icon: '🍈' }, { name: '사과', category: '과일', icon: '🍎' }, { name: '복숭아', category: '과일', icon: '🍑' }, { name: '자두', category: '과일', icon: '🟣' }, { name: '파인애플', category: '과일', icon: '🍍' }, { name: '포도', category: '과일', icon: '🍇' }, { name: '자몽', category: '과일', icon: '🍊' }, { name: '수박', category: '과일', icon: '🍉' }, { name: '멜론', category: '과일', icon: '🍈' }, { name: '리치', category: '과일', icon: '🥥' }, { name: '체리', category: '과일', icon: '🍒' }, { name: '키위', category: '과일', icon: '🥝' }, { name: '알로에', category: '과일', icon: '🪴' }, { name: '구아바', category: '과일', icon: '🥑' }, { name: '패션후르츠', category: '과일', icon: '🥭' }, { name: '시르삭', category: '과일', icon: '🍈' }, { name: '블랙커런트', category: '과일', icon: '🍇' }, { name: '라즈베리', category: '과일', icon: '🍓' },
    { name: '바닐라', category: '디저트', icon: '🍦' }, { name: '커스타드', category: '디저트', icon: '🍮' }, { name: '치즈케이크', category: '디저트', icon: '🍰' }, { name: '초콜릿', category: '디저트', icon: '🍫' }, { name: '카라멜', category: '디저트', icon: '🍬' }, { name: '요거트', category: '디저트', icon: '🥛' }, { name: '애플파이', category: '디저트', icon: '🥧' }, { name: '도넛', category: '디저트', icon: '🍩' }, { name: '쿠키앤크림', category: '디저트', icon: '🍪' }, { name: '솜사탕', category: '디저트', icon: '☁️' }, { name: '버터스카치', category: '디저트', icon: '🧈' }, { name: '크림', category: '디저트', icon: '🥛' }, { name: '잼', category: '디저트', icon: '🍓' },
    { name: '연초', category: '연초', icon: '🚬' }, { name: '시가', category: '연초', icon: '💨' }, { name: 'RY4', category: '연초', icon: '🍂' }, { name: '쿠바 시가', category: '연초', icon: '🇨🇺' }, { name: '파이프 연초', category: '연초', icon: '📜' }, { name: '크림 연초', category: '연초', icon: '🍮' },
    { name: '멘솔', category: '멘솔', icon: '❄️' }, { name: '스피어민트', category: '멘솔', icon: '🍃' }, { name: '페퍼민트', category: '멘솔', icon: '🌿' },
    { name: '커피', category: '음료', icon: '☕' }, { name: '콜라', category: '음료', icon: '🥤' }, { name: '에너지드링크', category: '음료', icon: '⚡' }, { name: '레몬에이드', category: '음료', icon: '🍹' }, { name: '밀크티', category: '음료', icon: '🧋' }, { name: '피나콜라다', category: '음료', icon: '🍍' }, { name: '루트비어', category: '음료', icon: '🍺' }, { name: '샴페인', category: '음료', icon: '🍾' },
    { name: '꿀', category: '특별', icon: '🍯' }, { name: '시나몬', category: '특별', icon: '🪵' }, { name: '장미', category: '특별', icon: '🌹' }, { name: '헤이즐넛', category: '특별', icon: '🌰' }, { name: '아몬드', category: '특별', icon: '🌰' },
];
const SYNERGY_SCORES = { '딸기-바나나': 1.2, '레몬-라임': 1.2, '망고-파인애플': 1.1, '사과-알로에': 1.15, '딸기-크림': 1.25, '블루베리-치즈케이크': 1.3, '복숭아-요거트': 1.25, '사과-애플파이': 1.2, '바나나-커스타드': 1.2, '레몬-치즈케이크': 1.1, '망고-크림': 1.15, '자두-요거트': 1.1, '포도-멘솔': 1.1, '수박-멘솔': 1.15, '자몽-멘솔': 1.15, '알로에-멘솔': 1.2, '연초-카라멜': 1.1, 'RY4-바닐라': 1.2, '시가-커피': 1.25, '파이프 연초-헤이즐넛': 1.2, '크림 연초-커스타드': 1.3, 'RY4-헤이즐넛': 1.15, '초콜릿-스피어민트': 1.1, '꿀-레몬': 1.1, '시나몬-도넛': 1.2, '카라멜-커피': 1.15, '초콜릿-헤이즐넛': 1.25, '샴페인-딸기': 1.3 };
const CONFLICT_SCORES = { '레몬-연초': 0.5, '콜라-커피': 0.6, '장미-시가': 0.4, '치즈케이크-멘솔': 0.7, '요거트-콜라': 0.5, '시르삭-커피': 0.6, '파인애플-밀크티': 0.7 };

let gameState = {};
let currentUser = null;
let unsubscribeLeaderboard = null;
let tempSelectedFlavors = [];
const TUTORIAL = {
    tasks: [
        { id: 1, text: "첫 향료 선택하기", completed: false, reward: 50 },
        { id: 2, text: "첫 액상 제조하기", completed: false, reward: 100 },
        { id: 3, text: "첫 수익 $100 달성하기", completed: false, reward: 250 },
    ],
    messages: [
        "반갑네, 젊은 CEO! 나는 이 업계의 전설, '더쥬팩씨'라고 하네. 자네의 잠재력을 보고 찾아왔지. 우선 내 노하우가 담긴 '첫걸음 레시피'를 선물로 주겠네. '딸기'와 '바나나'를 섞어보는 건 어떤가?",
        "좋아! 시작이 좋군! 첫 단추를 잘 끼웠으니, 이 자금($50)을 보태주겠네.",
        "훌륭해! 첫 작품치고는 제법이군. 이 자금($100)으로 다음 레시피를 연구해보게.",
        "굉장하군! 이제 자네도 어엿한 CEO야. 이 업그레이드 자금($250)으로 회사를 더 키워보게나!"
    ]
};

function getBaseGameState() {
    return {
        email: '', cash: 1000, monthlySales: 0, companyLevel: 1, skillExp: 0,
        bestRecipe: { name: '-', score: 0 },
        savedRecipes: [],
        upgrades: {
            lab: { level: 0, cost: 250, baseCost: 250, bonus: 0, bonusPerLevel: 0.01, maxLevel: 10, name: "🔬 연구실 확장" },
            marketing: { level: 0, cost: 400, baseCost: 400, bonus: 0, bonusPerLevel: 0.05, maxLevel: 15, name: "📢 마케팅" },
            flavor_rnd: { level: 0, cost: 1000, baseCost: 1000, bonus: 0, bonusPerLevel: 0.02, maxLevel: 5, name: "⚗️ 향료 R&D" }
        },
        marketTrend: { category: null, duration: 0, bonus: 1.5 },
        lastLoginMonth: new Date().getMonth(),
        dailyManufactureCount: 0,
        lastManufactureDate: new Date().toLocaleDateString('ko-KR'),
        tutorial: { tasks: JSON.parse(JSON.stringify(TUTORIAL.tasks)), step: 0, introSeen: false }
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
                logMessage('새로운 달이 시작되었습니다! 월간 매출과 회사 업그레이드가 초기화됩니다. 새로운 시즌을 시작하세요!', 'system');
                const baseState = getBaseGameState();
                gameState.monthlySales = baseState.monthlySales;
                gameState.upgrades = baseState.upgrades;
                gameState.lastLoginMonth = currentMonth;
            }
        } else {
            gameState = getBaseGameState();
            gameState.email = currentUser.email;
        }
    }
    const today = new Date().toLocaleDateString('ko-KR');
    if (gameState.lastManufactureDate !== today) {
        gameState.dailyManufactureCount = 0;
        gameState.lastManufactureDate = today;
    }
    if (!gameState.skillExp) gameState.skillExp = 0;
    if (!gameState.savedRecipes) gameState.savedRecipes = [];
    if (!gameState.tutorial) gameState.tutorial = getBaseGameState().tutorial;
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
    checkTutorial();
}
function addEventListeners() {
    dom.open_flavor_popup_btn.addEventListener('click', openFlavorPopup);
    dom.close_flavor_popup_btn.addEventListener('click', () => dom.flavor_popup.classList.replace('flex', 'hidden'));
    dom.confirm_flavor_selection_btn.addEventListener('click', confirmFlavorSelection);
    dom.open_leaderboard_popup_btn.addEventListener('click', () => dom.leaderboard_popup.classList.replace('hidden', 'flex'));
    dom.close_leaderboard_popup_btn.addEventListener('click', () => dom.leaderboard_popup.classList.replace('flex', 'hidden'));
    dom.open_recipebook_popup_btn.addEventListener('click', openRecipeBook);
    dom.close_recipebook_popup_btn.addEventListener('click', () => dom.recipebook_popup.classList.replace('flex', 'hidden'));
    dom.recipebook_content.addEventListener('click', (e) => { if(e.target.dataset.recipeIndex !== undefined) loadRecipe(e.target.dataset.recipeIndex); });
    ['vg_slider', 'nicotine_slider', 'cooling_slider', 'price_slider'].forEach(key => dom[key].addEventListener('input', updateRecipeAndCost));
    dom.create_batch_btn.addEventListener('click', createAndSellBatch);
    dom.upgrades_container.addEventListener('click', e => { if (e.target.closest('button')?.dataset.key) buyUpgrade(e.target.closest('button').dataset.key); });
    dom.close_mentor_popup_btn.addEventListener('click', () => dom.mentor_popup.classList.add('hidden'));
}
function renderFlavorGrid(isTutorial = false) {
    dom.flavor_grid.innerHTML = FLAVORS.map(f => {
        const disabled = isTutorial && !['딸기', '바나나'].includes(f.name);
        return `<div class="flavor-item flex flex-col items-center justify-center p-2 bg-gray-700 rounded-lg ${disabled ? 'opacity-50 cursor-not-allowed' : ''}" data-flavor-name="${f.name}">
            <span class="text-2xl">${f.icon}</span>
            <span class="text-xs mt-1 text-center">${f.name}</span>
        </div>`
    }).join('');
    dom.flavor_grid.addEventListener('click', (e) => {
        const item = e.target.closest('.flavor-item');
        if (!item || item.classList.contains('opacity-50')) return;
        const flavorName = item.dataset.flavorName;
        const index = tempSelectedFlavors.indexOf(flavorName);
        if (index > -1) {
            tempSelectedFlavors.splice(index, 1);
        } else {
            if (tempSelectedFlavors.length < 5) {
                tempSelectedFlavors.push(flavorName);
            } else {
                logMessage('향료는 최대 5개까지 선택할 수 있습니다.', 'error');
            }
        }
        updateFlavorGridSelection();
    });
}
function updateFlavorGridSelection() {
    const allItems = dom.flavor_grid.querySelectorAll('.flavor-item');
    allItems.forEach(item => {
        item.classList.toggle('selected', tempSelectedFlavors.includes(item.dataset.flavorName));
    });
}
function confirmFlavorSelection() {
    gameState.recipe = {
        selectedFlavors: [...tempSelectedFlavors],
        flavorRatios: {}
    };
    tempSelectedFlavors.forEach(name => {
        gameState.recipe.flavorRatios[name] = 5; // 기본값 5%
    });
    dom.flavor_popup.classList.replace('flex', 'hidden');
    updateSelectedFlavorsDisplay();
    renderIndividualFlavorSliders();
    updateRecipeAndCost();
    showRecipeCreationSteps();
    checkTutorial(1); // 향료 선택 과제 완료 체크
}
function updateSelectedFlavorsDisplay() {
    const flavors = gameState.recipe?.selectedFlavors || [];
    if (flavors.length === 0) {
        dom.selected_flavors_display.innerHTML = '<span class="text-gray-500 italic">버튼을 눌러 향료를 선택하세요...</span>';
        return;
    }
    dom.selected_flavors_display.innerHTML = flavors.map(name => {
        const flavor = FLAVORS.find(f => f.name === name);
        return `<span class="bg-indigo-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">${flavor.icon} ${flavor.name}</span>`;
    }).join('');
}
function renderIndividualFlavorSliders() {
    const flavors = gameState.recipe?.selectedFlavors || [];
    dom.individual_flavor_sliders.innerHTML = flavors.map(name => `
        <div>
            <label for="flavor-slider-${name}" class="flex justify-between text-xs"><span>${name}</span><span id="flavor-value-${name}" class="font-bold text-indigo-300">5%</span></label>
            <input id="flavor-slider-${name}" data-flavor-name="${name}" type="range" min="1" max="20" value="5" class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb flavor-ratio-slider">
        </div>
    `).join('');
    document.querySelectorAll('.flavor-ratio-slider').forEach(slider => slider.addEventListener('input', updateRecipeAndCost));
}
function showRecipeCreationSteps() {
    const show = gameState.recipe && gameState.recipe.selectedFlavors.length > 0;
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
    gameState.companyLevel = Math.floor(Math.log2( (gameState.cash + gameState.monthlySales * 10) / 1000 + 1)) + 1; // 월간매출 가중치 적용
    dom.company_level.textContent = gameState.companyLevel;
    dom.skill_level.textContent = `Lv.${skillLevel}`;
    renderUpgrades();
    updateManufactureButton();
    renderTutorialTasks();
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
    if (!gameState.recipe) return;
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

    const cost = 10 + (gameState.recipe.selectedFlavors.length * 5) + (values.nicotine * 0.5) + (values.cooling * 0.5) + (totalFlavorPerc * 0.2);
    dom.manufacture_cost.textContent = `$${Math.round(cost)}`;
    dom.create_batch_btn.disabled = values.pg < 0;
    updateManufactureButton();
}
async function createAndSellBatch() {
    if (gameState.dailyManufactureCount >= 20) {
        logMessage('하루 최대 제조 횟수(20회)에 도달했습니다. 내일 다시 시도해주세요.', 'error');
        return;
    }
    const manufactureCost = parseFloat(dom.manufacture_cost.textContent.replace('$', ''));
    if (gameState.cash < manufactureCost) {
        logMessage('❌ 자본금이 부족하여 제조할 수 없습니다.', 'error'); return;
    }
    const recipeName = dom.recipe_name_input.value;
     if (!recipeName.trim()) { logMessage('❌ 액상 이름을 지어주세요!', 'error'); return; }
    
    gameState.dailyManufactureCount++;
    gameState.cash -= manufactureCost;
    
    const { qualityScore, penaltyMessage, throatHitScore } = calculateRecipeQualityScore();
    
    if (penaltyMessage) {
        logMessage(`- 제조 실패 -<br>${penaltyMessage}`, 'error');
        updateAllUI();
        await saveGameData(currentUser.uid);
        return;
    }

    let { finalScore, nameScore, isEasterEgg, easterEggBonus, qualityText } = calculateFinalScore(recipeName, qualityScore);

    const skillLevel = Math.floor(Math.log10(gameState.skillExp / 100 + 1)) + 1;
    let skillEventText = '';
    const skillRoll = Math.random();
    if (skillRoll < 0.05 + skillLevel * 0.01) {
        finalScore *= 1.2;
        skillEventText = '<span class="text-cyan-300">대성공!</span> ';
    } else if (skillRoll > 0.95 - skillLevel * 0.01) {
        finalScore *= 0.8;
        skillEventText = '<span class="text-orange-400">작은 실수...</span> ';
    }
    
    const setPrice = parseInt(dom.price_slider.value);
    const optimalPrice = Math.round(15 + qualityScore * 20); 
    const priceRatio = setPrice / optimalPrice;
    const salesVolume = Math.round((20 * finalScore) / Math.pow(priceRatio, 1.5));
    
    let revenue = salesVolume * setPrice * (1 + gameState.upgrades.marketing.bonus);
    let trendBonusText = '';
    const recipeCategories = new Set(gameState.recipe.selectedFlavors.map(name => FLAVORS.find(f => f.name === name).category));
    if(gameState.marketTrend.category && recipeCategories.has(gameState.marketTrend.category)) {
        revenue *= gameState.marketTrend.bonus;
        trendBonusText = ` <span class="text-green-300 font-bold">(트렌드 보너스! x${gameState.marketTrend.bonus})</span>`;
    }

    const profit = revenue - manufactureCost;
    gameState.cash += revenue;
    gameState.monthlySales += revenue;
    gameState.skillExp += Math.max(10, Math.round(profit / 10));

    let priceFeedback = '';
    if (priceRatio > 1.2) priceFeedback = '가격이 너무 비쌌던 것 같습니다.';
    else if (priceRatio < 0.8) priceFeedback = '가격을 더 높게 책정해도 좋았을 것 같습니다.';
    
    const logHtml = `<div class="bg-gray-700 p-3 rounded-lg border-l-4 ${isEasterEgg ? 'border-yellow-400' : (profit > 0 ? 'border-green-500' : 'border-red-500')}">
        <p class="font-bold text-lg ${isEasterEgg ? 'text-yellow-300' : ''}">${recipeName}</p>
        <p class="text-sm ${isEasterEgg ? 'text-yellow-400' : 'text-yellow-300'} mb-1">${skillEventText}${qualityText}${trendBonusText}</p>
        <p class="text-xs text-gray-400">판매: ${salesVolume}개 (개당 $${setPrice}) / 품질: ${Math.round(qualityScore*100)} / 타격감: ${Math.round(throatHitScore * 100)}</p>
        <p class="text-sm mt-1">수익: <span class="${profit > 0 ? 'text-green-400' : 'text-red-400'} font-semibold">$${Math.round(profit)}</span> (월간매출: $${Math.round(gameState.monthlySales)})</p>
        ${priceFeedback ? `<p class="text-xs italic text-gray-500 mt-1">${priceFeedback}</p>` : ''}
    </div>`;
    logMessage(logHtml, 'game');

    checkTutorial(2, profit);
    if (finalScore > gameState.bestRecipe.score) gameState.bestRecipe = { name: recipeName, score: finalScore };
    checkAndSetMarketTrend();
    
    delete gameState.recipe;
    tempSelectedFlavors = [];
    updateSelectedFlavorsDisplay();
    showRecipeCreationSteps();
    dom.recipe_name_input.value = '';
    dom.vg_slider.value = 50;
    dom.nicotine_slider.value = 3;
    dom.cooling_slider.value = 0;
    dom.price_slider.value = 20;

    updateAllUI();
    await saveGameData(currentUser.uid);
}

function calculateRecipeQualityScore() {
    const vg = parseInt(dom.vg_slider.value);
    const nicotine = parseInt(dom.nicotine_slider.value);
    const cooling = parseInt(dom.cooling_slider.value);
    
    const flavorRatios = gameState.recipe.flavorRatios;
    const totalFlavorPerc = Object.values(flavorRatios).reduce((a, b) => a + b, 0);
    
    if (totalFlavorPerc > 30) return { qualityScore: 0, penaltyMessage: "총 향료 농도가 너무 높습니다 (최대 30%)." };
    if (nicotine > 20) return { qualityScore: 0, penaltyMessage: "니코틴이 너무 강력해 아무도 찾지 않습니다." };
    if (cooling > 8) return { qualityScore: 0, penaltyMessage: "쿨링이 너무 강력해 아무도 찾지 않습니다." };
    
    const flavorNames = gameState.recipe.selectedFlavors;
    let flavorComboScore = 1.0;
    for(let i = 0; i < flavorNames.length; i++){
        for(let j = i + 1; j < flavorNames.length; j++){
            const key1 = `${flavorNames[i]}-${flavorNames[j]}`;
            const key2 = `${flavorNames[j]}-${flavorNames[i]}`;
            if(SYNERGY_SCORES[key1] || SYNERGY_SCORES[key2]) flavorComboScore *= (SYNERGY_SCORES[key1] || SYNERGY_SCORES[key2]);
            if(CONFLICT_SCORES[key1] || CONFLICT_SCORES[key2]) flavorComboScore *= (CONFLICT_SCORES[key1] || CONFLICT_SCORES[key2]);
        }
    }
    flavorComboScore *= (1 + gameState.upgrades.flavor_rnd.bonus);

    const isMTL = (100 - vg - totalFlavorPerc) >= 50;
    const nicOptimal = isMTL ? 10 : 4.5;
    const nicScore = 1 - Math.abs(nicotine - nicOptimal) / (isMTL ? 10 : 6);

    const vgScore = 1 - Math.abs(vg - (isMTL ? 50 : 60)) / 50;
    const coolingScore = 1 - Math.abs(cooling - 3) / 7;
    
    const throatHitScore = (nicotine / 20) * 0.6 + (cooling / 10) * 0.2 + (Object.keys(flavorRatios).filter(name => ['연초','디저트'].includes(FLAVORS.find(f => f.name === name).category)).length / 5) * 0.2;

    const finalScore = (flavorComboScore * 0.35) + (vgScore * 0.2) + (nicScore * 0.25) + (coolingScore * 0.1) + (throatHitScore * 0.1);
    
    return { qualityScore: Math.max(0.1, finalScore * (1 + gameState.upgrades.lab.bonus)), penaltyMessage: null, throatHitScore };
}
function calculateFinalScore(recipeName, qualityScore) {
    const flavorNames = new Set(gameState.recipe.selectedFlavors);
    let isEasterEgg = false, easterEggBonus = 1.0, qualityText = '';
    const lowerName = recipeName.toLowerCase();
    const vg = parseInt(dom.vg_slider.value);
    const nic = parseInt(dom.nicotine_slider.value);
    const totalFlavorPerc = Object.values(gameState.recipe.flavorRatios).reduce((a, b) => a + b, 0);
    const isMTL = (100 - vg - totalFlavorPerc) >= 50;

    const goatApple = lowerName.includes('고트애플');
    const socioPeach = lowerName.includes('소시오피치');
    const hasAppleStrawberry = flavorNames.has('사과') && flavorNames.has('딸기');
    const hasPeachPlum = flavorNames.has('복숭아') && flavorNames.has('자두');
    
    if (goatApple && hasAppleStrawberry) {
        if((isMTL && nic === 10) || (!isMTL && nic === 6)) { isEasterEgg = true; easterEggBonus = 1.8; qualityText = "🎉 히든 레시피 발견!"; }
    } else if (socioPeach && hasPeachPlum) {
         if((isMTL && nic === 10) || (!isMTL && nic === 6)) { isEasterEgg = true; easterEggBonus = 1.8; qualityText = "🎉 히든 레시피 발견!"; }
    }
    
    const nameScore = calculateNameScore(recipeName);
    const finalScore = qualityScore * nameScore * easterEggBonus;
    if (!isEasterEgg) {
        if (finalScore > 1.0) qualityText = "👑 대히트 예감!";
        else if (finalScore > 0.8) qualityText = "👍 아주 좋은데요?";
        else if (finalScore > 0.6) qualityText = "🤔 나쁘지 않아요.";
        else qualityText = "😥 개선이 필요해 보입니다...";
    }
    return { finalScore, nameScore, isEasterEgg, easterEggBonus, qualityText };
}
function calculateNameScore(name) {
    if (!name.trim()) return 0.8;
    let score = 1.0;
    gameState.recipe.selectedFlavors.forEach(flavor => { if (name.toLowerCase().includes(FLAVORS.find(f => f.name === flavor).name.toLowerCase())) score += 0.05; });
    if (name.length > 5 && name.length < 20) score += 0.05;
    return Math.min(1.4, score);
}
function buyUpgrade(key) {
    const upg = gameState.upgrades[key];
    if (gameState.cash >= upg.cost && upg.level < upg.maxLevel) {
        gameState.cash -= upg.cost; upg.level++;
        upg.bonus += upg.bonusPerLevel;
        upg.cost = Math.round(upg.baseCost * Math.pow(1.8, upg.level));
        logMessage(`✅ ${upg.name}을(를) Lv.${upg.level}(으)로 업그레이드했습니다!`, 'system');
        updateAllUI(); saveGameData(currentUser.uid);
    }
}
function checkAndSetMarketTrend() {
    if (gameState.marketTrend.duration > 0) {
        gameState.marketTrend.duration--;
        if (gameState.marketTrend.duration === 0) {
            gameState.marketTrend.category = null;
            logMessage('🔔 시장 트렌드가 초기화되었습니다.', 'system');
        }
    } else if (Math.random() < 0.2) {
        const trendCategories = ['과일', '디저트', '멘솔', '음료', '연초'];
        gameState.marketTrend.category = trendCategories[Math.floor(Math.random() * trendCategories.length)];
        gameState.marketTrend.duration = 5;
        logMessage(`🔔 시장 뉴스: 지금은 '${gameState.marketTrend.category}' 계열이 대유행! (x${gameState.marketTrend.bonus} 보너스)`, 'trend');
    }
}
function logMessage(message, type = 'info') {
    if (!dom.log) return;
    if (dom.log.children.length > 50) dom.log.removeChild(dom.log.lastChild);
    const div = document.createElement('div');
    const typeClasses = { game: '', error: 'text-red-400 font-bold p-2 text-center', system: 'text-blue-300 italic p-2 text-center', trend: 'text-yellow-300 font-bold p-2 text-center bg-yellow-900/50 rounded-lg' };
    if (type === 'game') div.innerHTML = message;
    else { div.textContent = message; div.className = typeClasses[type] || 'text-gray-400'; }
    dom.log.prepend(div);
}
function renderTutorialTasks() {
    if (!gameState.tutorial) return;
    const allTasksCompleted = gameState.tutorial.tasks.every(t => t.completed);
    dom.tutorial_section.classList.toggle('hidden', allTasksCompleted);
    if (allTasksCompleted) return;

    dom.task_list.innerHTML = gameState.tutorial.tasks.map(task => `
        <li class="flex items-center ${task.completed ? 'text-gray-500 line-through' : ''}">
            <span class="mr-2">${task.completed ? '✅' : '⬜️'}</span>
            <span>${task.text}</span>
        </li>
    `).join('');
}
function showMentorMessage(message, duration = 5000) {
    dom.mentor_message.textContent = message;
    dom.mentor_popup.classList.remove('hidden');
    setTimeout(() => {
        dom.mentor_popup.classList.add('hidden');
    }, duration);
}
function checkTutorial(taskId, value = 0) {
    if (!gameState.tutorial || gameState.tutorial.step === 'completed') return;

    if (taskId === 1 && !gameState.tutorial.tasks[0].completed) {
        completeTutorialTask(0);
    } else if (taskId === 2 && !gameState.tutorial.tasks[1].completed) {
        completeTutorialTask(1);
        checkTutorial(3, value); // 수익 과제도 바로 체크
    } else if (taskId === 3 && !gameState.tutorial.tasks[2].completed) {
        if (gameState.monthlySales >= 100) {
            completeTutorialTask(2);
        }
    } else if (!gameState.tutorial.introSeen) {
        showMentorMessage(TUTORIAL.messages[0]);
        gameState.tutorial.introSeen = true;
    }
}
function completeTutorialTask(taskIndex) {
    if (gameState.tutorial.tasks[taskIndex].completed) return;
    gameState.tutorial.tasks[taskIndex].completed = true;
    const reward = TUTORIAL.tasks[taskIndex].reward;
    gameState.cash += reward;
    showMentorMessage(TUTORIAL.messages[taskIndex + 1]);
    updateAllUI();
    const allCompleted = gameState.tutorial.tasks.every(t => t.completed);
    if(allCompleted){
        gameState.tutorial.step = 'completed';
    }
}
function openFlavorPopup() {
    tempSelectedFlavors = [...(gameState.recipe?.selectedFlavors || [])];
    const isTutorialActive = gameState.tutorial && !gameState.tutorial.tasks[0].completed;
    renderFlavorGrid(isTutorialActive);
    updateFlavorGridSelection();
    dom.flavor_popup.classList.replace('hidden', 'flex');
}
function openRecipeBook() {
    renderRecipeBook();
    dom.recipebook_popup.classList.replace('hidden', 'flex');
}
function renderRecipeBook() {
    if (gameState.savedRecipes.length === 0) {
        dom.recipebook_content.innerHTML = '<p class="text-center text-gray-400">아직 저장된 레시피가 없습니다.</p>';
        return;
    }
    dom.recipebook_content.innerHTML = gameState.savedRecipes.map((recipe, index) => {
        const flavorsText = recipe.selectedFlavors.map(name => {
            const flavor = FLAVORS.find(f => f.name === name);
            return `<span class="bg-gray-600 text-white text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">${flavor.icon} ${name}</span>`;
        }).join('');
        return `<div class="bg-gray-700 p-4 rounded-lg">
                <div class="flex justify-between items-center">
                    <p class="font-bold text-lg text-yellow-300">${recipe.name}</p>
                    <button data-recipe-index="${index}" class="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-1 px-3 rounded-lg btn">불러오기</button>
                </div>
                <div class="text-xs text-gray-400 mt-2">${flavorsText}</div>
            </div>`;
    }).join('');
}
function loadRecipe(index) {
    const recipe = gameState.savedRecipes[index];
    if (!recipe) return;

    tempSelectedFlavors = recipe.selectedFlavors;
    confirmFlavorSelection();
    
    setTimeout(() => {
        gameState.recipe.flavorRatios = recipe.flavorRatios;
        dom.vg_slider.value = recipe.vg;
        dom.nicotine_slider.value = recipe.nicotine;
        dom.cooling_slider.value = recipe.cooling;
        dom.price_slider.value = recipe.price;
        dom.recipe_name_input.value = recipe.name;
        document.querySelectorAll('.flavor-ratio-slider').forEach(slider => {
            const name = slider.dataset.flavorName;
            slider.value = recipe.flavorRatios[name] || 5;
        });
        updateRecipeAndCost();
    }, 100);

    dom.recipebook_popup.classList.replace('flex', 'hidden');
    logMessage(`'${recipe.name}' 레시피를 불러왔습니다!`, 'system');
}
function updateManufactureButton() {
    if (!dom.create_batch_btn) return;
    const remaining = 20 - (gameState.dailyManufactureCount || 0);
    if (remaining <= 0) {
        dom.create_batch_btn.textContent = '일일 제조 횟수 소진';
        dom.create_batch_btn.disabled = true;
    } else {
        const cost = dom.manufacture_cost.textContent;
        dom.create_batch_btn.innerHTML = `제조 및 판매 (${remaining}회 남음) (비용: <span id="manufacture-cost">${cost}</span>)`;
    }
}

initGame();
