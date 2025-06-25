import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, query, orderBy, limit, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { firebaseConfig, FLAVORS, SYNERGY_SCORES, CONFLICT_SCORES, CRAFTING_RECIPES, TUTORIAL, DOM_IDS } from './game-data.js';
import * as UIManager from './ui-manager.js';

let db, auth;
let gameState = {};
let currentUser = null;
let unsubscribeLeaderboard = null;
let tempSelectedFlavors = [];

// Firebase 초기화
try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (e) {
    console.error("Firebase 초기화 중 오류 발생:", e);
    UIManager.showAuthError(`서버 연결 실패: ${e.code || e.message}`);
}

// 사용할 DOM 요소 캐싱
UIManager.cacheDOM(DOM_IDS);

// 새로운 유저를 위한 기본 게임 상태
function getBaseGameState(user) {
    return {
        uid: user.uid,
        email: user.email || '게스트',
        cash: 1000,
        monthlySales: 0,
        companyLevel: 1,
        skillExp: 0,
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
        tutorial: { tasks: JSON.parse(JSON.stringify(TUTORIAL.tasks)), introSeen: false },
        createdAt: serverTimestamp()
    };
}

// 인증 상태 감지
if (auth) {
    onAuthStateChanged(auth, async user => {
        if (user) {
            currentUser = user;
            await loadGameData(user);
            initGame(user);
        } else {
            currentUser = null;
            UIManager.showLoginScreen();
            if (unsubscribeLeaderboard) {
                unsubscribeLeaderboard();
                unsubscribeLeaderboard = null;
            }
        }
    });
}

// 인증 처리 (로그인, 회원가입, 게스트)
async function handleAuth(action, credentials) {
    if (!auth) {
        UIManager.showAuthError("서버 연결이 필요합니다.");
        return;
    }
    UIManager.clearAuthError();
    try {
        if (action === 'login') {
            await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
        } else if (action === 'signup') {
            const userCredential = await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
            // 새 유저 데이터는 onAuthStateChanged에서 loadGameData를 통해 생성
        } else if (action === 'guest') {
            await signInAnonymously(auth);
        }
    } catch (error) {
        UIManager.handleAuthError(error);
    }
}

// 게임 데이터 로드
async function loadGameData(user) {
    if (!db) {
        gameState = getBaseGameState(user);
        return;
    }
    const userDocRef = doc(db, 'players', user.uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
        gameState = docSnap.data();
        // 월간 초기화 로직
        const currentMonth = new Date().getMonth();
        if (gameState.lastLoginMonth !== currentMonth) {
            UIManager.logMessage('새로운 달이 시작되었습니다! 월간 매출과 회사 업그레이드가 초기화됩니다. 새로운 시즌을 시작하세요!', 'system');
            const baseState = getBaseGameState(user);
            gameState.monthlySales = baseState.monthlySales;
            gameState.upgrades = baseState.upgrades;
            gameState.lastLoginMonth = currentMonth;
        }
    } else {
        // 새 유저인 경우 기본 데이터 생성 후 저장
        gameState = getBaseGameState(user);
        await saveGameData();
    }
    // 일일 제조 횟수 초기화
    const today = new Date().toLocaleDateString('ko-KR');
    if (gameState.lastManufactureDate !== today) {
        gameState.dailyManufactureCount = 0;
        gameState.lastManufactureDate = today;
    }
    // 데이터 무결성 검사
    if (!gameState.skillExp) gameState.skillExp = 0;
    if (!gameState.savedRecipes) gameState.savedRecipes = [];
    if (!gameState.tutorial) gameState.tutorial = getBaseGameState(user).tutorial;
}

// 게임 데이터 저장
async function saveGameData() {
    if (!currentUser || !db) return;
    try {
        const userDocRef = doc(db, 'players', currentUser.uid);
        await setDoc(userDocRef, { ...gameState, updatedAt: serverTimestamp() }, { merge: true });
    } catch (error) {
        console.error("게임 데이터 저장 실패:", error);
    }
}

// 리더보드 데이터 수신
function listenToLeaderboard() {
    if (!db) return;
    if (currentUser && currentUser.isAnonymous) {
        UIManager.renderLeaderboard(null, true);
        return;
    }
    const q = query(collection(db, "players"), orderBy("monthlySales", "desc"), limit(10));
    unsubscribeLeaderboard = onSnapshot(q, (snapshot) => {
        const players = snapshot.docs.map(doc => doc.data());
        UIManager.renderLeaderboard(players, false, currentUser.uid);
    }, (error) => {
        console.error("리더보드 로딩 실패:", error);
        UIManager.renderLeaderboard(null, false, null, true);
    });
}

// 게임 초기화
function initGame(user) {
    UIManager.showGameScreen(user);
    UIManager.renderFlavorGrid(false, handleFlavorClick, handleFlavorMouseover, handleFlavorMouseout);
    addEventListeners();
    UIManager.updateAllUI(gameState);
    listenToLeaderboard();
    checkTutorial();
}

// 모든 이벤트 리스너 등록
function addEventListeners() {
    // VG, 니코틴 등 메인 슬라이더 값이 바뀔 때마다 UI를 업데이트하는 함수
    const handleMainSliderChange = () => {
        if (gameState.recipe) {
            UIManager.updateRecipeAndCost(gameState);
        }
    };

    UIManager.addCommonEventListeners(
        openFlavorPopup,
        confirmFlavorSelection,
        createAndSellBatch,
        buyUpgrade,
        () => UIManager.openPopup(UIManager.dom.leaderboard_popup),
        () => UIManager.closePopup(UIManager.dom.leaderboard_popup),
        handleMainSliderChange,
        () => {
            if (auth) {
                signOut(auth);
            }
        }
    );

    UIManager.addAuthEventListeners(
        () => handleAuth('login', UIManager.getAuthInput()),
        () => handleAuth('signup', UIManager.getAuthInput()),
        () => handleAuth('guest')
    );
}

// 향료 선택 팝업 열기
function openFlavorPopup() {
    const isTutorialActive = gameState.tutorial && !gameState.tutorial.tasks[0].completed;
    UIManager.renderFlavorGrid(isTutorialActive, handleFlavorClick, handleFlavorMouseover, handleFlavorMouseout);
    UIManager.updateFlavorGridSelection(tempSelectedFlavors);
    UIManager.openPopup(UIManager.dom.flavor_popup);
}

// 향료 클릭 처리
function handleFlavorClick(e) {
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
            UIManager.logMessage('향료는 최대 5개까지 선택할 수 있습니다.', 'error');
        }
    }
    UIManager.updateFlavorGridSelection(tempSelectedFlavors);
}

function handleFlavorMouseover(e) { UIManager.showFlavorTooltip(e, FLAVORS); }
function handleFlavorMouseout() { UIManager.hideFlavorTooltip(); }

// 향료 선택 완료
function confirmFlavorSelection() {
    gameState.recipe = {
        selectedFlavors: [...tempSelectedFlavors],
        flavorRatios: {}
    };
    tempSelectedFlavors.forEach(name => {
        gameState.recipe.flavorRatios[name] = 5; // 기본값 5%
    });
    UIManager.closePopup(UIManager.dom.flavor_popup);
    UIManager.updateSelectedFlavorsDisplay(gameState.recipe.selectedFlavors);
    UIManager.renderIndividualFlavorSliders(gameState.recipe.selectedFlavors, () => UIManager.updateRecipeAndCost(gameState));
    UIManager.updateRecipeAndCost(gameState);
    UIManager.showRecipeCreationSteps(true);
    checkTutorial(1);
}

// 액상 제조 및 판매
async function createAndSellBatch() {
    if (gameState.dailyManufactureCount >= 20) {
        UIManager.logMessage('하루 최대 제조 횟수(20회)에 도달했습니다. 내일 다시 시도해주세요.', 'error'); return;
    }
    const manufactureCost = UIManager.getCurrentCost();
    if (gameState.cash < manufactureCost) {
        UIManager.logMessage('❌ 자본금이 부족하여 제조할 수 없습니다.', 'error'); return;
    }
    const recipeName = UIManager.getRecipeName();
    if (!recipeName.trim()) { UIManager.logMessage('❌ 액상 이름을 지어주세요!', 'error'); return; }

    gameState.dailyManufactureCount++;
    gameState.cash -= manufactureCost;

    const { qualityScore, penaltyMessage } = calculateRecipeQualityScore();
    
    if (penaltyMessage) {
        UIManager.logMessage(`- 제조 실패 -<br>${penaltyMessage}`, 'error');
        UIManager.updateAllUI(gameState);
        await saveGameData();
        return;
    }
    
    let { finalScore, isEasterEgg, qualityText } = calculateFinalScore(recipeName, qualityScore);
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
    
    const setPrice = UIManager.getCurrentRecipeValues().price;
    const optimalPrice = Math.round(15 + qualityScore * 20); 
    const priceRatio = Math.max(0.1, setPrice / optimalPrice);
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
    
    const logHTML = `
        <div class="border-b border-gray-700 pb-2 mb-2">
            <p class="font-bold text-lg">${recipeName} <span class="text-sm ${profit > 0 ? 'text-green-400' : 'text-red-400'}">(${profit >= 0 ? '+' : ''}${Math.round(profit)}$)</span></p>
            <p class="text-sm">${skillEventText}${qualityText}${trendBonusText}</p>
            <p class="text-xs text-gray-400">판매량: ${salesVolume}개 | 설정가: $${setPrice} | 품질: ${Math.round(finalScore*100)}점</p>
        </div>`;
    UIManager.logMessage(logHTML, 'game');

    if (finalScore > gameState.bestRecipe.score) gameState.bestRecipe = { name: recipeName, score: finalScore };
    
    checkAndSetMarketTrend();
    resetRecipeMaker();
    UIManager.updateAllUI(gameState);
    await saveGameData();
}

// 레시피 품질 점수 계산
function calculateRecipeQualityScore() {
    const { vg, nicotine, cooling, flavorRatios } = UIManager.getCurrentRecipeValues();
    const totalFlavorPerc = Object.values(flavorRatios).reduce((a, b) => a + b, 0);

    if (totalFlavorPerc > 30) return { penaltyMessage: "총 향료 농도가 너무 높습니다 (최대 30%)." };
    if (nicotine > 20) return { penaltyMessage: "니코틴이 너무 강력해 아무도 찾지 않습니다." };
    if (cooling > 8) return { penaltyMessage: "쿨링이 너무 강력해 아무도 찾지 않습니다." };
    
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
    const qualityScore = (flavorComboScore * 0.5) + (vgScore * 0.25) + (nicScore * 0.25);
    
    return { qualityScore: Math.max(0.1, qualityScore * (1 + gameState.upgrades.lab.bonus)), penaltyMessage: null };
}

// 최종 점수 계산
function calculateFinalScore(recipeName, qualityScore) {
    const { nicotine, flavorRatios } = UIManager.getCurrentRecipeValues();
    const flavorNames = new Set(Object.keys(flavorRatios));
    let isEasterEgg = false, easterEggBonus = 1.0, qualityText = '';

    for (const craftedName in CRAFTING_RECIPES) {
        const recipe = CRAFTING_RECIPES[craftedName];
        if (recipe.ingredients.every(ing => flavorNames.has(ing)) && flavorNames.size === recipe.ingredients.length) {
            isEasterEgg = true;
            easterEggBonus = recipe.bonus;
            qualityText = `✨ 제조법 발견! [${craftedName}]`;
            break;
        }
    }

    if (!isEasterEgg) {
        if (qualityScore > 0.9) qualityText = "👑 대히트 예감!";
        else if (qualityScore > 0.75) qualityText = "👍 아주 좋은데요?";
        else if (qualityScore > 0.5) qualityText = "🤔 나쁘지 않아요.";
        else qualityText = "😥 개선이 필요해 보입니다...";
    }
    
    return { finalScore: qualityScore * easterEggBonus, isEasterEgg, qualityText };
}

// 회사 업그레이드
async function buyUpgrade(key) {
    const upg = gameState.upgrades[key];
    if (gameState.cash >= upg.cost && upg.level < upg.maxLevel) {
        gameState.cash -= upg.cost;
        upg.level++;
        upg.bonus += upg.bonusPerLevel;
        upg.cost = Math.round(upg.baseCost * Math.pow(1.8, upg.level));
        UIManager.logMessage(`✅ ${upg.name}을(를) Lv.${upg.level}(으)로 업그레이드했습니다!`, 'system');
        UIManager.updateAllUI(gameState);
        await saveGameData();
    }
}

// 시장 트렌드 확인 및 설정
function checkAndSetMarketTrend() {
    if (gameState.marketTrend.duration > 0) {
        gameState.marketTrend.duration--;
        if (gameState.marketTrend.duration === 0) {
            gameState.marketTrend.category = null;
            UIManager.logMessage('🔔 시장 트렌드가 초기화되었습니다.', 'system');
        }
    } else if (Math.random() < 0.2) {
        const trendCategories = ['과일', '디저트', '멘솔', '음료', '연초'];
        gameState.marketTrend.category = trendCategories[Math.floor(Math.random() * trendCategories.length)];
        gameState.marketTrend.duration = 5;
        UIManager.logMessage(`🔔 시장 뉴스: 지금은 '${gameState.marketTrend.category}' 계열이 대유행! (x${gameState.marketTrend.bonus} 보너스)`, 'trend');
    }
    const marketTrendElement = document.getElementById('market-trend');
    if(marketTrendElement) {
        marketTrendElement.textContent = gameState.marketTrend.category ? `${gameState.marketTrend.category} 계열 유행 중!` : '특별한 트렌드 없음';
    }
}

// 레시피 제조기 초기화
function resetRecipeMaker() {
    delete gameState.recipe;
    tempSelectedFlavors = [];
    UIManager.updateSelectedFlavorsDisplay([]);
    UIManager.showRecipeCreationSteps(false);
    UIManager.resetSliders();
    UIManager.getRecipeNameInput().value = '';
}

// 튜토리얼 진행도 확인
function checkTutorial(taskId = 0) {
    if (!gameState.tutorial || gameState.tutorial.tasks.every(t => t.completed)) return;

    if (taskId === 1 && !gameState.tutorial.tasks[0].completed) {
        completeTutorialTask(0);
    } else if (!gameState.tutorial.introSeen) {
        UIManager.showMentorMessage(TUTORIAL.messages[0]);
        gameState.tutorial.introSeen = true;
    }
}

// 튜토리얼 과제 완료
async function completeTutorialTask(taskIndex) {
    if (gameState.tutorial.tasks[taskIndex].completed) return;
    gameState.tutorial.tasks[taskIndex].completed = true;
    const reward = TUTORIAL.tasks[taskIndex].reward;
    if (reward) {
        gameState.cash += reward;
    }
    UIManager.showMentorMessage(TUTORIAL.messages[taskIndex + 1]);
    UIManager.updateAllUI(gameState);
    if (gameState.tutorial.tasks.every(t => t.completed)) {
        UIManager.hideTutorialSection();
    }
    await saveGameData();
}
