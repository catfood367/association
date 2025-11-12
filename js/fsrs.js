import { state } from './state.js';

export function calculateRetention(card) {
    if (!card.lastReview || card.s === undefined || card.s <= 0.1) return 1.0;
    const now = Date.now();
    const intervalDays = (now - card.lastReview) / (24 * 60 * 60 * 1000);
    return Math.exp(-intervalDays / card.s);
}

function _getSimilarityGrade(similarity) {
    if (similarity < 0.7) return 0;
    if (similarity >= 0.7 && similarity < 1.0) return 1;
    return -1;
}

function _getPerfectMatchGrade(reactionTime, typingTime) {
    const r = reactionTime / 1000;
    const t = typingTime / 1000;
    const total = r + t;
    const thinkingWhileTyping = t > r * 2 && t > 5;

    if (r < 2 && !thinkingWhileTyping) return 3;
    if (r < 4 && !thinkingWhileTyping) return 2;
    if (r < 6 && !thinkingWhileTyping) return 1;
    if (thinkingWhileTyping) return 0;
    if (total > 10) return 0;

    return 1;
}

export function calculateGrade(similarity, { reactionTime, typingTime }) {
    const similarityGrade = _getSimilarityGrade(similarity);
    if (similarityGrade !== -1) return similarityGrade;

    if (similarity === 1) {
        return _getPerfectMatchGrade(reactionTime, typingTime);
    }
    return 0;
}

function _calculateNewStability(s, d, grade, isNew) {
    // Grau 0 (Again) - Penalidade forte
    if (grade === 0) {
        return Math.max(0.1, s * 0.4);
    }

    // Se for um card NOVO, usamos intervalos fixos
    if (isNew) {
        if (grade === 1) return 0.5; // Hard -> 0.5 dias
        if (grade === 2) return 1.0; // Good -> 1 dia
        if (grade === 3) return 2.0; // Easy -> 2 dias
    }

    // Se for um card em REVISÃO, usamos fatores
    // baseados na dificuldade (d) e estabilidade (s)
    let factor;
    let easeBonus;

    if (grade === 1) { // Hard
        factor = 1.2 * (1 - d); // Fator baixo
        easeBonus = 0; // Sem bônus
        return Math.max(s * factor, s + 0.1); // Garante que cresça no mínimo 0.1
    }
    
    if (grade === 2) { // Good
        factor = 1.5 * (1 - d); // Fator médio
        easeBonus = 1; // Bônus de "Good"
        return (s + easeBonus) * factor;
    }

    if (grade === 3) { // Easy
        factor = 2.0 * (1 - d); // Fator alto
        easeBonus = 2; // Bônus de "Easy"
        return (s + easeBonus) * factor;
    }

    return s; // Segurança
}

function _calculateNewDifficulty(d, grade) {
    // [Again, Hard, Good, Easy]
    const change = [0.1, 0.04, -0.06, -0.15][grade];
    return Math.max(0, Math.min(1, d + change));
}

function _calculateNewDueDate(s, grade) {
    if (grade === 0) {
        // "Again" - agenda para daqui a 5 minutos (em vez de 2)
        return Date.now() + 5 * 60 * 1000;
    }
    // Agenda para 's' dias a partir de agora
    return Date.now() + s * 24 * 60 * 60 * 1000;
}

export function updateFsrsData(card, grade) {
    const isNew = !card.lastReview; // Verifica se o card é novo
    
    card.s = card.s ?? 0.1;
    card.d = card.d ?? 0.5;
    
    const old_s = card.s;
    const old_d = card.d;

    // Passa o status "isNew" para o cálculo de estabilidade
    card.s = _calculateNewStability(old_s, old_d, grade, isNew);
    card.d = _calculateNewDifficulty(old_d, grade);
    card.lastReview = Date.now();
    card.dueDate = _calculateNewDueDate(card.s, grade);
}

function _getDeckContent() {
    const deck = state.allDecks.find(d => d.id === state.currentDeckId);
    return (deck && deck.content) ? deck.content : [];
}

function _getCardsToConsider() {
    const deckContent = _getDeckContent();
    if (deckContent.length === 0) return [];

    const queuedIds = new Set(state.sessionReviewQueue.map(c => c.id));
    const availableCards = deckContent.filter(c => !queuedIds.has(c.id));
    
    return availableCards.length > 0 ? availableCards : deckContent;
}

function _findBestDueCard(cards) {
    const today = Date.now();
    const dueCards = cards.filter(c => c.dueDate && c.dueDate <= today);
    if (dueCards.length === 0) return null;

    let bestCard = null;
    let minRetention = Infinity;
    for (const card of dueCards) {
        const retention = calculateRetention(card);
        if (retention < minRetention) {
            minRetention = retention;
            bestCard = card;
        }
    }
    return bestCard;
}

function _findNewCard(cards) {
    const newCards = cards.filter(c => !c.lastReview);
    if (newCards.length === 0) return null;
    return newCards[Math.floor(Math.random() * newCards.length)];
}

function _getNextReviewCard() {
    if (state.sessionReviewQueue.length > 0) {
        return state.sessionReviewQueue.shift();
    }
    return null;
}

export function pickFsrsCard() {
    const cardsToConsider = _getCardsToConsider();
    if (cardsToConsider.length === 0) return null;

    const dueCard = _findBestDueCard(cardsToConsider);
    if (dueCard) return dueCard;

    const newCard = _findNewCard(cardsToConsider);
    if (newCard) return newCard;
    
    const reviewCard = _getNextReviewCard();
    if (reviewCard) return reviewCard;

    return null;
}

export function calculateDeckStats(content) {
    const today = Date.now() + 2 * 60 * 1000;
    const stats = {
        total: content.length,
        newCount: 0,
        dueCount: 0,
        learningCount: 0,
        matureCount: 0
    };

    for (const card of content) {
        if (!card.lastReview) {
            stats.newCount++;
        } else {
            if (card.dueDate && card.dueDate <= today) stats.dueCount++;
            if (card.s < 7) stats.learningCount++;
            else if (card.s >= 21) stats.matureCount++;
        }
    }
    return stats;
}

export function calculatePerformanceGrade({ reactionTime, typingTime }) {
    const r = reactionTime / 1000;
    const t = typingTime / 1000;
    const total = r + t;

    // "Pensou enquanto digitava" - hesitação é "Hard"
    const thinkingWhileTyping = t > r * 2.5 && t > 4; 
    // Muito lento no geral é "Hard"
    const verySlow = total > 10;

    if (verySlow || thinkingWhileTyping) {
        return 1; // Hard
    }

    // Rápido e direto = Easy
    if (r < 2.5) {
        return 3; // Easy
    }

    // Resposta normal = Good
    if (r < 6.0) {
        return 2; // Good
    }

    // Reação lenta (mais de 6s) = Hard
    return 1; // Hard
}