// --- Firebase 설정 ---
export const firebaseConfig = {
  apiKey: "AIzaSyCTPywMmKT_Hv47Seo6AIhN515_PgIlm50",
  authDomain: "treats-ty.firebaseapp.com",
  projectId: "treats-ty",
  storageBucket: "treats-ty.firebasestorage.app",
  messagingSenderId: "237687562163",
  appId: "1:237687562163:web:07fa35e6fd8b28950735c6",
  measurementId: "G-R001G0DS6W"
};

// --- 게임 상수 ---
export const FLAVORS = [
    // --- 과일 계열 ---
    { name: '딸기', category: '과일', icon: '🍓', description: '달콤함과 약간의 산미가 어우러진 과일의 왕.' },
    { name: '바나나', category: '과일', icon: '🍌', description: '부드럽고 크리미하며, 다른 과일이나 디저트와 잘 어울립니다.' },
    { name: '블루베리', category: '과일', icon: '🫐', description: '달콤하면서도 톡 쏘는 상큼함이 있는 베리류의 대표주자.' },
    { name: '망고', category: '과일', icon: '🥭', description: '진한 달콤함과 풍부한 과즙의 열대과일.' },
    { name: '레몬', category: '과일', icon: '🍋', description: '톡 쏘는 강렬한 신맛. 다른 맛을 깔끔하게 잡아줍니다.' },
    { name: '라임', category: '과일', icon: '🍈', description: '레몬보다 더 쌉쌀하고 향긋한 시트러스.' },
    { name: '사과', category: '과일', icon: '🍎', description: '아삭하고 상쾌한, 가장 대중적인 과일 향.' },
    { name: '복숭아', category: '과일', icon: '🍑', description: '부드럽고 달콤한 과즙이 일품인 여름 과일.' },
    { name: '자두', category: '과일', icon: '🟣', description: '새콤달콤한 맛이 매력적인, 진한 색의 과일.' },
    { name: '파인애플', category: '과일', icon: '🍍', description: '새콤달콤함의 결정체. 열대 칵테일의 필수 요소.' },
    { name: '포도', category: '과일', icon: '🍇', description: '진하고 달콤한 맛. 와인과 같은 깊은 풍미를 줍니다.' },
    { name: '자몽', category: '과일', icon: '🍊', description: '쌉싸름하면서도 상쾌한 맛이 특징인 시트러스.' },
    { name: '수박', category: '과일', icon: '🍉', description: '시원하고 청량한 여름의 맛.' },
    { name: '멜론', category: '과일', icon: '🍈', description: '부드럽고 달콤한 과육이 특징.' },
    { name: '리치', category: '과일', icon: '🥥', description: '독특하고 향긋한 단맛을 가진 열대과일.' },
    { name: '체리', category: '과일', icon: '🍒', description: '진하고 달콤하며, 약간의 새콤함을 가집니다.' },
    { name: '키위', category: '과일', icon: '🥝', description: '새콤달콤하며 씨앗의 톡톡 튀는 질감이 느껴지는 듯한 향.' },
    { name: '알로에', category: '과일', icon: '🪴', description: '독특하고 시원하며, 청포도와 비슷한 깔끔한 단맛.' },
    { name: '구아바', category: '과일', icon: '🥑', description: '달콤하고 크리미한, 이국적인 열대과일.' },
    { name: '패션후르츠', category: '과일', icon: '🥭', description: '백가지 향이 난다는, 새콤함이 매우 강한 열대과일.' },
    { name: '시르삭', category: '과일', icon: '🍈', description: '가시여지라고도 불리며, 열대과일 특유의 새콤달콤한 맛이 특징입니다.' },
    { name: '블랙커런트', category: '과일', icon: '🍇', description: '블루베리보다 더 진하고 깊은 맛의 베리류.' },
    { name: '라즈베리', category: '과일', icon: '🍓', description: '새콤한 맛이 강조된 붉은 베리류.' },
    { name: '유자', category: '과일', icon: '🍋', description: '상큼하면서도 쌉쌀한 동양적인 시트러스 향. 고급스러운 신맛을 표현합니다.' },
    { name: '엘더플라워', category: '과일', icon: '🌸', description: '향긋하고 우아한 꽃 향과 리치(Lychee)와 유사한 달콤함을 가집니다.' },
    { name: '선인장', category: '과일', icon: '🌵', description: '알로에와 비슷하지만 조금 더 풋풋하고 청량한, 독특한 선인장 향.' },
    { name: '용과', category: '과일', icon: '🐉', description: '이국적인 느낌을 더해주는, 부드럽고 은은한 단맛의 베이스 향료.' },

    // --- 디저트 계열 ---
    { name: '바닐라', category: '디저트', icon: '🍦', description: '모든 디저트의 기본. 부드럽고 달콤한 향이 특징입니다.' },
    { name: '커스타드', category: '디저트', icon: '🍮', description: '계란과 우유의 부드럽고 풍부한 맛.' },
    { name: '치즈케이크', category: '디저트', icon: '🍰', description: '꾸덕하고 진한 크림치즈의 맛.' },
    { name: '초콜릿', category: '디저트', icon: '🍫', description: '달콤쌉싸름한 카카오의 풍미.' },
    { name: '카라멜', category: '디저트', icon: '🍬', description: '달고나처럼 달콤하고 약간의 쌉쌀함이 있는 맛.' },
    { name: '요거트', category: '디저트', icon: '🥛', description: '새콤하고 부드러운 유제품의 맛.' },
    { name: '애플파이', category: '디저트', icon: '🥧', description: '시나몬과 졸인 사과, 버터리한 파이의 조화.' },
    { name: '도넛', category: '디저트', icon: '🍩', description: '달콤한 설탕 글레이즈가 덮인 빵의 맛.' },
    { name: '쿠키앤크림', category: '디저트', icon: '🍪', description: '바삭한 초코 쿠키와 부드러운 크림의 만남.' },
    { name: '솜사탕', category: '디저트', icon: '☁️', description: '입에서 녹는 듯한 순수한 설탕의 단맛.' },
    { name: '버터스카치', category: '디저트', icon: '🧈', description: '버터와 흑설탕을 졸여 만든, 카라멜보다 깊은 풍미.' },
    { name: '크림', category: '디저트', icon: '🥛', description: '다른 맛을 부드럽게 감싸주는 순수한 크림.' },
    { name: '잼', category: '디저트', icon: '🍓', description: '과일을 설탕에 졸여 만든, 매우 진하고 달콤한 맛.' },
    { name: '티라미수', category: '디저트', icon: '🍰', description: '커피, 치즈, 코코아 파우더가 어우러진 이탈리아 대표 디저트.' },
    { name: '판나코타', category: '디저트', icon: '🍮', description: '부드러운 우유 푸딩. 커스타드보다 더 깔끔하고 가벼운 크리미함.' },
    { name: '마카롱', category: '디저트', icon: '🍪', description: '아몬드의 고소함과 달콤한 필링이 특징인 고급 디저트.' },

    // --- 연초 계열 ---
    { name: '연초', category: '연초', icon: '🚬', description: '가장 기본적인 연초의 맛. 약간의 씁쓸함과 구수함이 특징입니다.' },
    { name: '시가', category: '연초', icon: '💨', description: '연초보다 훨씬 묵직하고 깊은 풍미를 가진 시가의 맛.' },
    { name: 'RY4', category: '연초', icon: '🍂', description: '연초에 카라멜과 바닐라 향을 더한, 디저트 연초의 대명사.' },
    { name: '쿠바 시가', category: '연초', icon: '🇨🇺', description: '쿠바산 시가 특유의 스파이시하고 강렬한 향이 특징입니다.' },
    { name: '파이프 연초', category: '연초', icon: '📜', description: '오랜 시간 숙성되어 부드럽고 향기로운 파이프 담뱃잎.' },
    { name: '크림 연초', category: '연초', icon: '🍮', description: '부드러운 크림과 커스타드 향이 가미된 연초.' },
    { name: '버지니아 연초', category: '연초', icon: '🌿', description: '밝고 부드러우며, 은은한 단맛이 특징인 가장 대중적인 담뱃잎입니다.' },
    { name: '터키쉬 연초', category: '연초', icon: '🕌', description: '향긋하고 약간의 산미가 있는, 개성이 강한 오리엔탈 담뱃잎입니다.' },
    { name: '블랙 캐빈디쉬', category: '연초', icon: '⚫', description: '증기 압축 방식으로 처리하여 매우 부드럽고, 바닐라와 럼 같은 달콤한 향이 특징입니다.' },

    // --- 멘솔/민트 계열 ---
    { name: '멘솔', category: '멘솔', icon: '❄️', description: '가장 강력하고 순수한 시원함. 모든 맛을 얼려버립니다.' },
    { name: '스피어민트', category: '멘솔', icon: '🍃', description: '부드럽고 달콤한 껌과 같은 민트 향.' },
    { name: '페퍼민트', category: '멘솔', icon: '🌿', description: '스피어민트보다 화하고 강렬한, 클래식한 박하 향.' },

    // --- 음료 계열 ---
    { name: '커피', category: '음료', icon: '☕', description: '갓 내린 원두의 쌉쌀하고 고소한 향.' },
    { name: '콜라', category: '음료', icon: '🥤', description: '톡 쏘는 탄산과 달콤한 시럽 맛.' },
    { name: '에너지드링크', category: '음료', icon: '⚡', description: '새콤달콤하며 원기를 북돋아 줄 것 같은 맛.' },
    { name: '레몬에이드', category: '음료', icon: '🍹', description: '레몬의 상큼함과 설탕의 달콤함이 어우러진 시원한 음료.' },
    { name: '밀크티', category: '음료', icon: '🧋', description: '진한 홍차와 부드러운 우유의 조화.' },
    { name: '피나콜라다', category: '음료', icon: '🍍', description: '파인애플과 코코넛이 어우러진 열대 칵테일.' },
    { name: '루트비어', category: '음료', icon: '🍺', description: '물파스 향이 나는 독특한 북미식 탄산음료.' },
    { name: '샴페인', category: '음료', icon: '🍾', description: '청량하고 드라이하며, 약간의 과일 향이 나는 고급스러운 맛.' },
    { name: '말차 라떼', category: '음료', icon: '🍵', description: '쌉싸름한 녹차와 부드러운 우유가 어우러진 맛.' },
    { name: '얼그레이', category: '음료', icon: '🫖', description: '베르가못 향이 특징인 홍차. 라벤더나 레몬 같은 향료와 잘 어울립니다.' },
    { name: '진', category: '음료', icon: '🍸', description: '주니퍼베리의 솔 향이 특징인 드라이한 술.' },
    { name: '버번', category: '음료', icon: '🥃', description: '오크통에서 숙성된 바닐라와 카라멜 향이 특징인 위스키.' },
    { name: '토닉워터', category: '음료', icon: '💧', description: '쌉쌀한 퀴닌 향과 탄산이 특징인 칵테일의 필수 재료.' },
    { name: '탄산수', category: '음료', icon: '💦', description: '상쾌한 청량감을 더해주는, 맛이 없는 탄산수.' },

    // --- 특별 계열 ---
    { name: '꿀', category: '특별', icon: '🍯', description: '달콤하고 향긋하며, 다른 맛을 부드럽게 감싸줍니다.' },
    { name: '시나몬', category: '특별', icon: '🪵', description: '맵고 달콤한, 독특한 향신료. 디저트나 연초에 잘 어울립니다.' },
    { name: '장미', category: '특별', icon: '🌹', description: '향기로운 꽃 향. 아주 소량만 사용하여 고급스러움을 더합니다.' },
    { name: '헤이즐넛', category: '특별', icon: '🌰', description: '고소한 견과류의 왕. 커피나 초콜릿과 최고의 궁합을 자랑합니다.' },
    { name: '아몬드', category: '특별', icon: '🌰', description: '헤이즐넛보다 담백하고 고소한 맛.' },
    { name: '카카오닙스', category: '특별', icon: '⚫', description: '초콜릿보다 덜 달고 씁쓸하며, 견과류처럼 고소한 향이 특징.' },
    { name: '피스타치오', category: '특별', icon: '🟢', description: '특유의 고소하고 크리미한 맛. 아이스크림이나 디저트 계열과 잘 어울립니다.' },
    { name: '카다멈', category: '특별', icon: '✨', description: '화하고 이국적인 향신료. 아주 소량만 사용해도 레시피 전체에 독특한 개성을 부여합니다.' },
    { name: '바질', category: '특별', icon: '🌿', description: '상쾌하고 향긋한 허브. 딸기나 레몬과 섞어 새로운 스타일의 액상을 만들 수 있습니다.' },
    { name: '소금', category: '특별', icon: '🧂', description: '단맛을 증폭시키고, 맛의 균형을 잡아주는 마법의 재료.' },
];

export const CRAFTING_RECIPES = {
    '킥 카카오': { ingredients: ['RY4', '카카오닙스'], bonus: 1.6, type: '연초' },
    '포카리스웨트': { ingredients: ['자몽', '꿀', '소금'], bonus: 1.7, type: '음료' },
    '시나몬 콜라': { ingredients: ['시나몬', '콜라', '라임'], bonus: 1.5, type: '음료' },
    '진토닉': { ingredients: ['진', '라임', '토닉워터'], bonus: 1.6, type: '음료' },
    '헤이즐넛 라떼': { ingredients: ['커피', '헤이즐넛', '크림'], bonus: 1.5, type: '음료' },
    '애플 시나몬 롤': { ingredients: ['사과', '시나몬', '도넛'], bonus: 1.6, type: '디저트' },
    '유자 에이드': { ingredients: ['유자', '꿀', '탄산수'], bonus: 1.5, type: '음료' },
};

export const SYNERGY_SCORES = {
    '딸기-바나나': 1.2, '레몬-라임': 1.2, '망고-파인애플': 1.1, '사과-알로에': 1.15, '자몽-라즈베리': 1.1, '복숭아-자두': 1.2, '블랙커런트-체리': 1.15, '유자-꿀': 1.2,
    '딸기-크림': 1.25, '블루베리-치즈케이크': 1.3, '복숭아-요거트': 1.25, '사과-애플파이': 1.2, '바나나-커스타드': 1.2, '레몬-치즈케이크': 1.1, '망고-크림': 1.15, '자두-요거트': 1.1, '잼-도넛': 1.2,
    '포도-멘솔': 1.1, '수박-멘솔': 1.15, '자몽-멘솔': 1.15, '알로에-선인장': 1.2, '샴페인-엘더플라워': 1.3, '진-라임': 1.2,
    '연초-카라멜': 1.1, 'RY4-바닐라': 1.2, '시가-커피': 1.25, '파이프 연초-헤이즐넛': 1.2, '크림 연초-커스타드': 1.3, '버얼리-초콜릿': 1.2, '라타키아-버번': 1.25,
    '초콜릿-스피어민트': 1.1, '꿀-레몬': 1.1, '시나몬-도넛': 1.2, '카라멜-커피': 1.15, '초콜릿-헤이즐넛': 1.25,
};

export const CONFLICT_SCORES = {
    '레몬-연초': 0.5, '콜라-커피': 0.6, '장미-시가': 0.4, '치즈케이크-멘솔': 0.7,
    '요거트-콜라': 0.5, '시르삭-커피': 0.6, '파인애플-밀크티': 0.7, '라타키아-과일': 0.3, '진-디저트': 0.6
};

export const TUTORIAL = {
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

export const DOM_IDS = [
    'login-container', 'game-container', 'email-input', 'password-input', 'login-btn', 'signup-btn', 
    'guest-login-btn', 'logout-btn', 'auth-error', 'user-email', 'cash', 'monthly-sales', 
    'company-level', 'skill-level', 'best-recipe-name', 'log', 'vg-slider', 'nicotine-slider', 
    'cooling-slider', 'price-slider', 'vg-value', 'nicotine-value', 'cooling-value', 'price-value', 
    'summary-vg', 'summary-pg', 'summary-flavor', 'summary-nicotine', 'summary-cooling', 
    'recipe-name-input', 'create-batch-btn', 'market-trend', 'upgrades-container', 
    'open-flavor-popup-btn', 'selected-flavors-display', 'flavor-popup', 'close-flavor-popup-btn', 
    'flavor-grid', 'confirm-flavor-selection-btn', 'individual-flavor-sliders', 'ratio-section', 
    'naming-section', 'pricing-section', 'summary-section', 'manufacture-cost', 
    'open-leaderboard-popup-btn', 'leaderboard-popup', 'close-leaderboard-popup-btn', 
    'leaderboard-content', 'tutorial-section', 'task-list', 'mentor-popup', 'mentor-message', 
    'close-mentor-popup-btn', 'flavor-tooltip', 'customer-order'
];

// 주문 생성을 위한 기준 '부품' 목록
export const ORDER_CRITERIA = {
    category: [
        { text: "상큼한 과일 맛", criteria: { category: '과일' } },
        { text: "달콤한 디저트 맛", criteria: { category: '디저트' } },
        { text: "시원한 멘솔 계열", criteria: { category: '멘솔' } },
        { text: "청량한 음료수 맛", criteria: { category: '음료' } },
        { text: "묵직한 연초 맛", criteria: { category: '연초' } }
    ],
    nicotine: [
        { text: "니코틴은 약하게 (6mg 이하)", criteria: { nicotine_max: 6 } },
        { text: "니코틴은 강하게 (9mg 이상)", criteria: { nicotine_min: 9 } },
        { text: "니코틴은 정확히 3mg", criteria: { nicotine_exact: 3 } },
        { text: "니코틴은 정확히 9.8mg", criteria: { nicotine_exact: 9.8 } }
    ],
    cooling: [
        { text: "쿨링이 거의 없는 걸로", criteria: { cooling_max: 2 } },
        { text: "적당히 시원하게 (3~5)", criteria: { cooling_min: 3, cooling_max: 5 } },
        { text: "아주 시원하게 (6 이상)", criteria: { cooling_min: 6 } }
    ],
    complexity: [
        { text: "단순한 맛이 좋아요 (향료 2개 이하)", criteria: { flavor_count_max: 2 } },
        { text: "풍부하고 복잡한 맛으로 (향료 4개 이상)", criteria: { flavor_count_min: 4 } }
    ]
};
