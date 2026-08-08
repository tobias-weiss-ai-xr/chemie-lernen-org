package de.chemielernen.app.data.db

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

/** Cached curriculum state for offline browsing. */
@Entity(tableName = "curriculum_state", indices = [Index(value = ["stateAbbr"], unique = true)])
data class CachedState(
    @PrimaryKey val stateAbbr: String,
    val stateName: String? = null,
    val schoolType: String? = null,
)

/** Cached topic for offline browsing. */
@Entity(
    tableName = "cached_topic",
    indices = [Index(value = ["slug"], unique = true)],
)
data class CachedTopic(
    @PrimaryKey val slug: String,
    val title: String,
    val grade: String? = null,
    val state: String? = null,
    val objectiveCount: Int = 0,
)

/** Cached learning objective for offline browsing. */
@Entity(
    tableName = "cached_objective",
    indices = [Index(value = ["slug"], unique = true)],
)
data class CachedObjective(
    @PrimaryKey val slug: String,
    val text: String? = null,
    val topicSlug: String? = null,
    val topicTitle: String? = null,
)

/** A quiz submission made while offline, drained on reconnect (mirrors web QuizGradeQueue). */
@Entity(tableName = "pending_grade")
data class PendingGrade(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val exerciseId: String,
    val answer: String,
    val ts: Long = System.currentTimeMillis(),
)

/** Cached generated exercises per topic to avoid repeat LiteLLM calls. */
@Entity(
    tableName = "cached_exercise",
    indices = [Index(value = ["topicSlug", "difficulty"], unique = true)],
)
data class CachedExercise(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val topicSlug: String,
    val difficulty: String,
    val payload: String, // JSON of GeneratedExercise
    val ts: Long = System.currentTimeMillis(),
)