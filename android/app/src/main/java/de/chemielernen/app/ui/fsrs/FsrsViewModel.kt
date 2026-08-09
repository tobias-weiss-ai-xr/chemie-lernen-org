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
            runCatching {
                val cardId = card.cardId ?: return@runCatching
                // Backend expects FSRS score: 0 (Again), 0.33 (Hard), 0.66 (Good), 1.0 (Easy)
                val score = when (rating) {
                    1 -> 0.33
                    2 -> 0.66
                    else -> 1.0
                }
                api.reviewCard(cardId, de.chemielernen.app.data.api.FsrsReviewRequest(score = score))
            }
            val idx = _uiState.value.currentIndex + 1
            _uiState.value = _uiState.value.copy(
                currentIndex = idx,
                revealAnswer = false,
            )
        }
    }
}