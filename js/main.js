// [main.js]
import { state, LAST_OPENED_DECK_ID } from './state.js';
import { dom, showCustomAlert, showCustomConfirm, loadGlobalSettings, saveGlobalSettings, renderDeckModal, initModalCloseListeners, updateModeSettingsVisibility, isModalOpen } from './ui.js';
import * as game from './game.js';
import * as speech from './speech.js';
import * as deckManager from './deckManager.js';
import * as fsrs from './fsrs.js';
import { setLanguage, getLanguage } from './i18n/i18n.js';

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

// NOVA FUNÇÃO PARA TRATAR TECLAS GLOBAIS DE MODAIS
function _handleGlobalModalKeys(e) {
    const isConfirmOpen = dom.customConfirmModal.style.display === 'flex';
    const isAlertOpen = dom.customAlertModal.style.display === 'flex';
    const isEditCardOpen = dom.editCardModal.style.display === 'flex';

    // Handle Enter key only for confirm/alert
    if (e.key === 'Enter') {
        if (isConfirmOpen) {
            e.preventDefault();
            dom.customConfirmOkBtn.click();
            return; // Handled
        }
        if (isAlertOpen) {
            e.preventDefault();
            dom.customAlertCloseBtn.click();
            return; // Handled
        }
        if (isEditCardOpen) {
            e.preventDefault();
            dom.editCardSaveBtn.click();
            return; // Handled
        }
        // Do not handle Enter for other modals
    }

    // Handle Escape key for all modals in order of priority
    if (e.key === 'Escape') {
        e.preventDefault();
        
        if (isConfirmOpen) {
            dom.customConfirmCancelBtn.click();
            return;
        }
        if (isAlertOpen) {
            dom.customAlertCloseBtn.click();
            return;
        }
        if (dom.editCardModal.style.display === 'flex') {
            dom.editCardCancelBtn.click();
            return;
        }
        if (dom.mergeModal.style.display === 'flex') {
            dom.cancelMergeBtn.click();
            return;
        }
        if (dom.jsonEditorModal.style.display === 'flex') {
            dom.cancelJsonBtn.click();
            return;
        }
        if (dom.statsModal.style.display === 'flex') {
            dom.statsCloseBtn.click();
            return;
        }
        if (dom.generalSettingsModal.style.display === 'flex') {
            dom.generalSettingsCancelBtn.click();
            return;
        }
        if (dom.settingsModal.style.display === 'flex') {
            dom.settingsCancelBtn.click();
            return;
        }
        if (dom.congratsModal.style.display === 'flex') {
            dom.restartBtn.click();
            return;
        }
        if (dom.deckModal.style.display === 'flex') {
            dom.deckModal.style.display = 'none';
            document.dispatchEvent(new CustomEvent('deckModalClosed')); 
            return;
        }
    }
}
// FIM DA NOVA FUNÇÃO

function _initVoiceListeners() {
    speechSynthesis.onvoiceschanged = speech.populateVoices;
    dom.voiceSelect.addEventListener('change', () => {
    speech.selectVoice();

    const isVoiceSelected = dom.voiceSelect.value !== 'none';
    dom.modePronunciationToggle.disabled = !isVoiceSelected;
    
    if (!isVoiceSelected) {
        dom.modePronunciationToggle.checked = false;
        dom.modeFreeToggle.checked = !dom.modeFsrsToggle.checked;
        updateModeSettingsVisibility(); 
    }
});
}

function _initTopPanelListeners() {
    dom.generalSettingsBtn.addEventListener('click', () => {
        dom.generalCorrectSoundToggle.checked = state.correctSoundEnabled;
        dom.generalWrongSoundToggle.checked = state.wrongSoundEnabled;
        dom.generalDarkModeToggle.checked = state.darkModeEnabled;
        dom.languageSelector.value = getLanguage();
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

function _handleKeyPress(e) {
    // Se um modal estiver aberto, não faça nada.
    if (isModalOpen()) return;
    // Se estamos em modo pronúncia, não aceite digitação.
    if (state.pronunciationModeEnabled) return;
    // Se não houver um card ativo, não faça nada.
    if (!state.currentSyllable || !state.currentSyllable.answer) return;

    // O evento 'keypress' já ignora a maioria das teclas de controle
    // e o 'e.key' aqui VAI conter o caractere composto (ex: "á", "ç", "1", "?").
    
    // Ignora Enter e Backspace que são tratados no keydown
    if (e.key === 'Enter' || e.key === 'Backspace') {
        return;
    }

    // Envia o caractere (agora com acento e minúsculo) para o jogo.
    game.handleKeyInput(e.key.toLowerCase());
}

function _handleKeyDown(e) {
    if (isModalOpen()) return;

    // Lógica de pular nível (sem alteração)
    const canScopeLevel = !state.evaluativeModeEnabled;
    if (canScopeLevel && e.key === 'ArrowUp') { // <-- ALTERADO
        e.preventDefault(); // Impede a página de fazer scroll
        if (!state.isLevelSkipActive) {
            state.levelSkipInput = '';
        }
        state.isLevelSkipActive = true;
        return;
    }
    if (state.isLevelSkipActive && /^[0-9-]$/.test(e.key)) {
        e.preventDefault();
        state.levelSkipInput += e.key;
        return;
    }
    // Fim da lógica de pular nível

    if (!state.currentSyllable || !state.currentSyllable.answer) return;

    // --- ALTERAÇÃO AQUI ---
    // Apenas teclas de controle são tratadas aqui

    if (e.key === 'Backspace') {
        game.handleBackspace();
    } else if (e.key === 'Control' && !state.pronunciationModeEnabled) {
        game.handleVoiceRepeat();
    } else if (e.key === 'Enter') {
        _handleKeyEnter();
    } else if (e.key === 'F1') { // Bloco da exclusão rápida
        e.preventDefault();
        game.handleDeleteCurrentCardRequest();
    } else if (e.key === 'Alt') { // ADD THIS BLOCK
        e.preventDefault();
        game.handleEditCurrentCardRequest();
    }
    
    // O 'else' que chamava _handleKeyLetter foi REMOVIDO.
    // A digitação de caracteres agora é tratada por _handleKeyPress.
}

function _handleKeyUp(e) {
    if (isModalOpen()) return;

    if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (state.isLevelSkipActive && state.levelSkipInput.length > 0) {
            game.setGameScope(state.levelSkipInput);
        }
        // Reseta o estado do pulo
        state.isLevelSkipActive = false;
        state.levelSkipInput = '';
    }
}
function _initGameListeners() {
    document.addEventListener('keydown', _handleKeyDown);
    document.addEventListener('keyup', _handleKeyUp);

    // --- ADICIONE ESTA LINHA ---
    document.addEventListener('keypress', _handleKeyPress);

    document.addEventListener('pronunciationSuccess', game.handleCorrectPronunciation);
    document.addEventListener('cardDeleted', () => {
        deckManager.saveDecks();
        deckManager.renderDeckModal();
    });
    document.addEventListener('cardUpdated', () => {
        deckManager.saveDecks();
        deckManager.renderDeckModal();
    });
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

function _initEditCardModalListeners() {
    dom.editCardCancelBtn.addEventListener('click', () => {
        dom.editCardModal.style.display = 'none';
    });

    dom.editCardSaveBtn.addEventListener('click', () => {
        const newData = {
            question: dom.editCardQuestionInput.value.trim().toLowerCase(),
            answer: dom.editCardAnswerInput.value.trim().toLowerCase(),
            hint: dom.editCardHintInput.value.trim()
        };

        if (!newData.question || !newData.answer) {
            showCustomAlert("Pergunta e Resposta não podem estar vazios.");
            return;
        }

        game.updateCurrentCard(newData);
        dom.editCardModal.style.display = 'none';
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
    _initEditCardModalListeners();
    _initGameListeners();
    _initModalCloseResumeListeners();
    
    // ADICIONAR ESTE OUVINTE GLOBAL PARA CONTROLE DE TECLAS DE MODAIS
    document.addEventListener('keydown', _handleGlobalModalKeys);
    
    _loadLastDeck();
}

init();