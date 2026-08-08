package de.chemielernen.app.ui.browse

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import de.chemielernen.app.data.api.CurriculumState
import de.chemielernen.app.data.api.ObjectiveInfo
import de.chemielernen.app.data.api.TopicInfo
import de.chemielernen.app.data.repo.BrowseRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class BrowseUiState(
    val states: List<CurriculumState> = emptyList(),
    val topics: List<TopicInfo> = emptyList(),
    val objectives: List<ObjectiveInfo> = emptyList(),
    val selectedState: String? = null,
    val loading: Boolean = false,
    val error: String? = null,
)

class BrowseViewModel(
    private val repository: BrowseRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(BrowseUiState())
    val uiState: StateFlow<BrowseUiState> = _uiState.asStateFlow()

    fun loadStates() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(loading = true, error = null)
            repository.loadStates()
                .onSuccess { _uiState.value = _uiState.value.copy(states = it, loading = false) }
                .onFailure { _uiState.value = _uiState.value.copy(error = it.message, loading = false) }
        }
    }

    fun selectState(stateAbbr: String) {
        _uiState.value = _uiState.value.copy(selectedState = stateAbbr)
        loadTopics(stateAbbr)
    }

    fun clearSelection() {
        _uiState.value = _uiState.value.copy(selectedState = null, topics = emptyList(), objectives = emptyList())
    }

    fun loadTopics(state: String? = _uiState.value.selectedState, grade: String? = null) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(loading = true, error = null)
            repository.loadTopics(state, grade)
                .onSuccess { _uiState.value = _uiState.value.copy(topics = it, loading = false) }
                .onFailure { _uiState.value = _uiState.value.copy(error = it.message, loading = false) }
        }
    }

    fun loadObjectives(topicSlug: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(loading = true, error = null)
            repository.loadObjectives(topicSlug)
                .onSuccess { _uiState.value = _uiState.value.copy(objectives = it, loading = false) }
                .onFailure { _uiState.value = _uiState.value.copy(error = it.message, loading = false) }
        }
    }
}