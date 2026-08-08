package de.chemielernen.app.data.repo

import de.chemielernen.app.data.api.ChemieApi
import de.chemielernen.app.data.api.GradeRequest
import de.chemielernen.app.data.db.GradeQueueDao
import de.chemielernen.app.data.db.PendingGrade
import kotlinx.coroutines.flow.Flow

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
     */
    suspend fun drain(onItemDrained: (String) -> Unit = {}): Int {
        val pending = dao.all()
        if (pending.isEmpty()) return 0
        var synced = 0
        for (item in pending) {
            val ok = runCatching {
                api.grade(GradeRequest(exerciseId = item.exerciseId, answer = item.answer))
            }.isSuccess
            if (ok) {
                dao.delete(item.id)
                onItemDrained(item.exerciseId)
                synced++
            }
        }
        return synced
    }
}