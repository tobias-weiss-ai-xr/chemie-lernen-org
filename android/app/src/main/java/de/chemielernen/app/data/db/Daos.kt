package de.chemielernen.app.data.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface BrowseDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertStates(states: List<CachedState>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertTopics(topics: List<CachedTopic>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertObjectives(objectives: List<CachedObjective>)

    @Query("SELECT * FROM curriculum_state ORDER BY stateAbbr")
    fun observeStates(): Flow<List<CachedState>>

    @Query("SELECT * FROM cached_topic ORDER BY title")
    fun observeTopics(): Flow<List<CachedTopic>>

    @Query("SELECT * FROM cached_topic WHERE state = :state ORDER BY grade, title")
    fun observeTopicsByState(state: String): Flow<List<CachedTopic>>

    @Query("SELECT * FROM cached_objective WHERE topicSlug = :topicSlug ORDER BY text")
    fun observeObjectives(topicSlug: String): Flow<List<CachedObjective>>

    @Query("SELECT * FROM cached_topic WHERE title LIKE '%' || :query || '%' OR slug LIKE '%' || :query || '%' ORDER BY title")
    fun searchTopics(query: String): Flow<List<CachedTopic>>
}

@Dao
interface GradeQueueDao {
    @Insert
    suspend fun insert(grade: PendingGrade): Long

    @Query("SELECT * FROM pending_grade ORDER BY ts ASC")
    fun observePending(): Flow<List<PendingGrade>>

    @Query("SELECT * FROM pending_grade ORDER BY ts ASC")
    suspend fun all(): List<PendingGrade>

    @Query("DELETE FROM pending_grade WHERE id = :id")
    suspend fun delete(id: Long)

    @Query("DELETE FROM pending_grade")
    suspend fun clear()
}

@Dao
interface ExerciseCacheDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(exercise: CachedExercise)

    @Query("SELECT * FROM cached_exercise WHERE topicSlug = :topic AND difficulty = :difficulty LIMIT 1")
    suspend fun find(topic: String, difficulty: String): CachedExercise?
}