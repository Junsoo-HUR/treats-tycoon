import { FLAVORS } from './game-data.js';
// ✨ 1. onSnapshot 함수를 Firestore에서 가져옵니다.
import { onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// dom 객체를 다른 모듈(main.js)에서 사용할 수 있도록 export 합니다.
export const dom = {};

// 실시간 리더보드 리스너를 관리하기 위한 변수
let unsubscribeLeaderboard = null;

export function cacheDOM(ids) {
    ids.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            dom[id.replace(/-/g, '_')] = element;
        }
    });
}

// (이하 다른 함수들은 모두 동일합니다)
// --- 화면 전환 함수 ---
export function showLoginScreen() {
    if (dom.login_container && dom.game_container) {
        dom.login_container.classList.remove('hidden');
        dom.login_container.classList.add('flex');
        dom.game_container.classList.add('hidden');
    }
}

export function showGameScreen(user) {
    if (!user || !dom.user_email || !dom.login_container || !dom.game_container) return;
    dom.user_email.textContent = user.isAnonymous ? '게스트' : user.email;
    dom.login_container.classList.add('hidden');
    dom.login_container.classList.remove('flex');
    dom.game_container.classList.remove('hidden');
}

// --- 인증 UI 함수 ---
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
    if (dom.auth_error) dom.auth_error.textContent = errorMessage;
}

// --- 팝업 관리 함수 ---
export function openPopup(popupElement) {
    if (popupElement) popupElement.classList.replace('hidden', 'flex');
}

export function closePopup(popupElement) {
    if (popupElement) popupElement.classList.replace('flex', 'hidden');
}

// --- 메인 UI 렌더링 함수 ---
export function updateAllUI(gameState) {
    if (!gameState || Object.keys(gameState).length === 0) return;
    dom.cash.textContent = `$${Math.round(gameState.cash)}`;
    dom.monthly_sales.textContent = `$${Math.round(gameState.monthlySales)}`;
    dom.best_recipe_name.textContent = gameState.bestRecipe.name || '-';
    const skillLevel = Math.floor(Math.log10(gameState.skillExp / 100 + 1)) + 1;
    gameState.companyLevel = Math.floor(Math.log2((gameState.cash + gameState.monthlySales * 10) / 1000 + 1)) + 1;
    dom.company_level.textContent = gameState.companyLevel;
    dom.skill_level.textContent = `Lv.${skillLevel}`;
    renderUpgrades(gameState);
    updateManufactureButton(gameState);
    renderTutorialTasks(gameState);
}

export function renderUpgrades(gameState) {
    if (!dom.upgrades_container) return;
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

// --- 리더보드 관련 함수 ---

export function renderLeaderboard(players, isGuest, currentUserId, isError = false) {
    if (!dom.leaderboard_content) return;
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
        const isCurrentUser = data.uid === currentUserId;
        return `<div class="flex justify-between items-center p-2 rounded ${isCurrentUser ? 'bg-indigo-500' : ''}"><div class="flex items-center"><span class="font-bold w-6">${index + 1}.</span><span class="truncate">${data.email || '익명'}</span></div><span class="font-bold text-green-400">$${Math.round(data.monthlySales || 0)}</span></div>`;
    }).join('');
}

export function listenAndRenderLeaderboard(query, isGuest, currentUserId) {
    if (isGuest) {
        renderLeaderboard(null, true, null);
        return;
    }

    if (unsubscribeLeaderboard) {
        unsubscribeLeaderboard();
    }

    // ✨ 2. 올바른 문법인 onSnapshot(query, ...)로 수정합니다.
    unsubscribeLeaderboard = onSnapshot(query, (querySnapshot) => {
        const players = [];
        querySnapshot.forEach((doc) => {
            players.push({ uid: doc.id, ...doc.data() });
        });
        renderLeaderboard(players, false, currentUserId);
    }, (error) => {
        console.error("실시간 리더보드 오류:", error);
        renderLeaderboard(null, false, null, true);
    });
}

export function stopListeningToLeaderboard() {
    if (unsubscribeLeaderboard) {
        unsubscribeLeaderboard();
        unsubscribeLeaderboard = null;
    }
}

// --- 이하 모든 함수는 기존과 동일합니다 ---

export function logMessage(message, type = 'info') {
    if (!dom.log) return;
    if (dom.log.children.length > 50) dom.log.removeChild(dom.log.lastChild);
    const div = document.createElement('div');
    const typeClasses = {
        game: '',
        error: 'text-red-400 font-bold p-2 text-center',
        system: 'text-blue-300 italic p-2 text-center',
        trend: 'text-yellow-300 font-bold p-2 text-center bg-yellow-900/50 rounded-lg'
    };
    if (type === 'game') {
        div.innerHTML = message;
    } else {
        div.textContent = message;
        div.className = typeClasses[type] || 'text-gray-400';
    }
    dom.log.prepend(div);
}

export function renderFlavorGrid(isTutorial, onFlavorClick, onMouseOver, onMouseOut) {
    if (!dom.flavor_grid) return;
    dom.flavor_grid.innerHTML = FLAVORS.map(f => {
        const disabled = isTutorial && !['딸기', '바나나'].includes(f.name);
        return `<div class="flavor-item flex flex-col items-center justify-center p-2 bg-gray-700 rounded-lg ${disabled ? 'opacity-50 cursor-not-allowed' : ''}" data-flavor-name="${f.name}">
            <span class="text-2xl pointer-events-none">${f.icon}</span>
            <span class="text-xs mt-1 text-center pointer-events-none">${f.name}</span>
        </div>`;
    }).join('');
    dom.flavor_grid.addEventListener('click', onFlavorClick);
    dom.flavor_grid.addEventListener('mouseover', onMouseOver);
    dom.flavor_grid.addEventListener('mouseout', onMouseOut);
}

export function updateFlavorGridSelection(tempSelectedFlavors) {
    if (!dom.flavor_grid) return;
    const allItems = dom.flavor_grid.querySelectorAll('.flavor-item');
    allItems.forEach(item => {
        item.classList.toggle('selected', tempSelectedFlavors.includes(item.dataset.flavorName));
    });
}

export function updateSelectedFlavorsDisplay(selectedFlavors) {
    if (!dom.selected_flavors_display) return;
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
    if (!dom.individual_flavor_sliders) return;
    dom.individual_flavor_sliders.innerHTML = selectedFlavors.map(name => `
        <div>
            <label for="flavor-slider-${name}" class="flex justify-between text-xs"><span>${name}</span><span id="flavor-value-${name}" class="font-bold text-indigo-300">5%</span></label>
            <input id="flavor-slider-${name}" data-flavor-name="${name}" type="range" min="1" max="20" value="5" class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb flavor-ratio-slider">
        </div>
    `).join('');
    document.querySelectorAll('.flavor-ratio-slider').forEach(slider => {
        slider.addEventListener('input', onSliderChange);
    });
}

export function showRecipeCreationSteps(show) {
    const sections = [dom.ratio_section, dom.naming_section, dom.pricing_section, dom.summary_section];
    sections.forEach(section => {
        if (section) section.classList.toggle('hidden', !show);
    });
    if (dom.create_batch_btn) dom.create_batch_btn.disabled = !show;
}

export function updateRecipeAndCost(gameState) {
    if (!gameState.recipe) return;
    const values = getCurrentRecipeValues();
    let totalFlavorPerc = 0;

    document.querySelectorAll('.flavor-ratio-slider').forEach(slider => {
        const perc = parseInt(slider.value);
        totalFlavorPerc += perc;
        values.flavorRatios[slider.dataset.flavorName] = perc;
        const valueDisplay = document.getElementById(`flavor-value-${slider.dataset.flavorName}`);
        if (valueDisplay) valueDisplay.textContent = `${perc}%`;
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
        const costText = dom.manufacture_cost ? dom.manufacture_cost.textContent : '$0';
        dom.create_batch_btn.innerHTML = `제조 및 판매 (${remaining}회 남음) (비용: <span id="manufacture-cost">${costText}</span>)`;
    }
}

export function getCurrentRecipeValues() {
    return {
        vg: parseInt(dom.vg_slider.value),
        nicotine: parseFloat(dom.nicotine_slider.value),
        cooling: parseInt(dom.cooling_slider.value),
        price: parseInt(dom.price_slider.value),
        flavorRatios: {}
    };
}

export function getCurrentCost() {
    return parseFloat(dom.manufacture_cost.textContent.replace('$', ''));
}
export function getRecipeName() {
    return dom.recipe_name_input.value;
}
export function getRecipeNameInput() {
    return dom.recipe_name_input;
}
export function resetSliders() {
    dom.vg_slider.value = 50;
    dom.nicotine_slider.value = 3;
    dom.cooling_slider.value = 0;
    dom.price_slider.value = 20;
}

export function renderTutorialTasks(gameState) {
    if (!gameState.tutorial || !dom.tutorial_section) return;
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

export function showMentorMessage(message) {
    if (!dom.mentor_message || !dom.mentor_popup) return;
    dom.mentor_message.textContent = message;
    dom.mentor_popup.classList.remove('hidden', 'animate-bounce');
    void dom.mentor_popup.offsetWidth;
    dom.mentor_popup.classList.add('animate-bounce');
}

export function hideTutorialSection() {
    if (dom.tutorial_section) dom.tutorial_section.classList.add('hidden');
}

export function showFlavorTooltip(e, flavors) {
    const item = e.target.closest('.flavor-item');
    if (!item || !dom.flavor_tooltip) return;
    const flavorName = item.dataset.flavorName;
    const flavor = flavors.find(f => f.name === flavorName);
    if (!flavor || !flavor.description) return;

    dom.flavor_tooltip.innerHTML = `<strong>${flavor.name}</strong><p class="text-xs mt-1">${flavor.description}</p>`;
    dom.flavor_tooltip.classList.remove('hidden');
    
    const tooltipRect = dom.flavor_tooltip.getBoundingClientRect();
    let left = e.clientX + 15;
    let top = e.clientY + 15;
    if (left + tooltipRect.width > window.innerWidth) {
        left = e.clientX - tooltipRect.width - 15;
    }
    if (top + tooltipRect.height > window.innerHeight) {
        top = e.clientY - tooltipRect.height - 15;
    }
    dom.flavor_tooltip.style.left = `${left}px`;
    dom.flavor_tooltip.style.top = `${top}px`;
}
export function hideFlavorTooltip() {
    if (dom.flavor_tooltip) dom.flavor_tooltip.classList.add('hidden');
}

export function renderCustomerOrder(order) {
    if (dom.customer_order) {
        if (order) {
            dom.customer_order.textContent = order.text;
        } else {
            dom.customer_order.textContent = '완료! 다음 주문을 기다립니다.';
        }
    }
}

export function addAuthEventListeners(onLogin, onSignup, onGuestLogin) {
    if (dom.login_btn) dom.login_btn.addEventListener('click', onLogin);
    if (dom.signup_btn) dom.signup_btn.addEventListener('click', onSignup);
    if (dom.guest_login_btn) dom.guest_login_btn.addEventListener('click', onGuestLogin);
}

export function addCommonEventListeners(
    onOpenFlavorPopup,
    onConfirmFlavorSelection,
    onCreateBatch,
    onBuyUpgrade,
    onOpenLeaderboard,
    onCloseLeaderboard,
    onMainSliderChange,
    onLogout
) {
    if (dom.open_flavor_popup_btn) dom.open_flavor_popup_btn.addEventListener('click', onOpenFlavorPopup);
    if (dom.close_flavor_popup_btn) dom.close_flavor_popup_btn.addEventListener('click', () => closePopup(dom.flavor_popup));
    if (dom.confirm_flavor_selection_btn) dom.confirm_flavor_selection_btn.addEventListener('click', onConfirmFlavorSelection);
    
    if (dom.open_leaderboard_popup_btn) dom.open_leaderboard_popup_btn.addEventListener('click', onOpenLeaderboard);
    if (dom.close_leaderboard_popup_btn) dom.close_leaderboard_popup_btn.addEventListener('click', onCloseLeaderboard);
    if (dom.close_mentor_popup_btn) dom.close_mentor_popup_btn.addEventListener('click', () => dom.mentor_popup.classList.add('hidden'));

    if (dom.create_batch_btn) dom.create_batch_btn.addEventListener('click', onCreateBatch);
    if (dom.logout_btn) dom.logout_btn.addEventListener('click', onLogout);
    
    const mainSliders = [dom.vg_slider, dom.nicotine_slider, dom.cooling_slider, dom.price_slider];
    mainSliders.forEach(slider => {
        if (slider) slider.addEventListener('input', onMainSliderChange);
    });

    if (dom.upgrades_container) {
        dom.upgrades_container.addEventListener('click', (e) => {
            const button = e.target.closest('button[data-key]');
            if (button) {
                onBuyUpgrade(button.dataset.key);
            }
        });
    }
}
