package de.chemielernen.app.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import de.chemielernen.app.data.repo.AuthRepository
import de.chemielernen.app.data.repo.AuthState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class AuthUiState(
    val busy: Boolean = false,
    val error: String? = null,
)

class AuthViewModel(
    private val authRepository: AuthRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    val authState: StateFlow<AuthState> = authRepository.state

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _uiState.value = AuthUiState(busy = true)
            val result = authRepository.login(email, password)
            _uiState.value = AuthUiState(
                busy = false,
                error = result.exceptionOrNull()?.message
            )
        }
    }

    fun register(email: String, password: String, name: String) {
        viewModelScope.launch {
            _uiState.value = AuthUiState(busy = true)
            val result = authRepository.register(email, password, name)
            _uiState.value = AuthUiState(
                busy = false,
                error = result.exceptionOrNull()?.message
            )
        }
    }

    fun logout() {
        viewModelScope.launch { authRepository.logout() }
    }

    fun restore() {
        viewModelScope.launch { authRepository.restore() }
    }
}