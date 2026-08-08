package de.chemielernen.app.data.api

import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import de.chemielernen.app.BuildConfig
import de.chemielernen.app.data.repo.TokenStore
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit


object NetworkModule {

    val json: Json = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
        encodeDefaults = true
    }

    private var apiInstance: ChemieApi? = null
    private var tokenStore: TokenStore? = null
    private var okHttp: OkHttpClient? = null

    fun init(tokenStore: TokenStore) {
        this.tokenStore = tokenStore
    }

    /** Mount for tests: inject a custom client. */
    fun overrideForTests(client: OkHttpClient, apiImpl: ChemieApi? = null) {
        okHttp = client
        apiInstance = apiImpl
    }

    val client: OkHttpClient
        get() = okHttp ?: buildClient().also { okHttp = it }

    val api: ChemieApi
        get() = apiInstance ?: buildApi().also { apiInstance = it }

    private fun buildClient(): OkHttpClient {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BASIC
        }
        return OkHttpClient.Builder()
            .addInterceptor { chain ->
                val token = tokenStore?.token?.value
                val request = chain.request().newBuilder()
                    .header("Accept", "application/json")
                    .apply {
                        if (!token.isNullOrEmpty()) {
                            header("Authorization", "Bearer $token")
                        }
                    }
                    .build()
                chain.proceed(request)
            }
            .addInterceptor(logging)
            .build()
    }

    private fun buildApi(): ChemieApi {
        val contentType = "application/json".toMediaType()
        return Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL.trimEnd('/') + "/")
            .client(client)
            .addConverterFactory(json.asConverterFactory(contentType))
            .build()
            .create(ChemieApi::class.java)
    }
}