package de.chemielernen.app

import com.google.common.truth.Truth.assertThat
import de.chemielernen.app.data.api.AuthResponse
import de.chemielernen.app.data.api.ChemieApi
import de.chemielernen.app.data.api.UserProfile
import de.chemielernen.app.data.repo.AuthRepository
import de.chemielernen.app.data.repo.AuthState
import de.chemielernen.app.data.repo.TokenStore
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Test

class AuthRepositoryTest {

    private val api = mockk<ChemieApi>()
    private val tokenStore = mockk<TokenStore>()

    private val user = UserProfile(
        id = "42",
        email = "lisa@example.de",
        name = "Lisa",
        role = "user",
    )

    @Test
    fun `login saves token and user`() = runTest {
        coEvery { api.login(any()) } returns AuthResponse(token = "jwt-123", user = user)
        coEvery { tokenStore.token } returns kotlinx.coroutines.flow.MutableStateFlow(null)
        coEvery { tokenStore.save("jwt-123", "42") } answers {}
        coEvery { tokenStore.clear() } answers {}

        val repo = AuthRepository(api, tokenStore)
        val result = repo.login("lisa@example.de", "geheim")

        assertThat(result.isSuccess).isTrue()
        assertThat(repo.state.value).isInstanceOf(AuthState.LoggedIn::class.java)
        coVerify { tokenStore.save("jwt-123", "42") }
    }

    @Test
    fun `restore with no token returns logged out`() = runTest {
        coEvery { tokenStore.token } returns kotlinx.coroutines.flow.MutableStateFlow(null)
        val repo = AuthRepository(api, tokenStore)

        val restored = repo.restore()

        assertThat(restored).isFalse()
        assertThat(repo.state.value).isEqualTo(AuthState.LoggedOut)
    }

    @Test
    fun `restore with invalid token clears and logs out`() = runTest {
        coEvery { tokenStore.token } returns kotlinx.coroutines.flow.MutableStateFlow("expired")
        coEvery { api.me() } throws retrofit2.HttpException(
            retrofit2.Response.error<Any>(401, okhttp3.ResponseBody.create(
                null, "{}",
            )),
        )
        coEvery { tokenStore.clear() } answers {}

        val repo = AuthRepository(api, tokenStore)
        val restored = repo.restore()

        assertThat(restored).isFalse()
        coVerify { tokenStore.clear() }
        assertThat(repo.state.value).isEqualTo(AuthState.LoggedOut)
    }

    @Test
    fun `restore with network error keeps token (offline start)`() = runTest {
        coEvery { tokenStore.token } returns kotlinx.coroutines.flow.MutableStateFlow("valid-token")
        coEvery { api.me() } throws java.io.IOException("Network is unreachable")
        coEvery { tokenStore.clear() } answers {}

        val repo = AuthRepository(api, tokenStore)
        val restored = repo.restore()

        assertThat(restored).isFalse()
        coVerify(exactly = 0) { tokenStore.clear() }
        // UI shows logged out, but the token survives for the next attempt.
    }
}