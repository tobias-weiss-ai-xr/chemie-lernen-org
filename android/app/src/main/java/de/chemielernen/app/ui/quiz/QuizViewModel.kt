package de.chemielernen.app.ui.quiz

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import de.chemielernen.app.data.api.ChemieApi
import de.chemielernen.app.data.api.GeneratedExercise
import de.chemielernen.app.data.api.GradeRequest
import de.chemielernen.app.data.api.GradeResponse
import de.chemielernen.app.data.repo.GradeQueueRepository
import de.chemielernen.app.data.repo.QuizRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class QuizUiState(
    val topic: String = "",
    val exercise: GeneratedExercise? = null,
    val selectedIndex: Int? = null,
    val gradeResult: GradeResponse? = null,
    val loading: Boolean = false,
    val offline: Boolean = false,
    val pendingCount: Int = 0,
    val error: String? = null,
)

/**
 * Quiz ViewModel — mirrors the web QuizSystem behavior:
 * - AI MCQ options are lettered ({id:'A', text}); the user picks a
 *   0-based index which is mapped to the letter id before grading so
 *   the backend's deterministic grader compares like-for-like.
 * - Offline submissions are enqueued and drained on reconnect
 *   (mirrors the web QuizGradeQueue).
 */
class QuizViewModel(
    private val quizRepository: QuizRepository,
    private val gradeQueueRepository: GradeQueueRepository,
    private val api: ChemieApi,
) : ViewModel() {

    private val _uiState = MutableStateFlow(QuizUiState())
    val uiState: StateFlow<QuizUiState> = _uiState.asStateFlow()

    private val _online = MutableStateFlow(true)

    fun setConnectivity(online: Boolean) {
        _online.value = online
        if (online) drain()
        else _uiState.value = _uiState.value.copy(offline = true)
    }

    fun loadTopic(topicSlug: String) {
        _uiState.value = QuizUiState(topic = topicSlug, loading = true)
        viewModelScope.launch {
            val result: Result<GeneratedExercise> = if (!_online.value) {
                // Offline: try cached AI exercise; error if none cached.
                runCatching { quizRepository.getCachedExercise(topicSlug) }
                    .mapCatching { it ?: throw IllegalStateException("Kein gecachtes Quiz verfügbar") }
            } else {
                runCatching { quizRepository.getAiExercise(topicSlug) }
            }
            result
                .onSuccess { exercise ->
                    _uiState.value = _uiState.value.copy(
                        exercise = exercise,
                        loading = false,
                        offline = !_online.value,
                    )
                }
                .onFailure { err ->
                    _uiState.value = _uiState.value.copy(
                        loading = false,
                        error = err.message ?: "Quiz konnte nicht geladen werden",
                    )
                }
        }
    }

    /** 0-based index → lettered option id → POST /api/exercises/grade (or queue offline). */
    fun submitAnswer(index: Int) {
        val exercise = _uiState.value.exercise ?: return
        val letter = exercise.options.getOrNull(index)?.id ?: return
        _uiState.value = _uiState.value.copy(selectedIndex = index)
        viewModelScope.launch {
            if (_online.value) {
                runCatching {
                    api.grade(GradeRequest(exerciseId = exercise.id, answer = letter))
                }
                    .onSuccess { grade ->
                        _uiState.value = _uiState.value.copy(gradeResult = grade)
                    }
                    .onFailure {
                        enqueueOffline(exercise.id, letter)
                    }
            } else {
                enqueueOffline(exercise.id, letter)
            }
        }
    }

    private suspend fun enqueueOffline(exerciseId: String, letter: String) {
        gradeQueueRepository.enqueue(exerciseId, letter)
        _uiState.value = _uiState.value.copy(
            offline = true,
            pendingCount = gradeQueueRepository.pendingCount(),
        )
    }

    fun drain() {
        viewModelScope.launch {
            val synced = gradeQueueRepository.drain()
            if (synced > 0) {
                _uiState.value = _uiState.value.copy(
                    offline = false,
                    pendingCount = gradeQueueRepository.pendingCount(),
                )
            }
        }
    }

    fun observePending() = gradeQueueRepository.observePending()
}

class ApiException(message: String) : Exception(message)