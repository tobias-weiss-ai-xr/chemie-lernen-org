package de.chemielernen.app.data.repo

import de.chemielernen.app.data.api.AuthRequest
import de.chemielernen.app.data.api.AuthResponse
import de.chemielernen.app.data.api.ChemieApi
import de.chemielernen.app.data.api.RegisterRequest
import de.chemielernen.app.data.api.UserProfile
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

sealed interface AuthState {
    data object Unknown : AuthState
    data object LoggedOut : AuthState
    data class LoggedIn(val user: UserProfile) : AuthState
    data class Error(val message: String) : AuthState
}

/**
 * Auth repository: login/register against the API, session restore via /api/auth/me.
 */
class AuthRepository(
    private val api: ChemieApi,
    private val tokenStore: TokenStore,
) {
    private val _state = MutableStateFlow<AuthState>(AuthState.Unknown)
    val state: StateFlow<AuthState> = _state

    suspend fun login(email: String, password: String): Result<UserProfile> {
        return runCatching {
            val response: AuthResponse = api.login(AuthRequest(email.trim(), password))
            tokenStore.save(response.token, response.user.id)
            _state.value = AuthState.LoggedIn(response.user)
            response.user
        }.onFailure { _state.value = AuthState.Error(it.message ?: "Login fehlgeschlagen") }
    }

    suspend fun register(email: String, password: String, name: String): Result<UserProfile> {
        return runCatching {
            val response = api.register(RegisterRequest(email.trim(), password, name.trim()))
            tokenStore.save(response.token, response.user.id)
            _state.value = AuthState.LoggedIn(response.user)
            response.user
        }.onFailure { _state.value = AuthState.Error(it.message ?: "Registrierung fehlgeschlagen") }
    }

    /** Restore a persisted session; returns true when a valid session was found. */
    suspend fun restore(): Boolean {
        val token = tokenStore.token.value
        if (token.isNullOrEmpty()) {
            _state.value = AuthState.LoggedOut
            return false
        }
        return runCatching {
            val user = api.me().user
            if (user == null) {
                _state.value = AuthState.LoggedOut
                false
            } else {
                _state.value = AuthState.LoggedIn(user)
                true
            }
        }.getOrElse { err ->
            // Only a real 401 means the stored token is invalid/expired.
            // On offline starts (IOException) or 5xx the session may still be
            // valid — deleting the token here would log the user out of a
            // perfectly good session every time the app launches without
            // connectivity.
            val http401 = err is retrofit2.HttpException && err.code() == 401
            if (http401) {
                tokenStore.clear()
            }
            _state.value = AuthState.LoggedOut
            false
        }
    }

    suspend fun logout() {
        runCatching { api.logout() }
        tokenStore.clear()
        _state.value = AuthState.LoggedOut
    }
}