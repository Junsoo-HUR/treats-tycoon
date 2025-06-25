import { FLAVORS, TUTORIAL } from './game-data.js';

const dom = {};
const ids = ['login-container', 'game-container', 'email-input', 'password-input', 'login-btn', 'signup-btn', 'guest-login-btn', 'logout-btn', 'auth-error', 'user-email', 'cash', 'monthly-sales', 'company-level', 'skill-level', 'best-recipe-name', 'log', 'vg-slider', 'nicotine-slider', 'cooling-slider', 'price-slider', 'vg-value', 'nicotine-value', 'cooling-value', 'price-value', 'summary-vg', 'summary-pg', 'summary-flavor', 'summary-nicotine', 'summary-cooling', 'recipe-name-input', 'create-batch-btn', 'market-trend', 'upgrades-container', 'open-flavor-popup-btn', 'selected-flavors-display', 'flavor-popup', 'close-flavor-popup-btn', 'flavor-grid', 'confirm-flavor-selection-btn', 'individual-flavor-sliders', 'ratio-section', 'naming-section', 'pricing-section', 'summary-section', 'manufacture-cost', 'open-leaderboard-popup-btn', 'leaderboard-popup', 'close-leaderboard-popup-btn', 'leaderboard-content', 'open-recipebook-popup-btn', 'recipebook-popup', 'close-recipebook-popup-btn', 'recipebook-content', 'tutorial-section', 'task-list', 'mentor-popup', 'mentor-message', 'close-mentor-popup-btn', 'bug-notice', 'flavor-tooltip'];

export function cacheDOM() {
    ids.forEach(id => {
        if (document.getElementById(id)) {
            dom[id.replace(/-/g, '_')] = document.getElementById(id);
        }
    });
}

export function showLoginScreen() {
    dom.login_container.classList.remove('hidden');
    dom.login_container.classList.add('flex');
    dom.game_container.classList.add('hidden');
}

export function showGameScreen(user) {
    if (!user) return;
    dom.user_email.textContent = user.isAnonymous ? '게스트' : user.email;
    dom.login_container.classList.add('hidden');
    dom.login_container.classList.remove('flex');
    dom.game_container.classList.remove('hidden');
}

export function showAuthError(message) {
    if (dom.auth_error) dom.auth_error.textContent = message;
}

export function clearAuthError() {
    if (dom.auth_error) dom.auth_error.textContent = '';
}

export function getAuthInput() {
    return { email: dom.email_input.value, password: dom.password_input.value };
}

export function handleAuthError(error) {
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

export function updateAllUI(gameState) {
    if (!gameState || !Object.keys(gameState).length) return;
    dom.cash.textContent = `$${Math.round(gameState.cash)}`;
    dom.monthly_sales.textContent = `$${Math.round(gameState.monthlySales)}`;
    dom.best_recipe_name.textContent = gameState.bestRecipe.name;
    const skillLevel = Math.floor(Math.log10(gameState.skillExp / 100 + 1)) + 1;
    gameState.companyLevel = Math.floor(Math.log2((gameState.cash + gameState.monthlySales * 10) / 1000 + 1)) + 1;
    dom.company_level.textContent = gameState.companyLevel;
    dom.skill_level.textContent = `Lv.${skillLevel}`;
    renderUpgrades(gameState);
    updateManufactureButton(gameState);
    renderTutorialTasks(gameState);
}

export function renderUpgrades(gameState) {
    dom.upgrades_container.innerHTML = Object.keys(gameState.upgrades).map(key => {
        const upg = gameState.upgrades[key];
        const canAfford = gameState.cash >= upg.cost;
        const isMax = upg.level >= upg.maxLevel;
        return `
            <div class="bg-gray-900 p-4 rounded-lg">
                <div class="flex justify-between items-center mb-2">
                    <h4 class="font-bold">${upg.name} (Lv.${upg.level})</h4>
                    <p class="text-sm text-gray-400">${upg.name.split(" ")[1]} +${Math.round(upg.bonus * 100)}%</p>
                </div>
                <button data-key="${key}" class="w-full bg-indigo-600 text-white font-bold py-2 px-3 rounded-lg btn" ${isMax || !canAfford ? 'disabled' : ''}>
                    ${isMax ? 'MAX 레벨' : `업그레이드: $${upg.cost}`}
                </button>
            </div>`;
    }).join('');
}

export function renderLeaderboard(players, isGuest, currentUserId, isError = false) {
    if (isGuest) {
        dom.leaderboard_content.innerHTML = '<p class="text-center text-gray-400 p-4">리더보드는<br>이메일로 로그인 후<br>이용 가능합니다.</p>';
        return;
    }
    if (isError) {
        dom.leaderboard_content.innerHTML = '<p class="text-center text-red-400">리더보드를 불러오는 데 실패했습니다.</p>';
        return;
    }
    if (!players || players.length === 0) {
        dom.leaderboard_content.innerHTML = '<p class="text-center text-gray-400">아직 순위가 없습니다.</p>';
        return;
    }
    dom.leaderboard_content.innerHTML = snapshot.docs.map((doc, index) => {
            const data = doc.data();
            return `<div class="flex justify-between items-center p-2 rounded ${data.uid === currentUser?.uid ? 'bg-indigo-500' : ''}"><div class="flex items-center"><span class="font-bold w-6">${index + 1}.</span><span class="truncate">${data.email || '익명'}</span></div><span class="font-bold text-green-400">$${Math.round(data.monthlySales || 0)}</span></div>`;
        }).join('');
}

export function logMessage(message, type = 'info') {
    if (!dom.log) return;
    if (dom.log.children.length > 50) dom.log.removeChild(dom.log.lastChild);
    const div = document.createElement('div');
    const typeClasses = { game: '', error: 'text-red-400 font-bold p-2 text-center', system: 'text-blue-300 italic p-2 text-center', trend: 'text-yellow-300 font-bold p-2 text-center bg-yellow-900/50 rounded-lg' };
    if (type === 'game') div.innerHTML = message;
    else { div.textContent = message; div.className = typeClasses[type] || 'text-gray-400'; }
    dom.log.prepend(div);
}

export function renderFlavorGrid(isTutorial, onFlavorClick) {
    dom.flavor_grid.innerHTML = FLAVORS.map(f => {
        const disabled = isTutorial && !['딸기', '바나나'].includes(f.name);
        return `<div class="flavor-item flex flex-col items-center justify-center p-2 bg-gray-700 rounded-lg ${disabled ? 'opacity-50 cursor-not-allowed' : ''}" data-flavor-name="${f.name}">
            <span class="text-2xl">${f.icon}</span>
            <span class="text-xs mt-1 text-center">${f.name}</span>
        </div>`;
    }).join('');
    dom.flavor_grid.removeEventListener('click', onFlavorClick);
    dom.flavor_grid.addEventListener('click', onFlavorClick);
    dom.flavor_grid.addEventListener('mouseover', showFlavorTooltip);
    dom.flavor_grid.addEventListener('mouseout', hideFlavorTooltip);
}

export function updateFlavorGridSelection(tempSelectedFlavors) {
    const allItems = dom.flavor_grid.querySelectorAll('.flavor-item');
    allItems.forEach(item => {
        item.classList.toggle('selected', tempSelectedFlavors.includes(item.dataset.flavorName));
    });
}

export function updateSelectedFlavorsDisplay(selectedFlavors) {
    if (selectedFlavors.length === 0) {
        dom.selected_flavors_display.innerHTML = '<span class="text-gray-500 italic">버튼을 눌러 향료를 선택하세요...</span>';
        return;
    }
    dom.selected_flavors_display.innerHTML = selectedFlavors.map(name => {
        const flavor = FLAVORS.find(f => f.name === name);
        return `<span class="bg-indigo-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">${flavor.icon} ${flavor.name}</span>`;
    }).join('');
}

export function renderIndividualFlavorSliders(selectedFlavors, onSliderChange) {
    dom.individual_flavor_sliders.innerHTML = flavors.map(name => `
        <div>
            <label for="flavor-slider-${name}" class="flex justify-between text-xs"><span>${name}</span><span id="flavor-value-${name}" class="font-bold text-indigo-300">5%</span></label>
            <input id="flavor-slider-${name}" data-flavor-name="${name}" type="range" min="1" max="20" value="5" class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb flavor-ratio-slider">
        </div>
    `).join('');
    document.querySelectorAll('.flavor-ratio-slider').forEach(slider => {
        slider.removeEventListener('input', onSliderChange);
        slider.addEventListener('input', onSliderChange);
    });
}
