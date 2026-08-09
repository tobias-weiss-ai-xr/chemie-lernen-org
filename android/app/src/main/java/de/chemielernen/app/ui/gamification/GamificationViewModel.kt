package de.chemielernen.app.ui.gamification

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import de.chemielernen.app.data.api.ChemieApi
import de.chemielernen.app.data.api.XpProfile
import de.chemielernen.app.data.api.Badge
import de.chemielernen.app.data.api.Achievement
import de.chemielernen.app.data.api.CheckInResponse
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class GamificationUiState(
    val profile: XpProfile = XpProfile(),
    val badges: List<Badge> = emptyList(),
    val achievements: List<Achievement> = emptyList(),
    val checkIn: CheckInResponse? = null,
    val loading: Boolean = false,
    val error: String? = null,
)

class GamificationViewModel(
    private val api: ChemieApi,
) : ViewModel() {

    private val _uiState = MutableStateFlow(GamificationUiState())
    val uiState: StateFlow<GamificationUiState> = _uiState.asStateFlow()

    fun load() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(loading = true)
            runCatching { api.gamificationProfile() }
                .onSuccess { profile -> _uiState.value = _uiState.value.copy(profile = profile) }
            runCatching { api.badges() }
                .onSuccess { badges -> _uiState.value = _uiState.value.copy(badges = badges.badges) }
            runCatching { api.achievements() }
                .onSuccess { achievements -> _uiState.value = _uiState.value.copy(achievements = achievements.badges) }
            runCatching { api.checkInStatus() }
                .onSuccess { status ->
                    _uiState.value = _uiState.value.copy(
                        checkIn = CheckInResponse(
                            checkedIn = status.checkedInToday,
                            streak = status.streak,
                        )
                    )
                }
            _uiState.value = _uiState.value.copy(loading = false)
        }
    }

    fun checkIn() {
        viewModelScope.launch {
            runCatching { api.checkIn() }
                .onSuccess { checkIn ->
                    _uiState.value = _uiState.value.copy(checkIn = checkIn)
                    // refresh profile for XP update
                    runCatching { api.gamificationProfile() }
                        .onSuccess { _uiState.value = _uiState.value.copy(profile = it) }
                }
                .onFailure { err -> _uiState.value = _uiState.value.copy(error = err.message) }
        }
    }
}