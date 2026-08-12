package de.chemielernen.app

import com.google.common.truth.Truth.assertThat
import de.chemielernen.app.data.api.ChemieApi
import de.chemielernen.app.data.api.GradeRequest
import de.chemielernen.app.data.api.GradeResponse
import de.chemielernen.app.data.db.GradeQueueDao
import de.chemielernen.app.data.db.PendingGrade
import de.chemielernen.app.data.repo.GradeQueueRepository
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.Test
import retrofit2.HttpException

class GradeQueueRepositoryTest {

    private val api = mockk<ChemieApi>()
    private val dao = mockk<GradeQueueDao>()

    @Test
    fun `enqueue stores a pending grade locally`() = runTest {
        coEvery { dao.insert(any()) } returns 1L
        coEvery { dao.all() } returns listOf(PendingGrade(id = 1, exerciseId = "ex-1", answer = "A"))
        coEvery { dao.observePending() } returns kotlinx.coroutines.flow.flowOf(
            listOf(PendingGrade(id = 1, exerciseId = "ex-1", answer = "A"))
        )
        val repo = GradeQueueRepository(api, dao)

        val ok = repo.enqueue("ex-1", "A")

        assertThat(ok).isTrue()
        coVerify {
            dao.insert(
                match { it.exerciseId == "ex-1" && it.answer == "A" }
            )
        }
    }

    @Test
    fun `drain posts each pending grade and removes on success`() = runTest {
        val pending = listOf(
            PendingGrade(id = 1, exerciseId = "ex-1", answer = "A"),
            PendingGrade(id = 2, exerciseId = "ex-2", answer = "C"),
        )
        coEvery { dao.all() } returns pending
        coEvery { dao.insert(any()) } returns 1L
        coEvery { api.grade(any()) } returns GradeResponse(correct = true, score = 100)
        coEvery { dao.delete(any()) } returns Unit
        coEvery { dao.clear() } returns Unit
        val repo = GradeQueueRepository(api, dao)

        val synced = repo.drain()

        assertThat(synced).isEqualTo(2)
        coVerify(exactly = 1) { dao.delete(1) }
        coVerify(exactly = 1) { dao.delete(2) }
        coVerify(exactly = 2) { api.grade(any<GradeRequest>()) }
    }

    @Test
    fun `drain keeps failed rows for retry`() = runTest {
        val pending = listOf(PendingGrade(id = 1, exerciseId = "ex-1", answer = "A"))
        coEvery { dao.all() } returns pending
        coEvery { api.grade(any()) } throws RuntimeException("network down")
        coEvery { dao.delete(any()) } returns Unit
        coEvery { dao.clear() } returns Unit

        val repo = GradeQueueRepository(api, dao)
        val synced = repo.drain()

        assertThat(synced).isEqualTo(0)
        coVerify(exactly = 0) { dao.delete(any()) }
    }

    @Test
    fun `drain drops 404 rows instead of retrying forever`() = runTest {
        val pending = listOf(PendingGrade(id = 1, exerciseId = "ex-1", answer = "A"))
        coEvery { dao.all() } returns pending
        coEvery { api.grade(any()) } throws HttpException(
            retrofit2.Response.error<Any>(
                404,
                okhttp3.ResponseBody.create(null, "{}"),
            ),
        )
        coEvery { dao.delete(any()) } returns Unit
        coEvery { dao.clear() } returns Unit

        val repo = GradeQueueRepository(api, dao)
        val synced = repo.drain()

        // Permanently gone — not counted as synced, but never retried either.
        assertThat(synced).isEqualTo(0)
        coVerify(exactly = 1) { dao.delete(1) }
    }

    @Test
    fun `drain keeps 5xx rows for retry`() = runTest {
        val pending = listOf(PendingGrade(id = 1, exerciseId = "ex-1", answer = "A"))
        coEvery { dao.all() } returns pending
        coEvery { api.grade(any()) } throws HttpException(
            retrofit2.Response.error<Any>(
                500,
                okhttp3.ResponseBody.create(null, "{}"),
            ),
        )
        coEvery { dao.delete(any()) } returns Unit
        coEvery { dao.clear() } returns Unit

        val repo = GradeQueueRepository(api, dao)
        val synced = repo.drain()

        assertThat(synced).isEqualTo(0)
        coVerify(exactly = 0) { dao.delete(any()) }
    }

    @Test
    fun `drain drops rows older than the staleness cap`() = runTest {
        val stale = System.currentTimeMillis() - 8 * 24 * 60 * 60 * 1000L
        val pending = listOf(
            PendingGrade(id = 1, exerciseId = "ex-old", answer = "A", ts = stale),
            PendingGrade(id = 2, exerciseId = "ex-fresh", answer = "B"),
        )
        coEvery { dao.all() } returns pending
        coEvery { api.grade(any()) } throws RuntimeException("still offline")
        coEvery { dao.delete(any()) } returns Unit
        coEvery { dao.clear() } returns Unit

        val repo = GradeQueueRepository(api, dao)
        val synced = repo.drain()

        assertThat(synced).isEqualTo(0)
        // Stale row dropped; fresh row kept for a later retry.
        coVerify(exactly = 1) { dao.delete(1) }
        coVerify(exactly = 0) { dao.delete(2) }
    }
}

private fun <T> flowOf(value: T) = kotlinx.coroutines.flow.flowOf(value)