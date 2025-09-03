import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, query, orderBy, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { firebaseConfig, FLAVORS, SYNERGY_SCORES, CONFLICT_SCORES, CRAFTING_RECIPES, TUTORIAL, DOM_IDS, ORDER_CRITERIA } from './game-data.js';
import * as UIManager from './ui-manager.js';

let db, auth;
let gameState = {};
let currentUser = null;
// ✨ 변경점: 전역 unsubscribe 변수가 ui-manager로 이동했으므로 여기서 삭제합니다.
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

// 사용할 DOM 요소 캐싱 및 이벤트 리스너 등록
UIManager.cacheDOM(DOM_IDS);
addEventListeners();

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
        activeOrder: null,
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
            // ✨ 변경점: 로그아웃 시 ui-manager의 리스너 중지 함수를 호출합니다.
            UIManager.stopListeningToLeaderboard();
        }
    });
}

// 인증 처리
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
            await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
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
        const currentMonth = new Date().getMonth();
        // 월간 초기화 로직은 서버(Cron Job)에서 처리하므로 클라이언트에서는 삭제하거나 주석 처리합니다.
        /* if (gameState.lastLoginMonth !== currentMonth) {
            UIManager.logMessage('새로운 달이 시작되었습니다! 월간 매출과 회사 업그레이드가 초기화됩니다.', 'system');
            const baseState = getBaseGameState(user);
            gameState.monthlySales = baseState.monthlySales;
            gameState.upgrades = baseState.upgrades;
            gameState.lastLoginMonth = currentMonth;
        }
      */
    } else {
        gameState = getBaseGameState(user);
        await saveGameData();
    }

    const today = new Date().toLocaleDateString('ko-KR');
    if (gameState.lastManufactureDate !== today) {
        gameState.dailyManufactureCount = 0;
        gameState.lastManufactureDate = today;
    }

    if (!gameState.skillExp) gameState.skillExp = 0;
    if (!gameState.savedRecipes) gameState.savedRecipes = [];
    if (!gameState.tutorial) gameState.tutorial = getBaseGameState(user).tutorial;
    if (gameState.activeOrder === undefined) gameState.activeOrder = null;
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

// 주문 생성 및 확인 함수 (기존과 동일)
function generateNewOrder() {
    // 40% 확률로만 새로운 주문이 생성되도록 수정
    if (gameState.activeOrder === null && Math.random() < 0.4) {
        const criteriaCount = Math.floor(Math.random() * 2) + 1; // 1~2개의 조건 조합
        const selectedParts = [];
        const finalCriteria = {};
        let finalText = "손님: ";
        
        const availableCategories = Object.keys(ORDER_CRITERIA);

        for (let i = 0; i < criteriaCount; i++) {
            if (availableCategories.length === 0) break;
            
            const randomCategoryIndex = Math.floor(Math.random() * availableCategories.length);
            const categoryKey = availableCategories.splice(randomCategoryIndex, 1)[0];
            
            const parts = ORDER_CRITERIA[categoryKey];
            const randomPart = parts[Math.floor(Math.random() * parts.length)];
            selectedParts.push(randomPart);
        }

        selectedParts.forEach((part, index) => {
            Object.assign(finalCriteria, part.criteria);
            finalText += part.text + (index === selectedParts.length - 1 ? "" : ", ");
        });
        finalText += "로 만들어주세요!";

        const newOrder = {
            id: Date.now(),
            text: finalText,
            criteria: finalCriteria
        };

        gameState.activeOrder = newOrder;
        UIManager.renderCustomerOrder(gameState.activeOrder);
    }
}

function checkOrderCompletion(recipe, order) {
    if (!order) return false;

    const criteria = order.criteria;
    const recipeCategories = new Set(recipe.selectedFlavors.map(name => FLAVORS.find(f => f.name === name).category));
    const values = UIManager.getCurrentRecipeValues();

    if (criteria.category && !recipeCategories.has(criteria.category)) return false;
    if (criteria.nicotine_max && values.nicotine > criteria.nicotine_max) return false;
    if (criteria.nicotine_min && values.nicotine < criteria.nicotine_min) return false;
    if (criteria.nicotine_exact && values.nicotine !== criteria.nicotine_exact) return false;
    if (criteria.cooling_max && values.cooling > criteria.cooling_max) return false;
    if (criteria.cooling_min && values.cooling < criteria.cooling_min) return false;
    if (criteria.flavor_count_min && recipe.selectedFlavors.length < criteria.flavor_count_min) return false;
    if (criteria.flavor_count_max && recipe.selectedFlavors.length > criteria.flavor_count_max) return false;

    return true;
}

// ✨ 변경점: 리더보드 리스너 함수는 이제 필요 없으므로 삭제합니다.
/*
function listenToLeaderboard() { ... }
*/

// 게임 초기화
function initGame(user) {
    UIManager.showGameScreen(user);
    UIManager.renderFlavorGrid(false, handleFlavorClick, handleFlavorMouseover, handleFlavorMouseout);
    UIManager.updateAllUI(gameState);
    // ✨ 변경점: 게임 시작 시 리스너를 바로 실행하지 않으므로 해당 라인을 삭제합니다.
    // listenToLeaderboard(); 
    checkTutorial();
    generateNewOrder();
    UIManager.renderCustomerOrder(gameState.activeOrder);
}

// ✨ 변경점: 리더보드를 열고 닫는 별도의 핸들러 함수를 정의합니다.
function onOpenLeaderboard() {
    if (!currentUser) return;

    if (currentUser.isAnonymous) {
        UIManager.listenAndRenderLeaderboard(null, true, null);
    } else {
        const q = query(collection(db, "players"), orderBy("monthlySales", "desc"), limit(10));
        UIManager.listenAndRenderLeaderboard(q, false, currentUser.uid);
    }
    UIManager.openPopup(UIManager.dom.leaderboard_popup);
}

function onCloseLeaderboard() {
    UIManager.stopListeningToLeaderboard();
    UIManager.closePopup(UIManager.dom.leaderboard_popup);
}


// 모든 이벤트 리스너 등록
function addEventListeners() {
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
        // ✨ 변경점: 위에서 만든 핸들러 함수를 연결합니다.
        onOpenLeaderboard,
        onCloseLeaderboard,
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

// (이하 모든 코드는 기존과 동일합니다)

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
        gameState.recipe.flavorRatios[name] = 5;
    });
    UIManager.closePopup(UIManager.dom.flavor_popup);
    UIManager.updateSelectedFlavorsDisplay(gameState.recipe.selectedFlavors);
    UIManager.renderIndividualFlavorSliders(gameState.recipe.selectedFlavors, () => UIManager.updateRecipeAndCost(gameState));
    UIManager.updateRecipeAndCost(gameState);
    UIManager.showRecipeCreationSteps(true);
    checkTutorial();
}

// 액상 제조 및 판매
async function createAndSellBatch() {
    if (!gameState.recipe) { UIManager.logMessage('❌ 먼저 향료를 선택하고 레시피를 만들어주세요.', 'error'); return; }
    if (gameState.dailyManufactureCount >= 20) {
        UIManager.logMessage('하루 최대 제조 횟수(20회)에 도달했습니다.', 'error'); return;
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
    
    let { finalScore } = calculateFinalScore(recipeName, qualityScore);
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
    let salesVolume = Math.round((20 * finalScore) / Math.pow(priceRatio, 1.5));
    
    let revenue = salesVolume * setPrice * (1 + gameState.upgrades.marketing.bonus);
    let trendBonusText = '';
    const recipeCategories = new Set(gameState.recipe.selectedFlavors.map(name => FLAVORS.find(f => f.name === name).category));
    if(gameState.marketTrend.category && recipeCategories.has(gameState.marketTrend.category)) {
        revenue *= gameState.marketTrend.bonus;
        trendBonusText = ` <span class="text-green-300 font-bold">(트렌드 보너스! x${gameState.marketTrend.bonus})</span>`;
    }

    if (checkOrderCompletion(gameState.recipe, gameState.activeOrder)) {
        const bonus = revenue * 1.5;
        revenue += bonus;
        UIManager.logMessage(`🎉 특별 주문 성공! 보너스 $${Math.round(bonus)} 획득!`, 'system');
        gameState.activeOrder = null;
        UIManager.renderCustomerOrder(null);
        setTimeout(generateNewOrder, 3000);
    }
    
    const profit = revenue - manufactureCost;
    gameState.cash += revenue;
    gameState.monthlySales += revenue;
    gameState.skillExp += Math.max(10, Math.round(profit / 10));
    
    const { qualityText } = calculateFinalScore(recipeName, finalScore);
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
    
    checkTutorial();
    
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
    const { flavorRatios } = UIManager.getCurrentRecipeValues();
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
    
    return { finalScore: qualityScore * easterEggBonus, qualityText };
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
    } else if (Math.random() < 0.1) { // 발생 확률 20% -> 10%
        const trendCategories = ['과일', '디저트', '멘솔', '음료', '연초', '특별'];
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
function checkTutorial() {
    const tutorial = gameState.tutorial;
    if (!tutorial || tutorial.tasks.every(t => t.completed)) {
        return;
    }

    if (!tutorial.tasks[0].completed && gameState.recipe && gameState.recipe.selectedFlavors.length > 0) {
        completeTutorialTask(0);
    }
    else if (tutorial.tasks[0].completed && !tutorial.tasks[1].completed && gameState.dailyManufactureCount > 0) {
        completeTutorialTask(1);
    }
    else if (tutorial.tasks[1].completed && !tutorial.tasks[2].completed && gameState.monthlySales >= 100) {
        completeTutorialTask(2);
    }
    else if (!tutorial.introSeen) {
        UIManager.showMentorMessage(TUTORIAL.messages[0]);
        tutorial.introSeen = true;
    }
}

// 튜토리얼 과제 완료
async function completeTutorialTask(taskIndex) {
    if (!gameState.tutorial.tasks[taskIndex] || gameState.tutorial.tasks[taskIndex].completed) return;
    
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
