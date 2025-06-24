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
     // --- 과일 계열 ---
    { name: '딸기', category: '과일', icon: '🍓' }, 
    { name: '바나나', category: '과일', icon: '🍌' }, 
    { name: '블루베리', category: '과일', icon: '🫐' },
    { name: '망고', category: '과일', icon: '🥭' }, 
    { name: '레몬', category: '과일', icon: '🍋' }, 
    { name: '라임', category: '과일', icon: '🍈' }, 
    { name: '사과', category: '과일', icon: '🍎' }, 
    { name: '복숭아', category: '과일', icon: '🍑' }, 
    { name: '자두', category: '과일', icon: '🟣' }, 
    { name: '파인애플', category: '과일', icon: '🍍' }, 
    { name: '포도', category: '과일', icon: '🍇' }, 
    { name: '자몽', category: '과일', icon: '🍊' }, 
    { name: '수박', category: '과일', icon: '🍉' }, 
    { name: '멜론', category: '과일', icon: '🍈' }, 
    { name: '리치', category: '과일', icon: '🥥' }, 
    { name: '체리', category: '과일', icon: '🍒' },
    { name: '키위', category: '과일', icon: '🥝' },
    { name: '알로에', category: '과일', icon: '🪴' },
    { name: '구아바', category: '과일', icon: '🥑' },
    { name: '패션후르츠', category: '과일', icon: '🥭' },
    { name: '시르삭', category: '과일', icon: '🍈' }, // 신규 추가

    // --- 디저트 계열 ---
    { name: '바닐라', category: '디저트', icon: '🍦' }, 
    { name: '커스타드', category: '디저트', icon: '🍮' }, 
    { name: '치즈케이크', category: '디저트', icon: '🍰' }, 
    { name: '초콜릿', category: '디저트', icon: '🍫' }, 
    { name: '카라멜', category: '디저트', icon: '🍬' }, 
    { name: '요거트', category: '디저트', icon: '🥛' },
    { name: '애플파이', category: '디저트', icon: '🥧' }, 
    { name: '도넛', category: '디저트', icon: '🍩' }, 
    { name: '쿠키앤크림', category: '디저트', icon: '🍪' },
    { name: '솜사탕', category: '디저트', icon: '☁️' },
    { name: '버터스카치', category: '디저트', icon: '🧈' },

    // --- 연초 계열 ---
    { name: '연초', category: '연초', icon: '🚬' }, 
    { name: '시가', category: '연초', icon: '💨' },
    { name: 'RY4', category: '연초', icon: '🍂' },
    { name: '쿠바 시가', category: '연초', icon: '🇨🇺' }, // 신규 추가
    { name: '파이프 연초', category: '연초', icon: '📜' }, // 신규 추가
    { name: '크림 연초', category: '연초', icon: '🍮' }, // 신규 추가

    // --- 멘솔/민트 계열 ---
    { name: '멘솔', category: '멘솔', icon: '❄️' }, 
    { name: '스피어민트', category: '멘솔', icon: '🍃' },
    { name: '페퍼민트', category: '멘솔', icon: '🌿' },

    // --- 음료 계열 ---
    { name: '커피', category: '음료', icon: '☕' }, 
    { name: '콜라', category: '음료', icon: '🥤' },
    { name: '에너지드링크', category: '음료', icon: '⚡' },
    { name: '레몬에이드', category: '음료', icon: '🍹' },
    { name: '밀크티', category: '음료', icon: '🧋' },
    { name: '피나콜라다', category: '음료', icon: '🍍' },

    // --- 특별 향료 ---
    { name: '꿀', category: '특별', icon: '🍯' }, 
    { name: '시나몬', category: '특별', icon: '🪵' },
    { name: '장미', category: '특별', icon: '🌹' },
    { name: '헤이즐넛', category: '특별', icon: '🌰' },
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
    dom.open_flavor_popup_btn.addEventListener('click', () => {
        tempSelectedFlavors = [...(gameState.recipe?.selectedFlavors || [])];
        updateFlavorGridSelection();
        dom.flavor_popup.classList.replace('hidden', 'flex');
    });
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
        if (tempSelectedFlavors.includes(item.dataset.flavorName)) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
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
    gameState.companyLevel = Math.floor(Math.log2( (gameState.cash + gameState.monthlySales) / 1000 + 1)) + 1;
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
}
async function createAndSellBatch() {
    const manufactureCost = parseFloat(dom.manufacture_cost.textContent.replace('$', ''));
    if (gameState.cash < manufactureCost) {
        logMessage('❌ 자본금이 부족하여 제조할 수 없습니다.', 'error'); return;
    }
    const recipeName = dom.recipe_name_input.value;
     if (!recipeName.trim()) { logMessage('❌ 액상 이름을 지어주세요!', 'error'); return; }

    gameState.cash -= manufactureCost;
    
    const { qualityScore, penaltyMessage, throatHitScore } = calculateRecipeQualityScore();
    
    if (penaltyMessage) {
        logMessage(`- 제조 실패 -<br>${penaltyMessage}`, 'error');
        updateAllUI();
        await saveGameData(currentUser.uid);
        return;
    }

    const { finalScore, nameScore, isEasterEgg, easterEggBonus, qualityText } = calculateFinalScore(recipeName, qualityScore);

    // 제조 기술에 따른 대성공/실수
    const skillLevel = Math.floor(Math.log10(gameState.skillExp / 100 + 1)) + 1;
    let skillEventText = '';
    const skillRoll = Math.random();
    if (skillRoll < 0.05 + skillLevel * 0.01) { // 대성공 확률
        finalScore *= 1.2;
        skillEventText = '<span class="text-cyan-300">대성공!</span> ';
    } else if (skillRoll > 0.95 - skillLevel * 0.01) { // 실수 확률
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

    if (finalScore > gameState.bestRecipe.score) gameState.bestRecipe = { name: recipeName, score: finalScore };
    checkAndSetMarketTrend();
    updateAllUI();
    dom.recipe_name_input.value = '';
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
    const nicOptimal = isMTL ? 10 : 3;
    const nicScore = 1 - Math.abs(nicotine - nicOptimal) / (isMTL ? 10 : 6);

    const vgScore = 1 - Math.abs(vg - 55) / 45;
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
    const isMTL = (100 - vg - Object.values(gameState.recipe.flavorRatios).reduce((a, b) => a + b, 0)) >= 50;

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
    gameState.recipe.selectedFlavors.forEach(flavor => { if (name.toLowerCase().includes(flavor.toLowerCase())) score += 0.05; });
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
