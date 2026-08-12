package de.chemielernen.app.data.repo

import de.chemielernen.app.data.api.ChemieApi
import de.chemielernen.app.data.api.GradeRequest
import de.chemielernen.app.data.db.GradeQueueDao
import de.chemielernen.app.data.db.PendingGrade
import kotlinx.coroutines.flow.Flow
import retrofit2.HttpException

/**
 * Offline grade queue — mirrors the web `QuizGradeQueue` semantics:
 * persist submissions in the local DB while offline; drain to the
 * server when connectivity returns (POST /api/exercises/grade per item,
 * then /api/assessment/sync for the batch).
 */
class GradeQueueRepository(
    private val api: ChemieApi,
    private val dao: GradeQueueDao,
) {
    /** Enqueue a submission; returns false only if the write fails. */
    suspend fun enqueue(exerciseId: String, answer: String): Boolean {
        return runCatching {
            dao.insert(PendingGrade(exerciseId = exerciseId, answer = answer))
            true
        }.getOrDefault(false)
    }

    fun observePending() = dao.observePending()

    suspend fun pendingCount(): Int = dao.all().size

    /**
     * Drain the queue to the server. Each item POSTed to /api/exercises/grade;
     * on success the row is removed. Failures keep the row for a later retry.
     *
     * Two cases are terminal and never retried:
     *  - HTTP 404 — the backend no longer knows the exercise: sessions are
     *    pruned after 24h and exercises never survive restarts, so retrying
     *    can never succeed.
     *  - rows older than [STALE_AGE_MS] — the device was offline longer than
     *    any plausible session TTL, the grade is unrecoverable.
     */
    suspend fun drain(onItemDrained: (String) -> Unit = {}): Int {
        val pending = dao.all()
        if (pending.isEmpty()) return 0
        var synced = 0
        for (item in pending) {
            val outcome = runCatching {
                api.grade(GradeRequest(exerciseId = item.exerciseId, answer = item.answer))
            }
            val throwable = outcome.exceptionOrNull()
            when {
                outcome.isSuccess -> {
                    dao.delete(item.id)
                    onItemDrained(item.exerciseId)
                    synced++
                }
                throwable is HttpException && throwable.code() == 404 -> {
                    // Exercise/session gone server-side — permanent, drop it.
                    dao.delete(item.id)
                }
                item.ts < System.currentTimeMillis() - STALE_AGE_MS -> {
                    // Offline too long for any session to survive — unrecoverable.
                    dao.delete(item.id)
                }
            }
        }
        return synced
    }

    companion object {
        /** Backend sessions are pruned after 24h; nothing queued longer can ever sync. */
        private const val STALE_AGE_MS = 7 * 24 * 60 * 60 * 1000L
    }
}