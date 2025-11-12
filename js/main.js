import { state, LAST_OPENED_DECK_ID } from './state.js';
import { dom, showCustomAlert, showCustomConfirm, loadGlobalSettings, saveGlobalSettings, renderDeckModal, initModalCloseListeners, updateModeSettingsVisibility, isModalOpen } from './ui.js';
import * as game from './game.js';
import * as speech from './speech.js';
import * as deckManager from './deckManager.js';
import * as fsrs from './fsrs.js';

function _setupApp() {
    speech.populateVoices();
    loadGlobalSettings();
    deckManager.loadDecks();
    renderDeckModal();
    initModalCloseListeners();
    deckManager.initJsonEditor();
    addDeckListListeners();
}

function _loadLastDeck() {
    const lastDeckId = localStorage.getItem(LAST_OPENED_DECK_ID);
    if (!lastDeckId) {
        dom.deckModal.style.display = 'flex';
        return;
    }
    
    const lastDeck = state.allDecks.find(d => d.id === lastDeckId);
    if (!lastDeck) {
        dom.deckModal.style.display = 'flex';
        return;
    }
    
    if (!lastDeck.content || lastDeck.content.length === 0) {
        dom.deckModal.style.display = 'flex';
        return;
    }
    
    lastDeck.settings.evaluativeModeEnabled = false;
    lastDeck.settings.pronunciationModeEnabled = false;
    deckManager.saveDecks();
    deckManager.selectDeck(lastDeckId);
}

function _initCustomModalListeners() {
    dom.customAlertCloseBtn.addEventListener('click', () => {
        dom.customAlertModal.style.display = 'none';
    });

    dom.customConfirmCancelBtn.addEventListener('click', () => {
        if (state.currentConfirmOnCancel) state.currentConfirmOnCancel();
        dom.customConfirmModal.style.display = 'none';
        state.currentConfirmOnOk = null;
        state.currentConfirmOnCancel = null;
    });

    dom.customConfirmOkBtn.addEventListener('click', () => {
        if (state.currentConfirmOnOk) state.currentConfirmOnOk();
        dom.customConfirmModal.style.display = 'none';
        state.currentConfirmOnOk = null;
        state.currentConfirmOnCancel = null;
    });
}

function _initVoiceListeners() {
    speechSynthesis.onvoiceschanged = speech.populateVoices;
    dom.voiceSelect.addEventListener('change', speech.selectVoice);
}

function _initTopPanelListeners() {
    dom.generalSettingsBtn.addEventListener('click', () => {
        dom.generalCorrectSoundToggle.checked = state.correctSoundEnabled;
        dom.generalWrongSoundToggle.checked = state.wrongSoundEnabled;
        dom.generalDarkModeToggle.checked = state.darkModeEnabled;
        dom.generalSettingsModal.style.display = 'flex';
    });

    dom.deckSelectBtn.addEventListener('click', () => {
        speech.stopRecognition();
        if (speechSynthesis.speaking) speechSynthesis.cancel();
        dom.deckModal.style.display = 'flex';
    });

    dom.settingsBtn.addEventListener('click', () => {
        if (state.currentDeckId) {
            deckManager.openSettingsModal(state.currentDeckId);
        } else {
            showCustomAlert("Por favor, selecione um deck primeiro.");
            dom.deckModal.style.display = 'flex';
        }
    });
}

function _initGlobalSettingsListeners() {
    dom.generalSettingsSaveBtn.addEventListener('click', () => {
        saveGlobalSettings();
        dom.generalSettingsModal.style.display = 'none';
        
        if (state.currentSyllable) {
            game.displaySyllable();
        }
    });

    dom.generalSettingsCancelBtn.addEventListener('click', () => {
        dom.generalSettingsModal.style.display = 'none';
    });
}

function _handleDeckListClick(e) {
    const mainCard = e.target.closest('.deck-card-main');
    const statsBtn = e.target.closest('.deck-action-btn.stats');
    const deleteBtn = e.target.closest('.deck-action-btn.delete');

    if (mainCard) {
        deckManager.selectDeck(mainCard.dataset.deckId);
        return;
    }
    if (statsBtn) {
        deckManager.showDeckStats(statsBtn.dataset.deckId);
        return;
    }
    if (deleteBtn) {
        deckManager.deleteDeck(deleteBtn.dataset.deckId);
        return;
    }
}

function addDeckListListeners() {
    dom.deckList.addEventListener('click', _handleDeckListClick);
}

function _initDeckModalListeners() {
    dom.addDeckBtn.addEventListener('click', () => {
        deckManager.openSettingsModal(null);
    });

    dom.statsCloseBtn.addEventListener('click', () => {
        dom.statsModal.style.display = 'none';
    });

    dom.statsResetFsrsBtn.addEventListener('click', () => {
        const deck = state.allDecks.find(d => d.id === state.currentDeckStatsId);
        if (!deck) return;

        showCustomConfirm(`Tem certeza que quer resetar todas as estatísticas FSRS do deck "${deck.name}"?\n\nEsta ação não pode ser desfeita.`, () => {
            deck.content.forEach(card => {
                card.s = 0.1;
                card.d = 0.5;
                card.lastReview = null;
                card.dueDate = null;
            });
            deckManager.saveDecks();
            deckManager.showDeckStats(state.currentDeckStatsId);
            
            showCustomAlert("Estatísticas FSRS resetadas.");
        });
    });
}

function _initDeckSettingsListeners() {
    dom.settingsSaveBtn.addEventListener('click', deckManager.saveDeckChanges);

    dom.settingsCancelBtn.addEventListener('click', () => {
        dom.settingsModal.style.display = 'none';
        state.pendingDeckContent = null;
    });

    function handleAnswerTipChange() {
        let val = parseInt(dom.answerTipInput.value);
        if (isNaN(val) || val < 0) val = 0;
        if (val > 3) val = 3;
        dom.answerTipInput.value = val;
    }
    
    dom.answerTipInput.addEventListener('change', handleAnswerTipChange);
    dom.answerTipDecrement.addEventListener('click', () => {
        dom.answerTipInput.value = Math.max(0, parseInt(dom.answerTipInput.value) - 1);
        handleAnswerTipChange();
    });
    dom.answerTipIncrement.addEventListener('click', () => {
        dom.answerTipInput.value = Math.min(3, parseInt(dom.answerTipInput.value) + 1);
        handleAnswerTipChange();
    });

    const modeToggles = [dom.modeFreeToggle, dom.modeFsrsToggle, dom.modePronunciationToggle];
    modeToggles.forEach(toggle => toggle.addEventListener('click', (e) => {
        const selectedToggle = e.target;
        if (!selectedToggle.checked) {
            selectedToggle.checked = true;
            return;
        }
        modeToggles.forEach(t => {
            if (t !== selectedToggle) t.checked = false;
        });
        updateModeSettingsVisibility();
    }));
}

function _handleKeyLetter(key) {
    if (/^[a-z ']$/.test(key) && key.length === 1) {
        game.handleKeyInput(key);
    }
}

function _handleKeyEnter() {
    if (state.pronunciationModeEnabled) {
        game.handlePronunciationEnter();
    } else if (state.evaluativeModeEnabled) {
        game.handleFsrsEnter();
        deckManager.saveDecks();
    } else {
        game.handleFreeModeEnter();
    }
}

function _handleKeyDown(e) {
    if (isModalOpen()) return;
    if (!state.currentSyllable || !state.currentSyllable.answer) return;

    const key = e.key.toLowerCase();

    if (e.key === 'Backspace') {
        game.handleBackspace();
    } else if (e.key === 'Control') {
        game.handleVoiceRepeat();
    } else if (e.key === 'Enter') {
        _handleKeyEnter();
    } else {
        _handleKeyLetter(key);
    }
}

function _initGameListeners() {
    document.addEventListener('keydown', _handleKeyDown);
    document.addEventListener('pronunciationSuccess', game.handleCorrectPronunciation);
}

function _initModalCloseResumeListeners() {
    document.addEventListener('deckModalClosed', () => {
        // Se nenhum outro modal estiver aberto
        if (!isModalOpen()) {
            // E estávamos no modo de pronúncia com uma sílaba ativa
            if (state.pronunciationModeEnabled && state.currentSyllable) {
                speech.startRecognition(); // Reinicia o microfone
            }
        }
    });
}

function init() {
    _setupApp();
    _initCustomModalListeners();
    _initVoiceListeners();
    _initTopPanelListeners();
    _initGlobalSettingsListeners();
    _initDeckModalListeners();
    _initDeckSettingsListeners();
    _initGameListeners();
    _initModalCloseResumeListeners();
    _loadLastDeck();
}

init();