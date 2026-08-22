package de.chemielernen.app.data.repo

import de.chemielernen.app.data.api.ChemieApi
import de.chemielernen.app.data.api.GeneratedExercise
import de.chemielernen.app.data.api.QuizResponse
import de.chemielernen.app.data.db.ExerciseCacheDao
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

/**
 * Quiz repository: static quizzes from the API, AI generations from
 * LiteLLM via the server (with a per-topic cache to avoid repeated
 * generation calls / rate limiter pressure).
 */
class QuizRepository(
    private val api: ChemieApi,
    private val cacheDao: ExerciseCacheDao,
) {
    private val json = Json { ignoreUnknownKeys = true; encodeDefaults = true }

    suspend fun loadQuiz(topic: String): Result<QuizResponse> =
        runCatching { api.quiz(topic) }

    /**
     * Fetch (or reuse cached) AI exercise for a topic.
     * Mirrors the web fetchAiQuestions contract:
     * options carry letter ids, correctAnswer is a letter.
     */
    suspend fun getAiExercise(
        topicSlug: String,
        difficulty: String = "medium",
    ): GeneratedExercise {
        cacheDao.find(topicSlug, difficulty)?.let { cached ->
            runCatching { json.decodeFromString<GeneratedExercise>(cached.payload) }
                .getOrNull()?.let { return it }
        }
        val generated = api.generate(
            de.chemielernen.app.data.api.GenerateRequest(
                topicSlug = topicSlug,
                difficulty = difficulty,
                type = "mcq",
                includeFsrsContext = true,
            )
        )
        cacheDao.upsert(
            de.chemielernen.app.data.db.CachedExercise(
                topicSlug = topicSlug,
                difficulty = difficulty,
                payload = json.encodeToString<GeneratedExercise>(generated),
            )
        )
        return generated
    }

    /** Read the cached AI exercise for a topic (offline path). */
    suspend fun getCachedExercise(topicSlug: String): GeneratedExercise? =
        cacheDao.find(topicSlug, "medium")?.let { cached ->
            runCatching { json.decodeFromString<GeneratedExercise>(cached.payload) }.getOrNull()
        }
}