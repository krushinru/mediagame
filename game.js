// Класс для управления игрой
class Game {
    constructor() {
        console.log('[Game] Initializing game');
        
        // Элементы интерфейса
        this.elements = {
            startScreen: document.getElementById('start-screen'),
            gameScreen: document.getElementById('game-screen'),
            currentCard: document.getElementById('current-card'),
            situationText: document.getElementById('situation-text'),
            choicesContainer: document.getElementById('choices-container'),
            decisionText: document.getElementById('decision-text'),
            budget: document.getElementById('budget'),
            trust: document.getElementById('trust'),
            readers: document.getElementById('readers'),
            day: document.getElementById('turn-counter'),
            staffMorale: document.getElementById('staff-morale'),
            advertiserRelations: document.getElementById('advertiser-relations')
        };
        
        // Состояние игры
        this.state = {
            budget: 100000,
            trust: 50,
            readers: 10000,
            staffMorale: 50,
            advertiserRelations: 50,
            currentSituation: null,
            turnCount: 0
        };
        
        // Массив для хранения использованных ситуаций
        this.usedSituations = [];
        
        // Флаг для отслеживания состояния анимации
        this.isAnimating = false;
        
        // Привязываем обработчики событий
        this.bindEventHandlers();
        
        console.log('[Game] Game initialized');
    }

    bindEventHandlers() {
        console.log('[bindEventHandlers] Binding event handlers');
        
        // Привязываем методы к контексту, чтобы this ссылался на экземпляр класса
        this.makeChoice = this.makeChoice.bind(this);
        this.showSituation = this.showSituation.bind(this);
        this.showRandomSituation = this.showRandomSituation.bind(this);
        this.updateGameState = this.updateGameState.bind(this);
        this.checkVictory = this.checkVictory.bind(this);
        
        // Другие обработчики событий могут быть добавлены здесь
    }

    validateElements() {
        return Object.values(this.elements).every(element => element !== null);
    }

    showStartScreen() {
        console.log('[showStartScreen] Showing start screen');
        
        // Скрываем элементы свайпа, если есть
        this.hideDecisionText();
        this.removeSwipeHandlers();
        
        // Полностью очищаем карточку (без свайп-индикаторов для стартового экрана)
        this.elements.currentCard.innerHTML = `
            <div class="card-content">
                <p id="situation-text"></p>
                <div id="choices-container">
                    <button id="start-game" class="choice-button">Возглавить издание</button>
                </div>
            </div>
        `;
        
        // Обновляем ссылки на элементы после очистки
        this.elements.situationText = document.getElementById('situation-text');
        this.elements.choicesContainer = document.getElementById('choices-container');
        
        this.elements.situationText.textContent = "Готовы стать владельцем собственного медиа? Каждое ваше решение будет влиять на будущее издания. Докажите, что журналистиа может быть успешной и прибыльной!";
        this.elements.situationText.className = '';
        
        // Добавляем обработчик для кнопки старта
        const startButton = document.getElementById('start-game');
        if (startButton) {
            // Удаляем старые обработчики, если они есть
            const newStartButton = startButton.cloneNode(true);
            startButton.parentNode.replaceChild(newStartButton, startButton);
            
            newStartButton.addEventListener('click', () => this.startGame());
            console.log('[showStartScreen] Start button handler added');
        } else {
            console.error('[showStartScreen] Start button not found!');
        }
    }

    setupSwipeHandling() {
        console.log('[setupSwipeHandling] Setting up swipe handlers');
        // Удаляем старые обработчики, если они есть
        this.removeSwipeHandlers();

        this.handleDragStart = (e) => {
            if (this.isAnimating) {
                console.log('[handleDragStart] Animation in progress, ignoring drag');
                return;
            }
            const touch = e.type === 'touchstart' ? e.touches[0] : e;
            this.startX = touch.clientX;
            this.startY = touch.clientY;
            this.isDragging = true;
            
            console.log('[handleDragStart] Drag started');
            this.elements.currentCard.classList.add('dragging');
            this.elements.currentCard.style.transition = 'none';
            e.preventDefault();
        };

        this.handleDragMove = (e) => {
            if (!this.isDragging || this.isAnimating) return;
            e.preventDefault();

            const touch = e.type === 'touchmove' ? e.touches[0] : e;
            this.currentX = touch.clientX - this.startX;
            this.updateCardTransform(this.currentX);
        };

        this.handleDragEnd = (e) => {
            if (!this.isDragging || this.isAnimating) return;
            this.isDragging = false;

            this.elements.currentCard.classList.remove('dragging');

            const finalX = this.currentX;
            const { translateX, rotation } = this.updateCardTransform(finalX);

            if (Math.abs(finalX) > 100) {
                this.makeDecision(finalX);
            } else {
                this.isAnimating = true;
                this.elements.currentCard.style.setProperty('--drag-x', `${translateX}px`);
                this.elements.currentCard.style.setProperty('--drag-rotate', `${rotation}deg`);
                this.elements.currentCard.classList.add('returning');
                
                const handleAnimationEnd = () => {
                    this.elements.currentCard.removeEventListener('animationend', handleAnimationEnd);
                    
                    // Принудительно удаляем все элементы decision-text
                    const decisionTexts = document.querySelectorAll('.decision-text');
                    decisionTexts.forEach(el => el.remove());
                    
                    this.elements.currentCard.style.transform = '';
                    this.elements.currentCard.style.opacity = '1';
                    this.elements.currentCard.classList.remove('returning');
                    this.elements.currentCard.style.removeProperty('--drag-x');
                    this.elements.currentCard.style.removeProperty('--drag-rotate');
                    this.isAnimating = false;
                };
                
                this.elements.currentCard.addEventListener('animationend', handleAnimationEnd, { once: true });
                
                // Немедленно делаем текст невидимым (без удаления)
                const decisionText = document.querySelector('.decision-text');
                if (decisionText) {
                    decisionText.classList.remove('visible');
                }
            }

            this.currentX = 0;
        };

        // Сохраняем ссылки на обработчики для последующего удаления
        this.swipeHandlers = {
            mousedown: this.handleDragStart,
            mousemove: this.handleDragMove,
            mouseup: this.handleDragEnd,
            touchstart: this.handleDragStart,
            touchmove: this.handleDragMove,
            touchend: this.handleDragEnd
        };

        // Мышь
        this.elements.currentCard.addEventListener('mousedown', this.handleDragStart);
        document.addEventListener('mousemove', this.handleDragMove);
        document.addEventListener('mouseup', this.handleDragEnd);

        // Тач
        this.elements.currentCard.addEventListener('touchstart', this.handleDragStart, { passive: false });
        document.addEventListener('touchmove', this.handleDragMove, { passive: false });
        document.addEventListener('touchend', this.handleDragEnd);

        // Отменяем свайп при потере фокуса
        window.addEventListener('blur', () => {
            if (this.isDragging) {
                this.handleDragEnd();
            }
        });
    }

    removeSwipeHandlers() {
        if (this.swipeHandlers) {
            // Удаляем обработчики мыши
            this.elements.currentCard.removeEventListener('mousedown', this.swipeHandlers.mousedown);
            document.removeEventListener('mousemove', this.swipeHandlers.mousemove);
            document.removeEventListener('mouseup', this.swipeHandlers.mouseup);

            // Удаляем обработчики тача
            this.elements.currentCard.removeEventListener('touchstart', this.swipeHandlers.touchstart);
            document.removeEventListener('touchmove', this.swipeHandlers.touchmove);
            document.removeEventListener('touchend', this.swipeHandlers.touchend);
        }
    }

    updateCardTransform(x) {
        if (this.isAnimating) {
            console.log('[updateCardTransform] Animation in progress, skipping transform');
            return;
        }
        
        console.log(`[updateCardTransform] Transforming card: x=${x}`);
        const resistance = Math.min(1, Math.max(0.2, 1 - Math.abs(x) / 500));
        const translateX = x * resistance;
        const rotation = translateX * 0.1;

        requestAnimationFrame(() => {
            this.elements.currentCard.style.transform = `translateX(${translateX}px) rotate(${rotation}deg)`;
            this.elements.currentCard.style.opacity = Math.max(0.5, 1 - Math.abs(x) / 1000);
        });

        if (Math.abs(x) > 50) {
            console.log('[updateCardTransform] Showing decision text');
            const currentSituation = gameSituations[this.state.currentSituation];
            if (currentSituation) {
                const choice = x > 0 ? currentSituation.choices[0] : currentSituation.choices[1];
                this.showDecisionText(choice.text, x > 0);
            }
        } else {
            console.log('[updateCardTransform] Hiding decision text');
            this.hideDecisionText();
        }

        return { translateX, rotation };
    }

    makeDecision(x) {
        if (this.isAnimating) return;
        this.isAnimating = true;
        console.log('[makeDecision] Processing swipe decision');

        const currentSituation = gameSituations[this.state.currentSituation];
        if (!currentSituation) {
            console.error('[makeDecision] No current situation found');
            this.isAnimating = false;
            return;
        }

        const isRight = x > 0;
        const choice = isRight ? currentSituation.choices[0] : currentSituation.choices[1];
        console.log(`[makeDecision] Selected choice: ${isRight ? 'right' : 'left'}, ${choice.text}`);
        
        // Добавляем классы для анимации
        this.elements.currentCard.classList.add('swiped', isRight ? 'swiped-right' : 'swiped-left');
        
        // Более надежный обработчик окончания анимации
        const handleAnimationEnd = () => {
            console.log('[makeDecision] Animation ended, making choice');
            // Сразу удаляем обработчик
            this.elements.currentCard.removeEventListener('animationend', handleAnimationEnd);
            
            // Полная очистка состояния карточки
            this.elements.currentCard.classList.remove('swiped', 'swiped-right', 'swiped-left');
            this.elements.currentCard.style.transform = '';
            this.elements.currentCard.style.opacity = '1';
            this.elements.currentCard.style.transition = '';
            this.elements.currentCard.style.removeProperty('--drag-x');
            this.elements.currentCard.style.removeProperty('--drag-rotate');
            
            // Принудительно удаляем все элементы decision-text из DOM
            const decisionTexts = document.querySelectorAll('.decision-text');
            decisionTexts.forEach(el => el.remove());
            
            // Задержка чтобы убедиться, что классы удалены и анимация завершена
            requestAnimationFrame(() => {
                console.log('[makeDecision] Calling makeChoice with full reset');
                this.makeChoice(choice);
                
                // Дополнительная гарантия для восстановления видимости карточки
                setTimeout(() => {
                    this.elements.currentCard.style.opacity = '1';
                    this.elements.currentCard.style.transform = '';
                    this.isAnimating = false;
                }, 50);
            });
        };
        
        this.elements.currentCard.addEventListener('animationend', handleAnimationEnd, { once: true });
        
        // Дополнительная страховка: если анимация не завершится за 800мс, все равно вызываем выбор
        setTimeout(() => {
            if (this.isAnimating) {
                console.log('[makeDecision] Animation timeout, forcing choice');
                this.elements.currentCard.removeEventListener('animationend', handleAnimationEnd);
                this.elements.currentCard.classList.remove('swiped', 'swiped-right', 'swiped-left');
                this.elements.currentCard.style.transform = '';
                this.elements.currentCard.style.opacity = '1';
                this.elements.currentCard.style.transition = '';
                this.elements.currentCard.style.removeProperty('--drag-x');
                this.elements.currentCard.style.removeProperty('--drag-rotate');
                
                // Принудительно удаляем все элементы decision-text из DOM
                const decisionTexts = document.querySelectorAll('.decision-text');
                decisionTexts.forEach(el => el.remove());
                
                console.log('[makeDecision] Calling makeChoice with full reset after timeout');
                this.makeChoice(choice);
                
                // Дополнительная гарантия для восстановления видимости карточки
                setTimeout(() => {
                    this.elements.currentCard.style.opacity = '1';
                    this.elements.currentCard.style.transform = '';
                    this.isAnimating = false;
                }, 50);
            }
        }, 800);
    }

    showDecisionText(text, isRight) {
        // Удаляем предыдущий элемент текста решения, если он существует
        this.hideDecisionText();
        
        // Создаем новый элемент
        const decisionText = document.createElement('div');
        decisionText.className = `decision-text ${isRight ? 'right' : 'left'}`;
        decisionText.textContent = text;
        
        // Добавляем элемент в DOM
        this.elements.currentCard.appendChild(decisionText);
        
        // Устанавливаем класс visible в следующем кадре анимации для плавного появления
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                decisionText.classList.add('visible');
            });
        });
    }

    hideDecisionText() {
        const decisionText = this.elements.currentCard.querySelector('.decision-text');
        if (decisionText) {
            // Удаляем класс visible для плавного исчезновения
            decisionText.classList.remove('visible');
            
            // Удаляем элемент после завершения анимации
            setTimeout(() => {
                if (decisionText.parentNode) {
                    decisionText.remove();
                }
            }, 300);
        }
    }

    startGame() {
        console.log('[startGame] Starting new game');
        
        // Очищаем список использованных ситуаций
        this.usedSituations = [];
        console.log('[startGame] Used situations list cleared');
        
        // Инициализируем начальное состояние игры с использованием настроек из gameSituations
        const initialStats = gameSituations.settings?.initialStats || {
            budget: 100000,
            trust: 50,
            readers: 10000,
            advertiserRelations: 50,
            staffMorale: 50
        };
        
        this.state = {
            ...initialStats,
            currentSituation: 'start',
            turnCount: 0
        };

        // Очищаем предыдущее состояние
        this.hideDecisionText();
        this.removeSwipeHandlers();
        
        // Полностью очищаем карточку
        this.elements.currentCard.innerHTML = `
            <div class="card-content">
                <p id="situation-text"></p>
                <div id="choices-container"></div>
            </div>
            <div class="swipe-indicators">
                <div class="swipe-indicator swipe-left-indicator">←</div>
                <div class="swipe-indicator swipe-right-indicator">→</div>
            </div>
        `;
        
        // Обновляем ссылки на элементы после очистки
        this.elements.situationText = document.getElementById('situation-text');
        this.elements.choicesContainer = document.getElementById('choices-container');
        
        // Показываем первую ситуацию
        this.showSituation('start');
        
        // Добавляем обработчики свайпов
        this.setupSwipeHandling();
        
        // Обновляем UI
        this.updateGameState();
    }

    showSituation(situationId, alreadyUsed = false) {
        console.log(`[showSituation] Showing situation: ${typeof situationId === 'object' ? situationId.id : situationId}`);
        
        // Принудительно удаляем все элементы decision-text из DOM
        const decisionTexts = document.querySelectorAll('.decision-text');
        decisionTexts.forEach(el => el.remove());
        
        // Используем правильную функцию для получения ситуации по ID
        const situation = typeof situationId === 'object' ? situationId : getSituationById(situationId);
        
        if (!situation) {
            console.error(`[showSituation] Situation not found: ${situationId}`);
            
            // Проверяем, есть ли еще доступные ситуации, и если есть - показываем случайную
            const randomSituation = getRandomSituation(this.state, this.usedSituations);
            if (randomSituation) {
                console.log(`[showSituation] Showing random situation instead: ${randomSituation.id}`);
                // Рекурсивно вызываем showSituation с найденной случайной ситуацией
                this.showSituation(randomSituation, false);
                return;
            } else {
                // Только если не удалось найти вообще никакой ситуации - показываем победу
                console.warn('[showSituation] No situations available, showing victory screen');
                this.showVictory();
                return;
            }
        }

        // Сначала очищаем предыдущее состояние
        console.log('[showSituation] Clearing previous state');
        this.elements.choicesContainer.innerHTML = '';
        this.hideDecisionText();
        this.removeSwipeHandlers();
        this.isAnimating = false;

        // Устанавливаем новую ситуацию
        console.log('[showSituation] Setting up new situation');
        this.state.currentSituation = situation.id;
        this.elements.situationText.textContent = situation.text;
        this.elements.situationText.className = '';
        
        // Сбрасываем стили карточки в первоначальное положение (важно для свайпа)
        this.elements.currentCard.style.transform = '';
        this.elements.currentCard.style.opacity = '1';
        this.elements.currentCard.style.transition = '';
        this.elements.currentCard.style.removeProperty('--drag-x');
        this.elements.currentCard.style.removeProperty('--drag-rotate');
        this.elements.currentCard.classList.remove(
            'swipe-left', 'swipe-right', 'dragging', 'returning', 
            'swiped', 'swiped-left', 'swiped-right'
        );
        
        // Добавляем класс new-card для анимации появления
        this.elements.currentCard.classList.add('new-card');
        
        // Через небольшую задержку убираем класс анимации
        setTimeout(() => {
            this.elements.currentCard.classList.remove('new-card');
        }, 500);
        
        // Очистим карточку от старых swipe-indicators
        const oldSwipeIndicators = this.elements.currentCard.querySelectorAll('.swipe-indicators');
        oldSwipeIndicators.forEach(el => el.remove());

        // Создаем контейнер для стрелок и добавляем его прямо в карточку
        console.log('[showSituation] Creating swipe indicators');
        const swipeIndicators = document.createElement('div');
        swipeIndicators.className = 'swipe-indicators';
        swipeIndicators.innerHTML = `
            <div class="swipe-indicator swipe-left-indicator">←</div>
            <div class="swipe-indicator swipe-right-indicator">→</div>
        `;
        this.elements.currentCard.appendChild(swipeIndicators);
        console.log('[showSituation] Swipe indicators added:', swipeIndicators);

        // Создаем кнопки выбора
        console.log('[showSituation] Creating choice buttons');
        situation.choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.className = 'choice-button';
            const arrow = index === 0 ? '→' : '←';
            button.innerHTML = `${arrow} ${choice.text}`;
            
            // Улучшенный обработчик клика
            button.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();

                this.isAnimating = false;
                button.disabled = false;
                console.log(`[button click] Button clicked: ${index === 0 ? 'right' : 'left'}`);
                if (this.isAnimating) {
                    console.log('[button click] Animation in progress, ignoring click');
                    return;
                }
                
                // Блокируем все взаимодействия
                this.isAnimating = true;
                button.disabled = true;
                console.log('[button click] Button disabled, animation started');
                
                // Показываем текст выбора
                this.showDecisionText(choice.text, index === 0);
                
                // Запускаем анимацию
                requestAnimationFrame(() => {
                    this.elements.currentCard.classList.add('swiped', index === 0 ? 'swiped-right' : 'swiped-left');
                    
                    // Обработчик окончания анимации
                    const handleAnimationEnd = () => {
                        console.log('[button click] Animation ended, making choice');
                        this.elements.currentCard.removeEventListener('animationend', handleAnimationEnd);
                        this.elements.currentCard.classList.remove('swiped', 'swiped-right', 'swiped-left');
                        this.makeChoice(choice);
                        button.disabled = false;
                        this.isAnimating = false;
                    };
                    
                    this.elements.currentCard.addEventListener('animationend', handleAnimationEnd, { once: true });
                });
            };
            
            this.elements.choicesContainer.appendChild(button);
            console.log(`[showSituation] Button added: ${index}`);
        });

        // Добавляем обработчики свайпов
        console.log('[showSituation] Setting up swipe handlers');
        this.setupSwipeHandling();
    }

    resetCardState() {
        console.log('[resetCardState] Starting reset');
        requestAnimationFrame(() => {
            // Не удаляем индикаторы свайпа
            
            this.elements.currentCard.style.transform = '';
            this.elements.currentCard.style.opacity = '1';
            this.elements.currentCard.style.transition = '';
            this.elements.currentCard.style.removeProperty('--drag-x');
            this.elements.currentCard.style.removeProperty('--drag-rotate');
            
            this.elements.currentCard.classList.remove(
                'swipe-left', 'swipe-right', 'dragging', 'returning', 
                'swiped', 'swiped-left', 'swiped-right', 'new-card'
            );
            
            this.elements.currentCard.classList.add('active');
            console.log('[resetCardState] Card state reset completed');
        });
    }

    showVictory() {
        console.log('[showVictory] Showing victory screen');
        
        // Очищаем предыдущее состояние и удаляем обработчики свайпов
        this.elements.choicesContainer.innerHTML = '';
        this.hideDecisionText();
        this.removeSwipeHandlers();
        
        // Полностью очищаем карточку и удаляем обрамление
        this.elements.currentCard.innerHTML = '';
        
        // Сбрасываем стили и меняем класс карточки
        this.elements.currentCard.className = 'victory-screen';
        this.elements.currentCard.style = '';
        
        // Создаем содержимое экрана победы
        const victoryContent = document.createElement('div');
        victoryContent.className = 'victory-content';
        
        // Создаем текст сообщения
        const messageText = document.createElement('p');
        messageText.className = 'victory-text';
        
        // Формируем сообщение о победе
        let message = `Поздравляем! Ваше медиа успешно пережило первый месяц!\n\n`;
        
        // Добавляем оценку результатов
        if (this.state.trust > 75) {
            message += `Вы заслужили высокое доверие аудитории (${this.state.trust}%).\n`;
        } else if (this.state.trust > 40) {
            message += `Вам удалось сохранить приемлемый уровень доверия (${this.state.trust}%).\n`;
        } else {
            message += `Доверие к вашему изданию невысоко (${this.state.trust}%), но у вас всё впереди.\n`;
        }
        
        if (this.state.readers > 50000) {
            message += `Ваша аудитория выросла до внушительных размеров (${this.state.readers.toLocaleString()} читателей).\n`;
        } else if (this.state.readers > 20000) {
            message += `У вас сформировалась солидная аудитория (${this.state.readers.toLocaleString()} читателей).\n`;
        } else {
            message += `Ваша аудитория пока невелика (${this.state.readers.toLocaleString()} читателей), но лояльна.\n`;
        }
        
        if (this.state.budget > 200000) {
            message += `Финансовое положение превосходное, счёт пухнет от денег (${this.state.budget.toLocaleString()} ₽).\n`;
        } else if (this.state.budget > 100000) {
            message += `Финансово издание чувствует себя уверенно (${this.state.budget.toLocaleString()} ₽).\n`;
        } else {
            message += `Бюджет не блещет (${this.state.budget.toLocaleString()} ₽), но вы выжили!\n`;
        }
        
        if (this.state.staffMorale > 75) {
            message += `Моральный дух коллектива высок, сотрудники готовы горы свернуть.\n`;
        } else if (this.state.staffMorale > 40) {
            message += `Сотрудники в целом довольны работой, хотя порой и ворчат.\n`;
        } else {
            message += `Коллектив держится из последних сил, но не сдаётся.\n`;
        }
        
        if (this.state.advertiserRelations > 75) {
            message += `Рекламодатели выстраиваются в очередь к вашему изданию.\n`;
        } else if (this.state.advertiserRelations > 40) {
            message += `Отношения с рекламодателями стабильны, бизнес идёт.\n`;
        } else {
            message += `Рекламодатели не спешат к вам, но кое-кто всё же сотрудничает.\n`;
        }
        
        messageText.textContent = message;
        
        // Добавляем кнопку "Играть снова"
        const restartButton = document.createElement('button');
        restartButton.className = 'choice-button victory-button';
        restartButton.textContent = 'Играть снова';
        restartButton.onclick = () => this.resetGame();
        
        // Добавляем элементы на экран победы
        victoryContent.appendChild(messageText);
        victoryContent.appendChild(restartButton);
        this.elements.currentCard.appendChild(victoryContent);
    }

    resetGame() {
        console.log('[resetGame] Resetting game state');
        
        // Очищаем список использованных ситуаций
        this.usedSituations = [];
        console.log('[resetGame] Used situations list cleared');
        
        // Инициализируем начальное состояние игры с использованием настроек из gameSituations
        const initialStats = gameSituations.settings?.initialStats || {
            budget: 100000,
            trust: 50,
            readers: 10000,
            advertiserRelations: 50,
            staffMorale: 50
        };
        
        this.state = {
            ...initialStats,
            currentSituation: 'start',
            turnCount: 0
        };
        
        console.log('[resetGame] Game state reset to:', this.state);
        
        // Полностью очищаем карточку
        this.elements.currentCard.innerHTML = `
            <div class="card-content">
                <p id="situation-text"></p>
            </div>
        `;
        
        // Обновляем ссылки на элементы после очистки
        this.elements.situationText = document.getElementById('situation-text');
        
        // Сбрасываем стили и классы
        this.elements.currentCard.style = '';
        this.elements.currentCard.className = 'card';
        
        // Очищаем анимационные состояния
        this.isAnimating = false;
        this.isDragging = false;
        this.currentX = 0;
        this.startX = 0;
        
        // Показываем стартовый экран
        this.showStartScreen();
        this.updateGameState();
        
        console.log('[resetGame] Game reset completed');
    }

    makeChoice(choice) {
        try {
            console.log(`[makeChoice] Choice made: ${choice.text}`);
            console.log(`[makeChoice] Current situation: ${this.state.currentSituation}`);
            
            // Получаем текущую ситуацию
            const currentSituation = getSituationById(this.state.currentSituation);
            
            if (!currentSituation) {
                console.error(`[makeChoice] Cannot find current situation: ${this.state.currentSituation}`);
                return;
            }
            
            // Сохраняем старый счетчик для отладки
            const oldTurnCount = this.state.turnCount;
            
            // Увеличиваем счетчик ходов
            this.state.turnCount++;
            console.log(`[makeChoice] Turn count increased from ${oldTurnCount} to ${this.state.turnCount}`);
            
            // Применяем эффекты от выбора
            if (choice.effects) {
                console.log(`[makeChoice] Applying effects:`, choice.effects);
                
                Object.entries(choice.effects).forEach(([stat, value]) => {
                    // Пропускаем next, так как это не параметр игры
                    if (stat === 'next') return;
                    
                    // Проверяем, что параметр существует в состоянии игры
                    if (this.state[stat] !== undefined) {
                        console.log(`[makeChoice] Changing ${stat} from ${this.state[stat]} by ${value}`);
                        
                        // Для бюджета и readers снимаем ограничение верхней границы в 100
                        if (stat === 'budget' || stat === 'readers') {
                            this.state[stat] = Math.max(0, this.state[stat] + value);
                        } else {
                            // Для остальных параметров сохраняем границы 0-100
                            this.state[stat] = Math.max(0, Math.min(100, this.state[stat] + value));
                        }
                        
                        console.log(`[makeChoice] New ${stat} value: ${this.state[stat]}`);
                    } else {
                        console.warn(`[makeChoice] Stat ${stat} not found in game state`);
                    }
                });
            } else {
                console.warn(`[makeChoice] No effects defined for this choice`);
            }
            
            // Обновляем отображение состояния игры
            this.updateGameState();
            
            // Добавляем текущую ситуацию в использованные
            if (this.state.currentSituation) {
                // Добавляем в массив вместо Set
                if (!this.usedSituations.includes(this.state.currentSituation)) {
                    this.usedSituations.push(this.state.currentSituation);
                    console.log(`[makeChoice] Added ${this.state.currentSituation} to used situations`);
                }
                console.log(`[makeChoice] Used situations: [${this.usedSituations.join(', ')}]`);
            }
            
            // ВАЖНО: сначала проверяем на поражение, может быть, выбор привел к проигрышу
            if (this.checkGameOver()) {
                console.log('[makeChoice] Game over condition met!');
                this.endGame(false);
                return;
            }
            
            // Проверяем достижение цели игры - день победы
            // Получаем день победы из настроек
            const victoryDay = gameSituations.settings?.victoryDay || 30;
            console.log(`[makeChoice] Current turn: ${this.state.turnCount}, victoryDay: ${victoryDay}`);
            
            if (this.state.turnCount >= victoryDay) {
                console.log('[makeChoice] Victory day reached, checking victory conditions');
                if (this.checkVictory()) {
                    console.log('[makeChoice] Victory condition met!');
                    this.endGame(true);
                    return;
                } else {
                    console.log('[makeChoice] Victory day reached but conditions not met');
                }
            } else {
                console.log(`[makeChoice] Need ${victoryDay - this.state.turnCount} more turns to reach victory day`);
            }

            // Определяем следующую ситуацию
            console.log('[makeChoice] Determining next situation...');

            // ВАЖНО: Если у выбора есть next, всегда загружаем указанную ситуацию
            if (choice.effects && choice.effects.next) {
                const nextSituationId = choice.effects.next;
                console.log(`[makeChoice] Next situation from choice.effects.next: ${nextSituationId}`);
                
                // Используем getSituationById для поиска следующей ситуации
                const nextSituation = getSituationById(nextSituationId);
                
                if (nextSituation) {
                    console.log(`[makeChoice] Found linked situation: ${nextSituation.id}`);
                    
                    // Устанавливаем свойство parent для следующей ситуации
                    nextSituation.parent = this.state.currentSituation;
                    console.log(`[makeChoice] Set parent for ${nextSituation.id} to ${nextSituation.parent}`);
                    
                    // Показываем связанную ситуацию
                    this.showSituation(nextSituation);
                } else {
                    console.error(`[makeChoice] Cannot find next situation: ${nextSituationId}, trying random situation`);
                    this.showRandomSituation();
                }
            } else if (choice.next) {
                const nextSituationId = choice.next;
                console.log(`[makeChoice] Next situation from choice.next: ${nextSituationId}`);
                
                // Используем getSituationById для поиска следующей ситуации
                const nextSituation = getSituationById(nextSituationId);
                
                if (nextSituation) {
                    console.log(`[makeChoice] Found linked situation: ${nextSituation.id}`);
                    
                    // Устанавливаем свойство parent для следующей ситуации
                    nextSituation.parent = this.state.currentSituation;
                    console.log(`[makeChoice] Set parent for ${nextSituation.id} to ${nextSituation.parent}`);
                    
                    // Показываем связанную ситуацию
                    this.showSituation(nextSituation);
                } else {
                    console.error(`[makeChoice] Cannot find next situation: ${nextSituationId}, trying random situation`);
                    this.showRandomSituation();
                }
            } else {
                // Если нет привязки к следующей ситуации, выбираем случайную
                console.log(`[makeChoice] No next situation defined, showing random situation`);
                this.showRandomSituation();
            }
        } catch (error) {
            console.error('[makeChoice] Error in makeChoice:', error);
        }
    }

    showRandomSituation() {
        console.log('[showRandomSituation] Selecting random situation');
        
        try {
            // Получаем случайную ситуацию с учетом условий и использованных ситуаций
            const situation = getRandomSituation(this.state, this.usedSituations);
            
            if (!situation) {
                console.error('[showRandomSituation] No situation returned');
                
                // Проверяем, все ли ситуации уже использованы
                if (this.usedSituations.length > 0) {
                    console.log('[showRandomSituation] Clearing used situations list and trying again');
                    // Сохраняем только стартовую ситуацию в использованных
                    const startSituation = this.usedSituations.includes('start');
                    this.usedSituations = startSituation ? ['start'] : [];
                    console.log(`[showRandomSituation] Reset used situations: [${this.usedSituations.join(', ')}]`);
                    
                    // Повторяем попытку с очищенным списком
                    const secondTrySituation = getRandomSituation(this.state, this.usedSituations);
                    if (secondTrySituation) {
                        console.log(`[showRandomSituation] Found situation after clearing list: ${secondTrySituation.id}`);
                        
                        // Добавляем ситуацию в использованные
                        if (secondTrySituation.id && !this.usedSituations.includes(secondTrySituation.id)) {
                            this.usedSituations.push(secondTrySituation.id);
                            console.log(`[showRandomSituation] Added to used situations: ${secondTrySituation.id}`);
                            console.log(`[showRandomSituation] Used situations: [${this.usedSituations.join(', ')}]`);
                        }
                        
                        this.showSituation(secondTrySituation);
                        return;
                    }
                }
                
                // Если даже после очистки списка нет доступных ситуаций, заканчиваем игру победой
                console.warn('[showRandomSituation] Still no situations available, ending game with victory');
                this.endGame(true);
                return;
            }
            
            console.log(`[showRandomSituation] Selected situation: ${situation.id}`);
            
            // Убедимся, что в ситуации есть выборы
            if (!situation.choices || situation.choices.length < 2) {
                console.error(`[showRandomSituation] Situation ${situation.id} has no valid choices`);
                // Рекурсивно пробуем найти другую ситуацию
                this.showRandomSituation();
                return;
            }
            
            // Добавляем ситуацию в использованные сразу для случайных ситуаций
            if (situation.id && !this.usedSituations.includes(situation.id)) {
                this.usedSituations.push(situation.id);
                console.log(`[showRandomSituation] Added to used situations: ${situation.id}`);
                console.log(`[showRandomSituation] Used situations: [${this.usedSituations.join(', ')}]`);
            }
            
            // Используем тот же метод showSituation для отображения случайной ситуации
            this.showSituation(situation);
            
        } catch (error) {
            console.error('[showRandomSituation] Error showing random situation:', error);
        }
    }
    
    checkVictory() {
        // Получаем день победы из настроек
        const victoryDay = gameSituations.settings?.victoryDay || 30;
        
        // Проверяем условия победы
        console.log(`[checkVictory] Checking victory conditions: turn ${this.state.turnCount} >= ${victoryDay}`);
        console.log(`[checkVictory] Additional debug - current turn: ${this.state.turnCount}, victoryDay: ${victoryDay}, currentSituation: ${this.state.currentSituation}`);
        
        // Игра НЕ выигрывается просто после увеличения счетчика, должен быть достигнут victoryDay
        // Сравниваем строго: должно быть ровно или больше victoryDay, не раньше
        if (this.state.turnCount >= victoryDay) {
            console.log('[checkVictory] Victory day reached!');
            // Проверяем, что все параметры выше нуля
            const canWin = this.state.budget > 0 && 
                   this.state.readers > 0 && 
                   this.state.trust > 0 && 
                   this.state.staffMorale > 0;
            console.log(`[checkVictory] Can win? ${canWin} (budget=${this.state.budget}, readers=${this.state.readers}, trust=${this.state.trust}, morale=${this.state.staffMorale})`);
            return canWin;
        }
        
        // Если день победы не достигнут, возвращаем false
        console.log('[checkVictory] Victory day not reached yet');
        return false;
    }

    animateStatChange(stat) {
        const element = this.elements[stat];
        if (element) {
            element.classList.add('changed');
            setTimeout(() => element.classList.remove('changed'), 50);
        }
    }

    // Новый метод для обновления только базовых элементов UI без обращения к ситуациям
    updateBasicUI() {
        // Обновляем видимые статистики
        if (this.elements.budget) this.elements.budget.textContent = this.state.budget.toLocaleString();
        if (this.elements.trust) this.elements.trust.textContent = `${this.state.trust}%`;
        if (this.elements.readers) this.elements.readers.textContent = this.state.readers.toLocaleString();

        // Обновляем скрытые метрики
        if (this.elements.advertiserRelations) {
            this.elements.advertiserRelations.style.setProperty('--value', `${this.state.advertiserRelations}%`);
        }
        if (this.elements.staffMorale) {
            this.elements.staffMorale.style.setProperty('--value', `${this.state.staffMorale}%`);
        }

        // Обновляем счетчик дней
        if (this.elements.day) {
            this.elements.day.textContent = this.state.turnCount;
        }
    }

    checkGameOver() {
        console.log('[checkGameOver] Checking game over conditions:', this.state);
        
        // Проверяем условия окончания игры
        if (this.state.budget <= 0 || 
            this.state.trust <= 0 || 
            this.state.readers <= 0 || 
            this.state.staffMorale <= 0) {
            console.log('[checkGameOver] Game over condition met');
            return true;
        }

        return false;
    }

    endGame(isVictory) {
        console.log(`[endGame] Ending the game, isVictory: ${isVictory}`);
        
        // Очищаем предыдущее состояние и удаляем обработчики свайпов
        this.elements.choicesContainer.innerHTML = '';
        this.hideDecisionText();
        this.removeSwipeHandlers();
        
        // Полностью очищаем карточку и удаляем обрамление
        this.elements.currentCard.innerHTML = '';
        
        // Сбрасываем стили и меняем класс карточки
        this.elements.currentCard.className = isVictory ? 'victory-screen' : 'game-over-screen';
        this.elements.currentCard.style = '';
        
        if (isVictory) {
            // Показываем экран победы
            this.showVictory();
        } else {
            // Показываем экран поражения
            const gameOverContent = document.createElement('div');
            gameOverContent.className = 'game-over-content';
            
            // Создаем текст сообщения
            const messageText = document.createElement('p');
            messageText.className = 'game-over-text';
            
            // Определяем причину поражения
            let gameOverReason = "Игра окончена!";
            if (this.state.budget <= 0) {
                gameOverReason = "Ваше издание обанкротилось.";
            } else if (this.state.trust <= 0) {
                gameOverReason = "Вы потеряли доверие читателей.";
            } else if (this.state.readers <= 0) {
                gameOverReason = "Вы потеряли всех читателей.";
            } else if (this.state.staffMorale <= 0) {
                gameOverReason = "Все сотрудники уволились.";
            }
            
            messageText.textContent = `${gameOverReason}\n\nВы продержались ${this.state.turnCount} дней.\nБюджет: ${this.state.budget.toLocaleString()}\nЧитатели: ${this.state.readers.toLocaleString()}`;
            
            // Добавляем кнопку "Играть снова"
            const restartButton = document.createElement('button');
            restartButton.className = 'choice-button restart-button';
            restartButton.textContent = 'Играть снова';
            restartButton.onclick = () => this.resetGame();
            
            // Добавляем элементы на экран поражения
            gameOverContent.appendChild(messageText);
            gameOverContent.appendChild(restartButton);
            this.elements.currentCard.appendChild(gameOverContent);
        }
        
        // Сбрасываем состояние анимации и взаимодействия
        this.isAnimating = false;
        this.isDragging = false;
        this.currentX = 0;
        this.startX = 0;
        
        console.log('[endGame] Game end screen shown with restart button');
    }

    updateGameState() {
        // Создаем форматтер для чисел с разделителями тысяч
        const numberFormatter = new Intl.NumberFormat(undefined, {
            maximumFractionDigits: 0
        });
        
        // Обновляем отображение счетчика ходов
        if (this.elements.day) {
            // Находим span с классом stat-value внутри элемента day
            const dayValueElement = this.elements.day.querySelector('.stat-value');
            if (dayValueElement) {
                dayValueElement.textContent = this.state.turnCount;
            } else {
                this.elements.day.textContent = this.state.turnCount;
            }
        }
        
        // Обновляем отображение бюджета
        if (this.elements.budget) {
            // Находим span с классом stat-value внутри элемента budget
            const budgetValueElement = this.elements.budget.querySelector('.stat-value');
            if (budgetValueElement) {
                // Используем форматтер для предсказуемой ширины
                budgetValueElement.textContent = numberFormatter.format(this.state.budget);
            } else {
                this.elements.budget.textContent = numberFormatter.format(this.state.budget);
            }
        }
        
        // Обновляем отображение доверия
        if (this.elements.trust) {
            // Находим span с классом stat-value внутри элемента trust
            const trustValueElement = this.elements.trust.querySelector('.stat-value');
            if (trustValueElement) {
                trustValueElement.textContent = `${this.state.trust}%`;
            } else {
                this.elements.trust.textContent = `${this.state.trust}%`;
            }
        }
        
        // Обновляем отображение числа читателей
        if (this.elements.readers) {
            // Находим span с классом stat-value внутри элемента readers
            const readersValueElement = this.elements.readers.querySelector('.stat-value');
            if (readersValueElement) {
                // Используем форматтер для предсказуемой ширины
                readersValueElement.textContent = numberFormatter.format(this.state.readers);
            } else {
                this.elements.readers.textContent = numberFormatter.format(this.state.readers);
            }
        }
        
        // Обновляем отображение отношений с рекламодателями
        if (this.elements.advertiserRelations) {
            this.elements.advertiserRelations.style.setProperty('--value', `${this.state.advertiserRelations}%`);
        }
        
        // Обновляем отображение морального духа сотрудников
        if (this.elements.staffMorale) {
            this.elements.staffMorale.style.setProperty('--value', `${this.state.staffMorale}%`);
        }
        
        console.log('[updateGameState] Game state updated');
    }
}

// Инициализируем игру при загрузке страницы
window.addEventListener('load', () => {
    window.game = new Game();
    window.game.showStartScreen();
    
    // Применяем форматирование чисел сразу после загрузки
    setTimeout(() => {
        window.game.updateGameState();
    }, 0);
}); 