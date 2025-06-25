import { FLAVORS, TUTORIAL } from './game-data.js';

const dom = {};

export function cacheDOM(ids) {
    ids.forEach(id => {
        if (document.getElementById(id)) {
            dom[id.replace(/-/g, '_')] = document.getElementById(id);
        }
    });
}

// --- 화면 전환 함수 ---
export function showLoginScreen() {
    dom.login_container.classList.remove('hidden');
    dom.game_container.classList.add('hidden');
}

export function showGameScreen(user) {
    dom.user_email.textContent = user.isAnonymous ? '게스트' : user.email;
    dom.login_container.classList.add('hidden');
    dom.game_container.classList.remove('hidden');
}

// --- 인증 UI 함수 ---
export function showAuthError(message) {
    if(dom.auth_error) dom.auth_error.textContent = message;
}
export function clearAuthError() {
    if(dom.auth_error) dom.auth_error.textContent = '';
}
export function getAuthInput() {
    return {
        email: dom.email_input.value,
        password: dom.password_input.value
    };
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

// --- 팝업 관리 함수 ---
export function openPopup(popupElement) {
    popupElement.classList.replace('hidden', 'flex');
}

export function closePopup(popupElement) {
    popupElement.classList.replace('flex', 'hidden');
}


// --- 메인 UI 렌더링 함수 ---
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
                    <p class="text-sm text-gray-400">${upg.name.split(" ")[1]} +${Math.round(upg.bonus*100)}%</p>
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
    dom.leaderboard_content.innerHTML = players.map((data, index) => {
        return `<div class="flex justify-between items-center p-2 rounded ${data.uid === currentUserId ? 'bg-indigo-500' : ''}"><div class="flex items-center"><span class="font-bold w-6">${index + 1}.</span><span class="truncate">${data.email || '익명'}</span></div><span class="font-bold text-green-400">$${Math.round(data.monthlySales || 0)}</span></div>`;
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

// --- 제조 관련 UI ---
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

export function renderIndividualFlavorSliders(selectedFlavors) {
    dom.individual_flavor_sliders.innerHTML = selectedFlavors.map(name => `
        <div>
            <label for="flavor-slider-${name}" class="flex justify-between text-xs"><span>${name}</span><span id="flavor-value-${name}" class="font-bold text-indigo-300">5%</span></label>
            <input id="flavor-slider-${name}" data-flavor-name="${name}" type="range" min="1" max="20" value="5" class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb flavor-ratio-slider">
        </div>
    `).join('');
}

export function showRecipeCreationSteps(show) {
    dom.ratio_section.classList.toggle('hidden', !show);
    dom.naming_section.classList.toggle('hidden', !show);
    dom.pricing_section.classList.toggle('hidden', !show);
    dom.summary_section.classList.toggle('hidden', !show);
    dom.create_batch_btn.disabled = !show;
}

export function updateRecipeAndCost(gameState, onSliderChange) {
    if (!gameState.recipe) return;
    const values = getCurrentRecipeValues();
    let totalFlavorPerc = 0;
    document.querySelectorAll('.flavor-ratio-slider').forEach(slider => {
        slider.removeEventListener('input', onSliderChange); // 기존 리스너 제거
        slider.addEventListener('input', onSliderChange); // 새 리스너 등록
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
    updateManufactureButton(gameState);
}

export function updateManufactureButton(gameState) {
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

// --- 튜토리얼 UI ---
export function renderTutorialTasks(gameState) {
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

export function showMentorMessage(message, duration = 5000) {
    dom.mentor_message.textContent = message;
    dom.mentor_popup.classList.remove('hidden', 'animate-bounce');
    void dom.mentor_popup.offsetWidth; // 리플로우 강제
    dom.mentor_popup.classList.add('animate-bounce');

    setTimeout(() => {
        dom.mentor_popup.classList.add('hidden');
    }, duration);
}

export function hideTutorialSection() {
    dom.tutorial_section.classList.add('hidden');
}

// --- 맛 프로파일 툴팁 ---
export function showFlavorTooltip(e) {
    const item = e.target.closest('.flavor-item');
    if (!item) return;
    const flavorName = item.dataset.flavorName;
    const flavor = FLAVORS.find(f => f.name === flavorName);
    if (!flavor || !flavor.description) return;

    dom.flavor_tooltip.innerHTML = `<strong>${flavor.name}</strong><p class="text-xs mt-1">${flavor.description}</p>`;
    dom.flavor_tooltip.classList.remove('hidden');
    
    const rect = item.getBoundingClientRect();
    dom.flavor_tooltip.style.left = `${e.clientX + 15}px`;
    dom.flavor_tooltip.style.top = `${e.clientY + 15}px`;
}

export function hideFlavorTooltip() {
    dom.flavor_tooltip.classList.add('hidden');
}
