package de.chemielernen.app.ui.fsrs

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import de.chemielernen.app.data.api.ChemieApi
import de.chemielernen.app.data.api.FsrsCard
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class FsrsUiState(
    val cards: List<FsrsCard> = emptyList(),
    val currentIndex: Int = 0,
    val revealAnswer: Boolean = false,
    val loading: Boolean = false,
    val error: String? = null,
) {
    val current: FsrsCard? get() = cards.getOrNull(currentIndex)
}

class FsrsViewModel(
    private val api: ChemieApi,
) : ViewModel() {

    private val _uiState = MutableStateFlow(FsrsUiState())
    val uiState: StateFlow<FsrsUiState> = _uiState.asStateFlow()

    fun load() {
        viewModelScope.launch {
            _uiState.value = FsrsUiState(loading = true)
            runCatching { api.fetchCards() }
                .onSuccess { resp ->
                    _uiState.value = FsrsUiState(cards = resp.cards, loading = false)
                }
                .onFailure { err ->
                    _uiState.value = FsrsUiState(loading = false, error = err.message)
                }
        }
    }

    fun reveal() {
        _uiState.value = _uiState.value.copy(revealAnswer = true)
    }

    /** Submit a review rating (1 Schwer → 4 Sehr leicht) and advance. */
    fun review(rating: Int) {
        val card = _uiState.value.current ?: return
        viewModelScope.launch {
            val success = runCatching {
                val cardId = card.cardId ?: return@runCatching false
                // Backend expects FSRS score; mirrors the web lernkarten
                // review mapping 1:1 (lernkarten-review.js):
                //   1 Schwer      → 0.0  (Again)
                //   2 Gut         → 0.33 (Hard)
                //   3 Leicht      → 0.66 (Good)
                //   4 Sehr leicht → 1.0  (Easy)
                val score = when (rating) {
                    1 -> 0.0
                    2 -> 0.33
                    3 -> 0.66
                    else -> 1.0
                }
                api.reviewCard(cardId, de.chemielernen.app.data.api.FsrsReviewRequest(score = score))
                true
            }.getOrDefault(false)
            if (success) {
                // Advance only when the review reached the server — a failed
                // network call must not silently lose the review (scheduling
                // would never update).
                _uiState.value = _uiState.value.copy(
                    revealAnswer = false,
                    currentIndex = _uiState.value.currentIndex + 1,
                )
            }
        }
    }
}