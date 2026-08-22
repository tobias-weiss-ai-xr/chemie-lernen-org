package de.chemielernen.app.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import de.chemielernen.app.data.api.AssessmentResults
import de.chemielernen.app.data.api.ChemieApi
import de.chemielernen.app.data.api.ClassResults
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class DashboardUiState(
    val learnerResults: AssessmentResults = AssessmentResults(),
    val classResults: ClassResults? = null,
    val isTeacher: Boolean = false,
    val loading: Boolean = false,
    val error: String? = null,
)

/**
 * Dashboard ViewModel — learner results + weak concepts; teacher
 * class-results when the account holds a teacher role.
 */
class DashboardViewModel(
    private val api: ChemieApi,
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    fun load(isTeacher: Boolean, curriculumSlug: String? = null) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(loading = true, error = null, isTeacher = isTeacher)
            runCatching { api.assessmentResults() }
                .onSuccess { results ->
                    _uiState.value = _uiState.value.copy(learnerResults = results, loading = false)
                }
                .onFailure { err ->
                    _uiState.value = _uiState.value.copy(error = err.message, loading = false)
                }
            if (isTeacher && !curriculumSlug.isNullOrEmpty()) {
                runCatching { api.classResults(curriculumSlug) }
                    .onSuccess { classResults ->
                        _uiState.value = _uiState.value.copy(classResults = classResults)
                    }
                    .onFailure {
                        // 403 → hidden; other failures surface as error
                    }
            }
        }
    }
}