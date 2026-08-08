package de.chemielernen.app.data.api

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

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

@Serializable
data class AuthResponse(
    val token: String,
    val user: UserProfile,
)

@Serializable
data class UserProfile(
    val id: String,
    val email: String,
    val name: String? = null,
    val role: String? = null,
    @SerialName("isPremium") val isPremium: Boolean = false,
    @SerialName("premiumUntil") val premiumUntil: String? = null,
    @SerialName("createdAt") val createdAt: String? = null,
    @SerialName("learning_profile") val learningProfile: LearningProfile? = null,
)

@Serializable
data class LearningProfile(
    @SerialName("learning_level") val learningLevel: String? = null,
    val interests: List<String> = emptyList(),
    @SerialName("preferred_explanation_style") val preferredExplanationStyle: String? = null,
    @SerialName("weak_areas") val weakAreas: List<String> = emptyList(),
)

// ── Curricula / Browse ───────────────────────────────────────────────

@Serializable
data class CurriculumState(
    @SerialName("state_abbr") val stateAbbr: String,
    @SerialName("state_name") val stateName: String? = null,
    @SerialName("school_type") val schoolType: String? = null,
    val slug: String? = null,
)

@Serializable
data class TopicInfo(
    val slug: String,
    val title: String,
    val grade: String? = null,
    val state: String? = null,
    @SerialName("objectiveCount") val objectiveCount: Int = 0,
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

@Serializable
data class ListResponse<T>(
    val total: Int = 0,
    val items: List<T> = emptyList(),
    val results: List<T> = emptyList(),
    val states: List<T> = emptyList(),
    val topics: List<T> = emptyList(),
    val objectives: List<T> = emptyList(),
) {
    /** Flexible accessor: whatever shape the backend used for this endpoint. */
    fun list(): List<T> = if (items.isNotEmpty()) items else if (results.isNotEmpty()) results else if (topics.isNotEmpty()) topics else if (states.isNotEmpty()) states else if (objectives.isNotEmpty()) objectives else emptyList()
}

// ── Quiz (static + AI) ───────────────────────────────────────────────

@Serializable
data class QuizQuestion(
    val id: String? = null,
    val question: String,
    val options: List<String> = emptyList(),
    val correct: Int? = null,
    val topic: String? = null,
    val level: Int? = null,
)

@Serializable
data class QuizResponse(
    val total: Int = 0,
    val questions: List<QuizQuestion> = emptyList(),
)

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

@Serializable
data class GradeResponse(
    val correct: Boolean = false,
    val score: Int = 0,
    @SerialName("gradedBy") val gradedBy: String? = null,
    val feedback: String? = null,
    val explanation: String? = null,
)

// ── FSRS ─────────────────────────────────────────────────────────────

@Serializable
data class FsrsCard(
    val id: String? = null,
    @SerialName("question_id") val questionId: Long? = null,
    val question: String? = null,
    val answer: String? = null,
    val topic: String? = null,
    val due: String? = null,
    val interval: Long? = null,
    val stability: Double? = null,
    val difficulty: Double? = null,
    val state: String? = null,
)

@Serializable
data class FsrsReviewRequest(
    val rating: Int,
)

@Serializable
data class FsrsCardsResponse(
    val cards: List<FsrsCard> = emptyList(),
    val total: Int = 0,
    val due: Int = 0,
)

// ── Gamification ─────────────────────────────────────────────────────

@Serializable
data class CheckInResponse(
    val ok: Boolean = false,
    @SerialName("streak") val streak: Int = 0,
    @SerialName("streakCount") val streakCount: Int = 0,
    @SerialName("days") val days: List<String> = emptyList(),
    @SerialName("xpAwarded") val xpAwarded: Int = 0,
    val xp: Int = 0,
    val level: Int? = null,
)

@Serializable
data class XpProfile(
    val xp: Int = 0,
    val level: Int = 1,
    val levelName: String? = null,
    val nextLevelXp: Int = 0,
    val xpToNext: Int = 0,
    val streak: Int = 0,
    val rank: Int? = null,
)

@Serializable
data class Achievement(
    val id: String? = null,
    val name: String? = null,
    val description: String? = null,
    val unlocked: Boolean = false,
    @SerialName("unlockedAt") val unlockedAt: String? = null,
    val icon: String? = null,
)

@Serializable
data class Badge(
    val id: String? = null,
    val name: String? = null,
    val rarity: String? = null,
    val icon: String? = null,
    @SerialName("earnedAt") val earnedAt: String? = null,
)

@Serializable
data class GamificationResponse(
    val xp: Int = 0,
    val level: Int = 1,
    val streak: Int = 0,
    val achievements: List<Achievement> = emptyList(),
    val badges: List<Badge> = emptyList(),
    val checkIn: CheckInResponse? = null,
)

// ── Learning paths ───────────────────────────────────────────────────

@Serializable
data class LearningPath(
    val slug: String,
    val title: String,
    val description: String? = null,
    val level: String? = null,
    val duration: String? = null,
    val modules: List<LearningPathModule> = emptyList(),
    @SerialName("isEnrolled") val isEnrolled: Boolean = false,
)

@Serializable
data class LearningPathModule(
    val slug: String,
    val title: String,
    val description: String? = null,
    val tasks: List<String> = emptyList(),
)

@Serializable
data class LearningPathProgress(
    val path: String? = null,
    val slug: String? = null,
    val progress: Double = 0.0,
    val completedModules: Int = 0,
    val totalModules: Int = 0,
    @SerialName("isEnrolled") val isEnrolled: Boolean = false,
)

@Serializable
data class LearningPathsResponse(
    val paths: List<LearningPath> = emptyList(),
    val progress: List<LearningPathProgress> = emptyList(),
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

@Serializable
data class LearnerResults(
    val results: List<AssessmentResult> = emptyList(),
    val total: Int = 0,
)

@Serializable
data class AssessmentResults(
    val results: List<AssessmentResult> = emptyList(),
    val total: Int = 0,
)

@Serializable
data class ClassResults(
    @SerialName("classAverage") val classAverage: Double = 0.0,
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
    @SerialName("userId") val userId: String? = null,
    val name: String? = null,
    val email: String? = null,
    @SerialName("averageScore") val averageScore: Double = 0.0,
    val assessments: Int = 0,
)

@Serializable
data class SyncRequest(
    val data: List<SyncItem> = emptyList(),
)

@Serializable
data class SyncItem(
    @SerialName("exerciseId") val exerciseId: String,
    val answer: String,
    val score: Int = 0,
    val correct: Boolean = false,
    val timestamp: String? = null,
)

@Serializable
data class SyncResponse(
    val ok: Boolean = false,
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
    stateAbbr = stateAbbr,
    stateName = stateName,
    schoolType = schoolType,
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
