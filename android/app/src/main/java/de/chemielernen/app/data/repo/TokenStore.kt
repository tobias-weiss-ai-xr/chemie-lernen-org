package de.chemielernen.app.data.repo

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

/**
 * Securely persists the JWT and cached user profile across app restarts.
 * Uses EncryptedSharedPreferences with the Android Keystore.
 */
class TokenStore(context: Context) {

    private val prefs: SharedPreferences = run {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        EncryptedSharedPreferences.create(
            context,
            "chemie_auth_secure",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        )
    }

    private val _token = MutableStateFlow<String?>(prefs.getString(KEY_TOKEN, null))
    val token: StateFlow<String?> = _token

    private val _userId = MutableStateFlow<String?>(prefs.getString(KEY_USER_ID, null))
    val userId: StateFlow<String?> = _userId

    fun save(token: String, userId: String) {
        prefs.edit()
            .putString(KEY_TOKEN, token)
            .putString(KEY_USER_ID, userId)
            .apply()
        _token.value = token
        _userId.value = userId
    }

    fun clear() {
        prefs.edit().remove(KEY_TOKEN).remove(KEY_USER_ID).apply()
        _token.value = null
        _userId.value = null
    }

    private companion object {
        const val KEY_TOKEN = "jwt"
        const val KEY_USER_ID = "user_id"
    }
}