package de.chemielernen.app.ui.learningpath

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import de.chemielernen.app.data.api.ChemieApi
import de.chemielernen.app.data.api.LearningPath
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class LearningPathUiState(
    val paths: List<LearningPath> = emptyList(),
    val selected: LearningPath? = null,
    val loading: Boolean = false,
    val error: String? = null,
)

class LearningPathViewModel(
    private val api: ChemieApi,
) : ViewModel() {

    private val _uiState = MutableStateFlow(LearningPathUiState())
    val uiState: StateFlow<LearningPathUiState> = _uiState.asStateFlow()

    fun load() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(loading = true, error = null)
            runCatching { api.learningPaths() }
                .onSuccess { paths -> _uiState.value = _uiState.value.copy(paths = paths, loading = false) }
                .onFailure { err -> _uiState.value = _uiState.value.copy(error = err.message, loading = false) }
        }
    }

    fun select(slug: String) {
        viewModelScope.launch {
            runCatching { api.learningPath(slug) }
                .onSuccess { path -> _uiState.value = _uiState.value.copy(selected = path) }
                .onFailure { err -> _uiState.value = _uiState.value.copy(error = err.message) }
        }
    }

    fun enroll(slug: String) {
        viewModelScope.launch {
            runCatching { api.enrollLearningPath(slug) }
                .onSuccess { path -> _uiState.value = _uiState.value.copy(selected = path) }
                .onFailure { err -> _uiState.value = _uiState.value.copy(error = err.message) }
        }
    }
}