package de.chemielernen.app

import com.google.common.truth.Truth.assertThat
import de.chemielernen.app.data.api.ChemieApi
import de.chemielernen.app.data.api.FsrsCard
import de.chemielernen.app.data.api.FsrsReviewRequest
import de.chemielernen.app.ui.fsrs.FsrsViewModel
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import io.mockk.slot
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class FsrsViewModelTest {

    private val api = mockk<ChemieApi>()
    private val dispatcher = StandardTestDispatcher()

    private val card = FsrsCard(
        cardId = "card-1",
        question = "Was ist die Avogadro-Konstante?",
        answer = "6,022 × 10²³ mol⁻¹",
    )

    @Before
    fun setup() {
        Dispatchers.setMain(dispatcher)
        coEvery { api.fetchCards(any()) } returns de.chemielernen.app.data.api.FsrsCardsResponse(
            cards = listOf(card),
        )
    }

    @After
    fun tearDown() = Dispatchers.resetMain()

    @Test
    fun `rating 1 Schwer maps to FSRS 0 (Again)`() = runTest(dispatcher) {
        val vm = FsrsViewModel(api)
        vm.load()
        dispatcher.scheduler.advanceUntilIdle()
        val scoreSlot = slot<FsrsReviewRequest>()
        coEvery { api.reviewCard(eq("card-1"), capture(scoreSlot)) } returns
            de.chemielernen.app.data.api.FsrsReviewResponse(cardId = "card-1")
        vm.reveal()
        vm.review(1)
        dispatcher.scheduler.advanceUntilIdle()
        assertThat(scoreSlot.captured.score).isEqualTo(0.0)
    }

    @Test
    fun `rating 2 Gut maps to FSRS 0_33`() = runTest(dispatcher) {
        val vm = FsrsViewModel(api)
        vm.load()
        dispatcher.scheduler.advanceUntilIdle()
        val scoreSlot = slot<FsrsReviewRequest>()
        coEvery { api.reviewCard(eq("card-1"), capture(scoreSlot)) } returns
            de.chemielernen.app.data.api.FsrsReviewResponse(cardId = "card-1")
        vm.reveal()
        vm.review(2)
        dispatcher.scheduler.advanceUntilIdle()
        assertThat(scoreSlot.captured.score).isEqualTo(0.33)
    }

    @Test
    fun `rating 3 Leicht maps to FSRS 0_66 (not 1_0)`() = runTest(dispatcher) {
        val vm = FsrsViewModel(api)
        vm.load()
        dispatcher.scheduler.advanceUntilIdle()
        val scoreSlot = slot<FsrsReviewRequest>()
        coEvery { api.reviewCard(eq("card-1"), capture(scoreSlot)) } returns
            de.chemielernen.app.data.api.FsrsReviewResponse(cardId = "card-1")
        vm.reveal()
        vm.review(3)
        dispatcher.scheduler.advanceUntilIdle()
        assertThat(scoreSlot.captured.score).isEqualTo(0.66)
    }

    @Test
    fun `rating 4 Sehr leicht maps to FSRS 1_0`() = runTest(dispatcher) {
        val vm = FsrsViewModel(api)
        vm.load()
        dispatcher.scheduler.advanceUntilIdle()
        val scoreSlot = slot<FsrsReviewRequest>()
        coEvery { api.reviewCard(eq("card-1"), capture(scoreSlot)) } returns
            de.chemielernen.app.data.api.FsrsReviewResponse(cardId = "card-1")
        vm.reveal()
        vm.review(4)
        dispatcher.scheduler.advanceUntilIdle()
        assertThat(scoreSlot.captured.score).isEqualTo(1.0)
    }

    @Test
    fun `failed review does not advance and can be retried`() = runTest(dispatcher) {
        val vm = FsrsViewModel(api)
        vm.load()
        dispatcher.scheduler.advanceUntilIdle()
        coEvery { api.reviewCard(any(), any()) } throws RuntimeException("offline")
        vm.reveal()
        vm.review(2)
        dispatcher.scheduler.advanceUntilIdle()

        // Still on card-1 (review not lost); the answer stays revealed so the
        // user can retry the rating without re-flipping.
        assertThat(vm.uiState.value.current?.cardId).isEqualTo("card-1")
        assertThat(vm.uiState.value.revealAnswer).isTrue()
    }
}