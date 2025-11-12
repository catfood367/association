import { state, GROUP_SIZE, correctSound, wrongSound } from './state.js';
import * as utils from './utils.js';
import * as fsrs from './fsrs.js';
import * as speech from './speech.js';
import { dom, showCongrats, updateScoreDisplay, createParticle, showCustomAlert } from './ui.js';

let lastPickedIndex = -1;

function loadGroup(index) {
    const start = index * GROUP_SIZE;
    state.currentGroup = state.syllableList.slice(start, start + GROUP_SIZE);

    if (state.currentGroup.length === 0 && state.syllableList.length > 0 && !state.evaluativeModeEnabled) {
        showCongrats(false, startGame);
    }
}

function _ensureGroupHasSyllables() {
    if (state.currentGroup.length === 0) {
        state.currentGroupIndex++;
        loadGroup(state.currentGroupIndex);
    }
}

function _pickNonRepeatingRandomIndex(group) {
    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * group.length);
    } while (group.length > 1 && randomIndex === lastPickedIndex);
    lastPickedIndex = randomIndex;
    return randomIndex;
}

function pickRandomSyllable() {
    _ensureGroupHasSyllables();
    if (state.currentGroup.length === 0) return null;

    const randomIndex = _pickNonRepeatingRandomIndex(state.currentGroup);
    return { syllable: state.currentGroup[randomIndex], index: randomIndex };
}

function _setupSyllable() {
    state.userTyped = '';
    state.hintUsed = false;
    if (state.currentSyllableElement) state.currentSyllableElement.remove();
}

function _pickNextCard() {
    if (state.evaluativeModeEnabled) {
        state.currentSyllable = fsrs.pickFsrsCard();
        if (!state.currentSyllable) {
            showCongrats(true, startGame);
            return false;
        }
    } else {
        const picked = pickRandomSyllable();
        if (!picked) return false;
        state.currentSyllable = picked.syllable;
        state.currentSyllable.pickIndex = picked.index;
    }
    return true;
}

function _showContextHint() {
    if (state.currentSyllable.hint && !state.pronunciationModeEnabled) {
        dom.contextHintText.textContent = state.currentSyllable.hint;
        dom.contextHintBox.style.display = 'flex';
    } else {
        dom.contextHintBox.style.display = 'none';
    }
}

function _speakSyllable() {
    if (state.selectedVoice && state.utterance) {
        state.utterance.text = state.currentSyllable.question;
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }
        speechSynthesis.speak(state.utterance);
    }
}

function _createSyllableElement() {
    const syllableEl = document.createElement('div');
    syllableEl.classList.add('syllable');
    syllableEl.style.position = 'relative';
    return syllableEl;
}

function _createTranslationElement() {
    const translationEl = document.createElement('span');
    translationEl.classList.add('translation');
    translationEl.textContent = '';
    return translationEl;
}

function _applyFsrsStyles(syllableEl, translationEl) {
    syllableEl.style.color = 'inherit';
    syllableEl.textContent = state.currentSyllable.question;
    translationEl.style.color = 'inherit';
    syllableEl.style.left = '50%';
    syllableEl.style.top = '50%';
    syllableEl.style.transform = 'translate(-50%, -50%)';
}

function _setSyllableText(syllableEl) {
    let placeholder = state.currentSyllable.answer.length - state.answerTipLetters > 0 ? "~" : "";
    if (state.answerTipLetters > 0 && !state.pronunciationModeEnabled) {
        syllableEl.textContent = state.currentSyllable.question + " → " + state.currentSyllable.answer.substring(0, state.answerTipLetters) + placeholder;
    } else {
        syllableEl.textContent = state.currentSyllable.question;
    }
}

function _applyFreeModeStyles(syllableEl, translationEl) {
    const color = utils.generateColor(state.currentSyllable.question);
    const hintColor = (state.colorHintEnabled && !state.pronunciationModeEnabled) ? color : 'inherit';
    syllableEl.style.color = hintColor;
    translationEl.style.color = hintColor;

    _setSyllableText(syllableEl);
    
    if (state.positionHintEnabled && !state.pronunciationModeEnabled) {
        const { x, y } = utils.generatePosition(syllableEl.textContent);
        syllableEl.style.left = x + 'px';
        syllableEl.style.top = y + 'px';
    } else {
        syllableEl.style.left = '50%';
        syllableEl.style.top = '50%';
        syllableEl.style.transform = 'translate(-50%, -50%)';
    }
}

function _appendSyllableToDom(syllableEl, translationEl) {
    syllableEl.appendChild(translationEl);
    state.currentSyllableElement = syllableEl;
    state.translationElement = translationEl;
    document.body.appendChild(syllableEl);
}

export function displaySyllable() {
    _setupSyllable();
    if (!_pickNextCard()) return;

    _showContextHint();

    const syllableEl = _createSyllableElement();
    const translationEl = _createTranslationElement();

    if (state.evaluativeModeEnabled) {
        _applyFsrsStyles(syllableEl, translationEl);
    } else { 
        _applyFreeModeStyles(syllableEl, translationEl);
    }
    
    _appendSyllableToDom(syllableEl, translationEl);

    if (state.pronunciationModeEnabled) {
        if (state.selectedVoice && state.utterance) {
            state.utterance.onend = () => {
                speech.startRecognition();
                state.utterance.onend = null;
            };
            state.utterance.onerror = (e) => {
                console.error("Speech synthesis error, starting recognition anyway.", e);
                speech.startRecognition();
                state.utterance.onend = null;
                state.utterance.onerror = null;
            };
            _speakSyllable(); 
        } else {
            setTimeout(speech.startRecognition, 200);
        }
    } else {
        _speakSyllable();
    }
}

function _resetGameState() {
    state.score = 0;
    state.sessionReviewQueue = [];
    state.currentSyllable = null;
    state.currentGroupIndex = 0;
    state.currentGroup = [];
}

function _cleanupGameUI() {
    if (state.currentSyllableElement) state.currentSyllableElement.remove();
    if (state.translationElement) state.translationElement.remove();
    dom.contextHintBox.style.display = 'none';
}

function _initializeDeckMode() {
    if (state.evaluativeModeEnabled) {
        state.cardStartTime = Date.now();
    } else { 
        if (state.randomToggleEnabled) {
            state.syllableList = utils.shuffle([...state.syllableList]);
        }
        loadGroup(state.currentGroupIndex);
    }
}

export function startGame() {
    if (!state.syllableList || state.syllableList.length === 0) return;

    speech.selectVoice();
    _cleanupGameUI();
    _resetGameState();
    _initializeDeckMode();

    updateScoreDisplay();
    displaySyllable();
}

export function handleKeyInput(key) {
    if (state.pronunciationModeEnabled) return;
    if (!state.firstKeyTime) state.firstKeyTime = Date.now();
    state.userTyped += key;
    if (state.translationElement) {
        state.translationElement.textContent = state.userTyped;
    }
}

export function handleBackspace() {
    if (state.pronunciationModeEnabled) return;
    state.userTyped = state.userTyped.slice(0, -1);
    if (state.translationElement) {
        state.translationElement.textContent = state.userTyped;
    }
}

export function handleVoiceRepeat() {
    _speakSyllable();
}

function _playCorrectFeedback() {
    if (state.correctSoundEnabled) {
        correctSound.currentTime = 0;
        correctSound.play();
    }
    if (state.currentSyllableElement) {
        createParticle(state.currentSyllableElement);
    }
}

function _updateScoreAndGroup() {
    state.score++;
    updateScoreDisplay();
    state.currentGroup.splice(state.currentSyllable.pickIndex, 1);

    if (state.currentGroup.length === 0) {
        state.currentGroupIndex++;
        loadGroup(state.currentGroupIndex);
    }
}

export function handleCorrectPronunciation() {
    if (!state.hintUsed) {
       _playCorrectFeedback();
       _updateScoreAndGroup();
    }

    state.hintUsed = false;

    if (state.translationElement) state.translationElement.textContent = '';
    if (state.currentSyllableElement) state.currentSyllableElement.remove();
    speech.stopRecognition();
    displaySyllable();
}

export function handlePronunciationEnter() {
    if (state.wrongSoundEnabled) {
        wrongSound.currentTime = 0;
        wrongSound.play();
    }
    
    setTimeout(_speakSyllable, 200);

    if (state.translationElement) {
        state.translationElement.textContent = state.currentSyllable.question;
        state.translationElement.dataset.isHint = 'true';
    }
    state.hintUsed = true;
}

function _handleFsrsRepeat() {
    state.hintUsed = false;
    state.userTyped = '';
    if (state.translationElement) state.translationElement.textContent = '';
    if (state.currentSyllableElement) state.currentSyllableElement.remove();
    
    state.cardStartTime = Date.now();
    state.firstKeyTime = 0;
    
    displaySyllable();
}

function _calculateFsrsTimings() {
    const endTime = Date.now();
    const reactionTime = state.firstKeyTime ? state.firstKeyTime - state.cardStartTime : endTime - state.cardStartTime;
    const typingTime = state.firstKeyTime ? endTime - state.firstKeyTime : 0;
    state.firstKeyTime = 0;
    return { reactionTime, typingTime };
}

function _handleFsrsIncorrect() {
    if (state.wrongSoundEnabled) {
        wrongSound.currentTime = 0;
        wrongSound.play();
    }
    if (state.translationElement) {
        state.translationElement.textContent = state.currentSyllable.answer;
    }
    state.userTyped = '';
    state.hintUsed = true;
    state.sessionReviewQueue.push(state.currentSyllable);
    state.cardStartTime = Date.now();
    state.firstKeyTime = 0;
}

function _handleFsrsCorrect() {
    _playCorrectFeedback();
    state.score++;
    if (state.translationElement) state.translationElement.textContent = '';
    if (state.currentSyllableElement) state.currentSyllableElement.remove();
    
    state.cardStartTime = Date.now();
    state.firstKeyTime = 0;
    
    displaySyllable();
}

export function handleFsrsEnter() {
    if (state.hintUsed) {
        _handleFsrsRepeat();
        return;
    }

    const isCorrect = state.userTyped === state.currentSyllable.answer;
    let grade = 0;

    if (isCorrect) {
        const timings = _calculateFsrsTimings();
        grade = fsrs.calculatePerformanceGrade(timings);
        
        fsrs.updateFsrsData(state.currentSyllable, grade);
        _handleFsrsCorrect(grade);
    
    } else {
        grade = 0;
        fsrs.updateFsrsData(state.currentSyllable, grade);
        _handleFsrsIncorrect();
    }
    
    updateScoreDisplay();
}

function _handleFreeModeCorrect() {
    if (!state.hintUsed) {
        _playCorrectFeedback();
        _updateScoreAndGroup();
    }
    if (state.translationElement) state.translationElement.textContent = '';
    if (state.currentSyllableElement) state.currentSyllableElement.remove();
    displaySyllable();
}

function _handleFreeModeIncorrect() {
    if (state.translationElement) {
        state.translationElement.textContent = state.currentSyllable.answer;
    }
    if (state.wrongSoundEnabled) {
        wrongSound.currentTime = 0;
        wrongSound.play();
    }
    state.userTyped = '';
    state.hintUsed = true;

    if (state.restartOnWrongEnabled) {
        setTimeout(() => {
            showCustomAlert("Você errou, Reiniciando jogo!");
            startGame();
        }, 100);
    }
}

export function handleFreeModeEnter() {
    if (state.userTyped === state.currentSyllable.answer) {
        _handleFreeModeCorrect();
    } else {
        _handleFreeModeIncorrect();
    }
}