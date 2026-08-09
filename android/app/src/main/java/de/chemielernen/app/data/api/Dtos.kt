package de.chemielernen.app.data.api

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

// ─────────────────────────────────────────────────────────────────────
// NOTE: field names below match the REAL backend responses (api/routes/*)
// exactly — verified against source 2026-08. Do not "fix" them to look
// prettier; a mismatch breaks deserialization (wrapper objects, renamed
// keys like `state` vs `state_abbr`).
// ─────────────────────────────────────────────────────────────────────

// ── Auth ─────────────────────────────────────────────────────────────

@Serializable
data class AuthRequest(
    val email: String,
    val password: String,
)

@Serializable
data class RegisterRequest(
    val email: String,
    val password: String,
    val name: String = "",
)

/** POST /api/auth/login|register → `{ user, token }`. */
@Serializable
data class AuthResponse(
    val token: String,
    val user: UserProfile,
)

/** GET /api/auth/me → `{ user }` (user may be null when no session). */
@Serializable
data class MeResponse(
    val user: UserProfile? = null,
)

@Serializable
data class UserProfile(
    @Serializable(with = StringOrNumberSerializer::class) val id: String,
    val email: String,
    val name: String? = null,
    val role: String? = null,
    @SerialName("isPremium") val isPremium: Boolean = false,
    @SerialName("premiumUntil") val premiumUntil: String? = null,
    @SerialName("createdAt") val createdAt: String? = null,
    @SerialName("learningProfile") val learningProfile: LearningProfile? = null,
)

/**
 * Backend user ids are stored as numbers in users.json (`id: 1`) but some
 * API surfaces pass them as strings. Accept both.
 */
object StringOrNumberSerializer : kotlinx.serialization.KSerializer<String> {
    override val descriptor = kotlinx.serialization.descriptors.PrimitiveSerialDescriptor(
        "StringOrNumber",
        kotlinx.serialization.descriptors.PrimitiveKind.STRING
    )

    override fun serialize(encoder: kotlinx.serialization.encoding.Encoder, value: String) {
        encoder.encodeString(value)
    }

    override fun deserialize(decoder: kotlinx.serialization.encoding.Decoder): String {
        val jsonDecoder = decoder as? kotlinx.serialization.json.JsonDecoder
            ?: return decoder.decodeString()
        val element = jsonDecoder.decodeJsonElement()
        if (element is kotlinx.serialization.json.JsonPrimitive) {
            return element.content.toIntOrNull()?.toString() ?: element.content
        }
        return element.toString()
    }
}

@Serializable
data class LearningProfile(
    val level: String? = null,
    val interests: List<String> = emptyList(),
    @SerialName("preferred_explanation_style") val preferredExplanationStyle: String? = null,
    @SerialName("weak_areas") val weakAreas: List<String> = emptyList(),
)

// ── Curricula / Browse ───────────────────────────────────────────────

/** GET /api/curricula/states → `{ source?, states, count }`. */
@Serializable
data class StatesResponse(
    val states: List<CurriculumState> = emptyList(),
    val count: Int = 0,
)

/** Single entry: `{ state, stateName, curriculumCount }`. */
@Serializable
data class CurriculumState(
    val state: String? = null,
    @SerialName("stateName") val stateName: String? = null,
    @SerialName("curriculumCount") val curriculumCount: Int = 0,
    val slug: String? = null,
)

/** GET /api/curricula/topics → `{ source, topics, total, limit, offset }`. */
@Serializable
data class TopicsResponse(
    val topics: List<TopicInfo> = emptyList(),
    val total: Int = 0,
    val limit: Int = 0,
    val offset: Int = 0,
)

@Serializable
data class TopicInfo(
    val slug: String,
    val title: String,
    val grade: String? = null,
    val state: String? = null,
    @SerialName("schoolType") val schoolType: String? = null,
    @SerialName("objectiveCount") val objectiveCount: Int = 0,
)

/** GET /api/curricula/objectives → `{ source, objectives, total, limit, offset }`. */
@Serializable
data class ObjectivesResponse(
    val objectives: List<ObjectiveInfo> = emptyList(),
    val total: Int = 0,
    val limit: Int = 0,
    val offset: Int = 0,
)

@Serializable
data class ObjectiveInfo(
    val slug: String,
    val text: String? = null,
    @SerialName("topicSlug") val topicSlug: String? = null,
    @SerialName("topicTitle") val topicTitle: String? = null,
    val state: String? = null,
    val grade: String? = null,
)

/** GET /api/curricula/by-state/:state → `{ source, state, topicCount, topics }`. */
@Serializable
data class ByStateResponse(
    val source: String? = null,
    @SerialName("state") val stateName: String? = null,
    @SerialName("topicCount") val topicCount: Int = 0,
    @SerialName("totalObjectives") val totalObjectives: Int = 0,
    val topics: List<TopicInfo> = emptyList(),
)

// ── Quizzes (static) ──────────────────────────────────────────────────

@Serializable
data class QuizQuestion(
    val id: String? = null,
    val question: String,
    val options: List<String> = emptyList(),
    val correct: Int? = null,
    val topic: String? = null,
    val level: Int? = null,
)

/** GET /api/quizzes/:topic → `{ topic, total, questions }`. */
@Serializable
data class QuizResponse(
    val topic: String? = null,
    val total: Int = 0,
    val questions: List<QuizQuestion> = emptyList(),
)

// ── AI exercises / grading ────────────────────────────────────────────

@Serializable
data class GenerateRequest(
    @SerialName("topicSlug") val topicSlug: String? = null,
    @SerialName("learningObjectiveSlug") val learningObjectiveSlug: String? = null,
    val difficulty: String = "medium",
    val type: String = "mcq",
    @SerialName("includeFsrsContext") val includeFsrsContext: Boolean = false,
)

@Serializable
data class AiOption(
    val id: String,
    val text: String,
)

/** POST /api/exercises/generate → exercise (options carry lettered ids). */
@Serializable
data class GeneratedExercise(
    val id: String,
    val type: String = "mcq",
    val question: String,
    val options: List<AiOption> = emptyList(),
    @SerialName("correctAnswer") val correctAnswer: String? = null,
    val explanation: String? = null,
    val difficulty: String? = null,
    @SerialName("learningObjectiveSlug") val learningObjectiveSlug: String? = null,
)

@Serializable
data class GradeRequest(
    @SerialName("exerciseId") val exerciseId: String,
    val answer: String,
    val type: String = "mcq",
)

/** POST /api/exercises/grade → gradeResult. */
@Serializable
data class GradeResponse(
    val correct: Boolean = false,
    val score: Int = 0,
    @SerialName("gradedBy") val gradedBy: String? = null,
    val feedback: String? = null,
    val explanation: String? = null,
)

/** GET /api/exercises/history → `{ exercises, total }`. */
@Serializable
data class ExerciseHistoryResponse(
    val exercises: List<HistoricalExercise> = emptyList(),
    val total: Int = 0,
)

@Serializable
data class HistoricalExercise(
    val id: String? = null,
    val type: String? = null,
    val question: String? = null,
    val options: List<AiOption> = emptyList(),
    @SerialName("correctAnswer") val correctAnswer: String? = null,
    @SerialName("userAnswer") val userAnswer: String? = null,
    @SerialName("answeredAt") val answeredAt: String? = null,
)

// ── FSRS ─────────────────────────────────────────────────────────────

/** GET /api/fsrs/cards → `{ cards, total, nextDue }`. */
@Serializable
data class FsrsCardsResponse(
    val cards: List<FsrsCard> = emptyList(),
    val total: Int = 0,
    @SerialName("nextDue") val nextDue: String? = null,
)

/** A due card. Real backend key is `cardId` (not `id`) and `dueDate`. */
@Serializable
data class FsrsCard(
    @SerialName("cardId") val cardId: String? = null,
    @SerialName("topicId") val topicId: String? = null,
    val question: String? = null,
    val answer: String? = null,
    val type: String? = null,
    val interval: Int? = null,
    val ease: Double? = null,
    @SerialName("dueDate") val dueDate: String? = null,
    val lapses: Int? = null,
    @SerialName("lastReview") val lastReview: String? = null,
    @SerialName("createdAt") val createdAt: String? = null,
)

/** POST /api/fsrs/cards/{cardId}/review → body REQUIRES `score` (float). */
@Serializable
data class FsrsReviewRequest(
    val score: Double,
)

/** POST /api/fsrs/cards/{cardId}/review → response `{cardId, interval, ease, dueDate, lapses, lastReview, nextInterval, nextDueDate}`. */
@Serializable
data class FsrsReviewResponse(
    @SerialName("cardId") val cardId: String? = null,
    val interval: Int? = null,
    val ease: Double? = null,
    @SerialName("dueDate") val dueDate: String? = null,
    val lapses: Int? = null,
    @SerialName("lastReview") val lastReview: String? = null,
)

// ── Gamification ─────────────────────────────────────────────────────

/** POST /api/check-in → dailyCheckIn result. */
@Serializable
data class CheckInResponse(
    @SerialName("checkedIn") val checkedIn: Boolean = false,
    val streak: Int = 0,
    @SerialName("xpEarned") val xpEarned: Int = 0,
    @SerialName("xpTotal") val xpTotal: Int = 0,
    @SerialName("streakBonus") val streakBonus: Int = 0,
    val message: String? = null,
)

/** GET /api/check-in → `{ checkedInToday, streak }`. */
@Serializable
data class CheckInStatus(
    @SerialName("checkedInToday") val checkedInToday: Boolean = false,
    val streak: Int = 0,
)

/** GET /api/gamification/profile → profile payload. */
@Serializable
data class XpProfile(
    val xp: Int = 0,
    val level: Int = 1,
    @SerialName("xpToNextLevel") val xpToNextLevel: Int = 0,
    val streak: Int = 0,
    @SerialName("lastCheckin") val lastCheckin: String? = null,
    val badges: List<Badge> = emptyList(),
)

/** GET /api/gamification/badges → `{ badges }`. */
@Serializable
data class BadgesResponse(
    val badges: List<Badge> = emptyList(),
)

@Serializable
data class Badge(
    val id: String? = null,
    val name: String? = null,
    val description: String? = null,
    val icon: String? = null,
    val earned: Boolean = false,
    @SerialName("earnedDate") val earnedDate: String? = null,
)

/** GET /api/achievements → `{ badges: [{id, title, description, icon, earned}], ... }`. */
@Serializable
data class AchievementsResponse(
    val title: String? = null,
    val badges: List<Achievement> = emptyList(),
)

@Serializable
data class Achievement(
    val id: String? = null,
    val title: String? = null,
    val description: String? = null,
    val icon: String? = null,
    val earned: Boolean = false,
)

// ── Learning paths ───────────────────────────────────────────────────

/** GET /api/learning-paths → `{ paths, states }`; path entry: {slug,title,description,topicCount,completedTopics,progressPercent}. */
@Serializable
data class LearningPathsResponse(
    val paths: List<LearningPath> = emptyList(),
)

@Serializable
data class LearningPath(
    val slug: String,
    val title: String,
    val description: String? = null,
    @SerialName("topicCount") val topicCount: Int = 0,
    @SerialName("completedTopics") val completedTopics: Int = 0,
    @SerialName("progressPercent") val progressPercent: Int = 0,
)

/** GET /api/learning-paths/:slug (tree). */
@Serializable
data class LearningPathDetail(
    val slug: String,
    val title: String,
    val description: String? = null,
    val topics: List<LearningPathTopic> = emptyList(),
    @SerialName("totalObjectives") val totalObjectives: Int = 0,
    @SerialName("completedObjectives") val completedObjectives: Int = 0,
)

@Serializable
data class LearningPathTopic(
    val slug: String,
    val title: String,
    val subtopics: List<LearningPathSubtopic> = emptyList(),
)

@Serializable
data class LearningPathSubtopic(
    val slug: String,
    val title: String,
    val objectives: List<LearningPathObjective> = emptyList(),
)

@Serializable
data class LearningPathObjective(
    val id: String,
    val text: String = "",
    val completed: Boolean = false,
)

/** GET /api/learning-paths/progress → `{ totalXp, streakDays, paths }`. */
@Serializable
data class LearningPathProgressResponse(
    @SerialName("totalXp") val totalXp: Int = 0,
    @SerialName("streakDays") val streakDays: Int = 0,
    val paths: List<LearningPathNode> = emptyList(),
)

/** Element of `progress.paths`: slug, progressPercent, completedObjectives vh. */
@Serializable
data class LearningPathNode(
    val slug: String,
    @SerialName("progressPercent") val progressPercent: Int = 0,
    @SerialName("completedObjectives") val completedObjectives: Int = 0,
    @SerialName("totalObjectives") val totalObjectives: Int = 0,
    @SerialName("completedAt") val completedAt: String? = null,
)

/** POST /api/learning-paths/:slug/enroll → `{ enrolled, enrolledAt }`. */
@Serializable
data class EnrollResponse(
    val enrolled: Boolean = false,
    @SerialName("enrolledAt") val enrolledAt: String? = null,
)

// ── Assessment dashboards ────────────────────────────────────────────

@Serializable
data class AssessmentResult(
    @SerialName("assessmentId") val assessmentId: String,
    val topic: String? = null,
    val difficulty: String? = null,
    val date: String? = null,
    @SerialName("weakConcepts") val weakConcepts: List<String> = emptyList(),
    val score: Int = 0,
    @SerialName("correctCount") val correctCount: Int = 0,
    @SerialName("totalCount") val totalCount: Int = 0,
)

/** GET /api/assessment/results → `{ results, total }`. */
@Serializable
data class AssessmentResults(
    val results: List<AssessmentResult> = emptyList(),
    val total: Int = 0,
)

/** GET /api/assessment/class-results → `{ classAverage, topicBreakdown, students }`. */
@Serializable
data class ClassResults(
    @SerialName("classAverage") val classAverage: Int = 0,
    @SerialName("topicBreakdown") val topicBreakdown: List<TopicBreakdown> = emptyList(),
    val students: List<StudentSummary> = emptyList(),
)

@Serializable
data class TopicBreakdown(
    val topic: String? = null,
    @SerialName("averageScore") val averageScore: Double = 0.0,
    @SerialName("studentCount") val studentCount: Int = 0,
    @SerialName("assessmentCount") val assessmentCount: Int = 0,
)

@Serializable
data class StudentSummary(
    @Serializable(with = StringOrNumberSerializer::class)
    @SerialName("userId") val userId: String = "",
    @SerialName("averageScore") val averageScore: Double = 0.0,
    @SerialName("assessmentsCompleted") val assessmentsCompleted: Int = 0,
)

/** POST /api/assessment/sync — body MUST be `{ batch: [...] }` (each item needs userId). */
@Serializable
data class SyncRequest(
    val batch: List<SyncItem> = emptyList(),
)

@Serializable
data class SyncItem(
    @SerialName("userId") val userId: String,
    @SerialName("assessmentId") val assessmentId: String,
    @SerialName("createdAt") val createdAt: String? = null,
    val topic: String? = null,
    val difficulty: String? = null,
    val type: String = "auto-generated",
    @SerialName("gradedAnswers") val gradedAnswers: List<SyncGrade> = emptyList(),
    @SerialName("exerciseId") val exerciseId: String? = null,
    val answer: String? = null,
    val correct: Boolean = false,
    val score: Int = 0,
)

@Serializable
data class SyncGrade(
    val id: String? = null,
    @SerialName("exerciseId") val exerciseId: String,
    val answer: String,
    val correct: Boolean = false,
    val feedback: String? = null,
)

@Serializable
data class SyncResponse(
    val synced: Int = 0,
)

// ── Generic error ────────────────────────────────────────────────────

@Serializable
data class ApiError(
    val error: String? = null,
    val message: String? = null,
)

// ── DB mapping helpers ───────────────────────────────────────────────

fun CurriculumState.asEntity() = de.chemielernen.app.data.db.CachedState(
    stateAbbr = state ?: stateName.orEmpty(),
    stateName = stateName,
    schoolType = null,
)

fun TopicInfo.toEntity() = de.chemielernen.app.data.db.CachedTopic(
    slug = slug,
    title = title,
    grade = grade,
    state = state,
    objectiveCount = objectiveCount,
)

fun ObjectiveInfo.toEntity() = de.chemielernen.app.data.db.CachedObjective(
    slug = slug,
    text = text,
    topicSlug = topicSlug,
    topicTitle = topicTitle,
)