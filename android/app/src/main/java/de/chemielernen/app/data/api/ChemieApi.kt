package de.chemielernen.app.data.api

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

interface ChemieApi {

    // ── Auth ─────────────────────────────────────────────────────────
    @POST("api/auth/login")
    suspend fun login(@Body request: AuthRequest): AuthResponse

    @POST("api/auth/register")
    suspend fun register(@Body request: RegisterRequest): AuthResponse

    @GET("api/auth/me")
    suspend fun me(): UserProfile

    @POST("api/auth/logout")
    suspend fun logout(): Unit

    // ── Curricula / Browse ───────────────────────────────────────────
    @GET("api/curricula/states")
    suspend fun states(@Query("schoolType") schoolType: String? = null): List<CurriculumState>

    @GET("api/curricula/topics")
    suspend fun topics(
        @Query("state") state: String? = null,
        @Query("grade") grade: String? = null,
        @Query("schoolType") schoolType: String? = null,
        @Query("search") search: String? = null,
        @Query("limit") limit: Int = 200,
        @Query("offset") offset: Int = 0,
    ): List<TopicInfo>

    @GET("api/curricula/objectives")
    suspend fun objectives(
        @Query("topic") topic: String? = null,
        @Query("search") search: String? = null,
        @Query("limit") limit: Int = 200,
    ): List<ObjectiveInfo>

    @GET("api/curricula/by-state/{state}")
    suspend fun curriculaByState(@Path("state") state: String): List<TopicInfo>

    // ── Quizzes ──────────────────────────────────────────────────────
    @GET("api/quizzes/{topic}")
    suspend fun quiz(@Path("topic") topic: String): QuizResponse

    // ── AI exercises / grading ───────────────────────────────────────
    @POST("api/exercises/generate")
    suspend fun generate(@Body request: GenerateRequest): GeneratedExercise

    @POST("api/exercises/grade")
    suspend fun grade(@Body request: GradeRequest): GradeResponse

    @GET("api/exercises/history")
    suspend fun history(): List<AssessmentResult>

    @POST("api/assessment/sync")
    suspend fun sync(@Body request: SyncRequest): SyncResponse

    @GET("api/assessment/results")
    suspend fun assessmentResults(
        @Query("learnerId") learnerId: String? = null,
        @Query("limit") limit: Int = 50,
    ): AssessmentResults

    @GET("api/assessment/class-results")
    suspend fun classResults(@Query("curriculumSlug") curriculumSlug: String): ClassResults

    // ── FSRS ─────────────────────────────────────────────────────────
    @GET("api/fsrs/cards")
    suspend fun fetchCards(@Query("limit") limit: Int = 20): FsrsCardsResponse

    @POST("api/fsrs/cards/{cardId}/review")
    suspend fun reviewCard(@Path("cardId") cardId: String, @Body request: FsrsReviewRequest): FsrsCard

    // ── Gamification ─────────────────────────────────────────────────
    @POST("api/check-in")
    suspend fun checkIn(): CheckInResponse

    @GET("api/check-in")
    suspend fun checkInStatus(): CheckInResponse

    @GET("api/gamification/profile")
    suspend fun gamificationProfile(): XpProfile

    @GET("api/gamification/badges")
    suspend fun badges(): List<Badge>

    @GET("api/achievements")
    suspend fun achievements(): List<Achievement>

    // ── Learning paths ───────────────────────────────────────────────
    @GET("api/learning-paths")
    suspend fun learningPaths(): List<LearningPath>

    @GET("api/learning-paths/progress")
    suspend fun learningPathProgress(): List<LearningPathProgress>

    @GET("api/learning-paths/{slug}")
    suspend fun learningPath(@Path("slug") slug: String): LearningPath

    @POST("api/learning-paths/{slug}/enroll")
    suspend fun enrollLearningPath(@Path("slug") slug: String): LearningPath
}