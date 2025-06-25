import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { firebaseConfig, FLAVORS, SYNERGY_SCORES, CONFLICT_SCORES, CRAFTING_RECIPES, TUTORIAL, DOM_IDS } from './game-data.js';
import * as UIManager from './ui-manager.js';

let db, auth;
try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (e) {
    console.error("Firebase 초기화 중 오류 발생:", e);
    UIManager.showAuthError(`서버 연결 실패: ${e.code || e.message}`);
}

UIManager.cacheDOM(DOM_IDS);

let gameState = {};
let currentUser = null;
let unsubscribeLeaderboard = null;

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
        tutorial: { tasks: JSON.parse(JSON.stringify(TUTORIAL.tasks)), introSeen: false }
    };
}

if (auth) {
    onAuthStateChanged(auth, async user => {
        if (user) {
            currentUser = user;
            await loadGameData(user.uid);
            initGame(user);
        } else {
            currentUser = null;
            UIManager.showLoginScreen();
            if (unsubscribeLeaderboard) unsubscribeLeaderboard();
        }
    });
}

async function handleAuth(action) {
    if (!auth) { UIManager.showAuthError("서버 연결이 필요합니다."); return; }
    const email = UIManager.getAuthInput().email;
    const password = UIManager.getAuthInput().password;
    UIManager.clearAuthError();
    try {
        if (action === 'login') {
            await signInWithEmailAndPassword(auth, email, password);
        } else {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await saveGameData(userCredential.user.uid, true);
        }
    } catch (error) {
        UIManager.handleAuthError(error);
    }
}

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
                UIManager.logMessage('새로운 달이 시작되었습니다! 월간 매출과 회사 업그레이드가 초기화됩니다. 새로운 시즌을 시작하세요!', 'system');
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

function initGame(user) {
    UIManager.showGameScreen(user);
    UIManager.renderFlavorGrid(FLAVORS, gameState.tutorial && !gameState.tutorial.tasks[0].completed);
    UIManager.renderUpgrades(gameState);
    addEventListeners();
    UIManager.updateAllUI(gameState);
    listenToLeaderboard();
    checkTutorial();
}

function addEventListeners() {
    UIManager.addCommonEventListeners(
        () => { // onOpenFlavorPopup
            UIManager.updateFlavorGridSelection(gameState.recipe?.selectedFlavors || []);
        },
        confirmFlavorSelection, // onConfirmFlavor
        createAndSellBatch,
        buyUpgrade,
        (e) => { if(e.target.dataset.recipeIndex !== undefined) loadRecipe(e.target.dataset.recipeIndex); },
        () => { 
            if (currentUser && !currentUser.isAnonymous) { signOut(auth); }
            else { currentUser = null; UIManager.showLoginScreen(); }
        }
    );
    UIManager.addAuthEventListeners(
        () => handleAuth('login'),
        () => handleAuth('signup'),
        () => {
            currentUser = { uid: 'guest', isAnonymous: true, email: '게스트' };
            loadGameData('guest');
            initGame(currentUser);
        }
    );
}

function confirmFlavorSelection(selected) {
    gameState.recipe = {
        selectedFlavors: [...selected],
        flavorRatios: {}
    };
    selected.forEach(name => {
        gameState.recipe.flavorRatios[name] = 5;
    });
    UIManager.updateSelectedFlavorsDisplay(gameState.recipe.selectedFlavors, FLAVORS);
    UIManager.renderIndividualFlavorSliders(gameState.recipe.selectedFlavors);
    UIManager.updateRecipeAndCost(gameState, FLAVORS);
    UIManager.showRecipeCreationSteps(true);
    checkTutorial(1);
}

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
    
    const { qualityScore, penaltyMessage, throatHitScore } = calculateRecipeQualityScore();
    
    if (penaltyMessage) {
        UIManager.logMessage(`- 제조 실패 -<br>${penaltyMessage}`, 'error');
        UIManager.updateAllUI(gameState);
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
    
    const setPrice = UIManager.getCurrentPrice();
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
    
    saveRecipe(recipeName, manufactureCost);
    checkTutorial(2, profit);

    const logData = { isEasterEgg, profit, recipeName, skillEventText, qualityText, trendBonusText, salesVolume, setPrice, qualityScore, throatHitScore, monthlySales: gameState.monthlySales, priceRatio };
    UIManager.renderLogMessage(logData);

    if (finalScore > gameState.bestRecipe.score) gameState.bestRecipe = { name: recipeName, score: finalScore };
    checkAndSetMarketTrend();
    resetRecipeMaker();
    UIManager.updateAllUI(gameState);
    await saveGameData(currentUser.uid);
}

function calculateRecipeQualityScore() {
    const { vg, nicotine, cooling, totalFlavorPerc } = UIManager.getCurrentRecipeValues();
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
    const coolingScore = 1 - Math.abs(cooling - 3) / 7;
    const throatHitScore = (nicotine / 20) * 0.6 + (cooling / 10) * 0.2 + (Object.keys(gameState.recipe.flavorRatios).filter(name => ['연초','디저트'].includes(FLAVORS.find(f => f.name === name).category)).length / 5) * 0.2;
    const finalScore = (flavorComboScore * 0.35) + (vgScore * 0.2) + (nicScore * 0.25) + (coolingScore * 0.1) + (throatHitScore * 0.1);
    return { qualityScore: Math.max(0.1, finalScore * (1 + gameState.upgrades.lab.bonus)), penaltyMessage: null, throatHitScore };
}

function calculateFinalScore(recipeName, qualityScore) {
    const { vg, nicotine, flavorRatios } = UIManager.getCurrentRecipeValues();
    const flavorNames = new Set(gameState.recipe.selectedFlavors);
    let isEasterEgg = false, easterEggBonus = 1.0, qualityText = '';
    const lowerName = recipeName.toLowerCase();
    const totalFlavorPerc = Object.values(flavorRatios).reduce((a, b) => a + b, 0);
    const isMTL = (100 - vg - totalFlavorPerc) >= 50;
    const goatApple = lowerName.includes('고트애플') && flavorNames.has('사과') && flavorNames.has('딸기');
    const socioPeach = lowerName.includes('소시오피치') && flavorNames.has('복숭아') && flavorNames.has('자두');
    if (goatApple && ((isMTL && nicotine === 10) || (!isMTL && nicotine === 6))) { isEasterEgg = true; easterEggBonus = 1.8; qualityText = "🎉 히든 레시피 발견!"; }
    else if (socioPeach && ((isMTL && nicotine === 10) || (!isMTL && nicotine === 6))) { isEasterEgg = true; easterEggBonus = 1.8; qualityText = "🎉 히든 레시피 발견!"; }
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
        UIManager.logMessage(`✅ ${upg.name}을(를) Lv.${upg.level}(으)로 업그레이드했습니다!`, 'system');
        UIManager.updateAllUI(gameState); saveGameData(currentUser.uid);
    }
}
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
    UIManager.updateMarketTrend(gameState.marketTrend);
}
function saveRecipe(recipeName, manufactureCost) {
    const recipeData = {
        name: recipeName,
        ...UIManager.getCurrentRecipeValues(),
        timestamp: new Date().toISOString()
    };
    gameState.savedRecipes.unshift(recipeData);
    if (gameState.savedRecipes.length > 20) {
        gameState.savedRecipes.pop();
    }
}
function loadRecipe(index) {
    const recipe = gameState.savedRecipes[index];
    if (!recipe) return;
    confirmFlavorSelection(recipe.selectedFlavors);
    setTimeout(() => {
        UIManager.setRecipeValues(recipe);
        UIManager.updateRecipeAndCost(gameState, FLAVORS);
    }, 100);
    UIManager.closeRecipeBook();
    UIManager.logMessage(`'${recipe.name}' 레시피를 불러왔습니다!`, 'system');
}
function resetRecipeMaker() {
    delete gameState.recipe;
    UIManager.updateSelectedFlavorsDisplay([], FLAVORS);
    UIManager.showRecipeCreationSteps(false);
    UIManager.resetSliders();
    UIManager.getRecipeNameInput().value = '';
}
function checkTutorial(taskId = 0, value = 0) {
    if (!gameState.tutorial || gameState.tutorial.step === 'completed') return;
    if (taskId === 1 && !gameState.tutorial.tasks[0].completed) {
        completeTutorialTask(0);
    } else if (taskId === 2 && !gameState.tutorial.tasks[1].completed) {
        completeTutorialTask(1);
        checkTutorial(3, value);
    } else if (taskId === 3 && !gameState.tutorial.tasks[2].completed) {
        if (gameState.monthlySales >= 100) {
            completeTutorialTask(2);
        }
    } else if (!gameState.tutorial.introSeen) {
        UIManager.showMentorMessage(TUTORIAL.messages[0]);
        gameState.tutorial.introSeen = true;
    }
}
function completeTutorialTask(taskIndex) {
    if (gameState.tutorial.tasks[taskIndex].completed) return;
    gameState.tutorial.tasks[taskIndex].completed = true;
    const reward = TUTORIAL.tasks[taskIndex].reward;
    gameState.cash += reward;
    UIManager.showMentorMessage(TUTORIAL.messages[taskIndex + 1]);
    UIManager.updateAllUI(gameState);
    if(gameState.tutorial.tasks.every(t => t.completed)) {
        gameState.tutorial.step = 'completed';
        UIManager.hideTutorialSection();
    }
}
function openFlavorPopup() {
    const isTutorialActive = gameState.tutorial && !gameState.tutorial.tasks[0].completed;
    UIManager.renderFlavorGrid(FLAVORS, isTutorialActive);
    UIManager.updateFlavorGridSelection(gameState.recipe?.selectedFlavors || []);
    UIManager.openFlavorPopup();
}
function openRecipeBook() {
    UIManager.renderRecipeBook(gameState.savedRecipes, FLAVORS);
    UIManager.openRecipeBookPopup();
}
initGame();
