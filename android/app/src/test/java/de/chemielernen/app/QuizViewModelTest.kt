package de.chemielernen.app

import com.google.common.truth.Truth.assertThat
import de.chemielernen.app.data.api.AiOption
import de.chemielernen.app.data.api.ChemieApi
import de.chemielernen.app.data.api.GeneratedExercise
import de.chemielernen.app.data.api.GradeRequest
import de.chemielernen.app.data.api.GradeResponse
import de.chemielernen.app.data.repo.GradeQueueRepository
import de.chemielernen.app.data.repo.QuizRepository
import de.chemielernen.app.ui.quiz.QuizViewModel
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
class QuizViewModelTest {

    private val quizRepository = mockk<QuizRepository>()
    private val gradeQueueRepository = mockk<GradeQueueRepository>()
    private val api = mockk<ChemieApi>()
    private val dispatcher = StandardTestDispatcher()

    private val exercise = GeneratedExercise(
        id = "ex-1",
        question = "Was ist der pH-Wert von 0,01 mol/L HCl?",
        options = listOf(
            AiOption("A", "pH = 1"),
            AiOption("B", "pH = 2"),
            AiOption("C", "pH = 7"),
        ),
        correctAnswer = "B",
        explanation = "Starke Säure → pH = -log(0.01) = 2",
    )

    @Before
    fun setup() {
        Dispatchers.setMain(dispatcher)
        coEvery { gradeQueueRepository.enqueue(any(), any()) } returns true
        coEvery { gradeQueueRepository.pendingCount() } returns 1
        coEvery { gradeQueueRepository.drain() } returns 0
    }

    @After
    fun tearDown() = Dispatchers.resetMain()

    @Test
    fun `submitAnswer maps 0-based index to lettered id and sends to backend`() = runTest(dispatcher) {
        coEvery { quizRepository.getAiExercise(any(), any()) } returns exercise
        val gradeSlot = slot<GradeRequest>()
        coEvery { api.grade(capture(gradeSlot)) } returns GradeResponse(correct = true, score = 100)
        val vm = QuizViewModel(quizRepository, gradeQueueRepository, api)

        vm.loadTopic("saeure-base")
        dispatcher.scheduler.advanceUntilIdle()
        vm.submitAnswer(1) // index 1 → 'B'

        dispatcher.scheduler.advanceUntilIdle()

        // The lettered id 'B' (not the raw index) must reach the backend.
        coVerify { api.grade(any<GradeRequest>()) }
        assertThat(gradeSlot.captured.answer).isEqualTo("B")
        assertThat(gradeSlot.captured.exerciseId).isEqualTo("ex-1")
        assertThat(vm.uiState.value.gradeResult?.correct).isTrue()
    }

    @Test
    fun `grade failure enqueues offline instead of losing the answer`() = runTest(dispatcher) {
        coEvery { quizRepository.getAiExercise(any(), any()) } returns exercise
        coEvery { api.grade(any()) } throws RuntimeException("offline")
        val vm = QuizViewModel(quizRepository, gradeQueueRepository, api)

        vm.loadTopic("saeure-on")
        dispatcher.scheduler.advanceUntilIdle()
        vm.submitAnswer(1)

        dispatcher.scheduler.advanceUntilIdle()
        coVerify { gradeQueueRepository.enqueue("ex-1", "B") }
        assertThat(vm.uiState.value.offline).isTrue()
    }

    @Test
    fun `reconnect with empty queue clears the offline banner`() = runTest(dispatcher) {
        coEvery { quizRepository.getAiExercise(any(), any()) } returns exercise
        coEvery { api.grade(any()) } throws RuntimeException("offline")
        val vm = QuizViewModel(quizRepository, gradeQueueRepository, api)

        vm.loadTopic("saeure-on")
        dispatcher.scheduler.advanceUntilIdle()
        vm.submitAnswer(1)
        dispatcher.scheduler.advanceUntilIdle()
        assertThat(vm.uiState.value.offline).isTrue()

        // Reconnect: everything drained → banner must clear.
        coEvery { gradeQueueRepository.drain() } returns 1
        coEvery { gradeQueueRepository.pendingCount() } returns 0
        vm.setConnectivity(online = true)
        dispatcher.scheduler.advanceUntilIdle()

        assertThat(vm.uiState.value.offline).isFalse()
        assertThat(vm.uiState.value.pendingCount).isEqualTo(0)
    }

    @Test
    fun `failed drain keeps pending count and banner`() = runTest(dispatcher) {
        coEvery { gradeQueueRepository.drain() } returns 0
        coEvery { gradeQueueRepository.pendingCount() } returns 3
        val vm = QuizViewModel(quizRepository, gradeQueueRepository, api)

        vm.setConnectivity(online = true)
        dispatcher.scheduler.advanceUntilIdle()

        assertThat(vm.uiState.value.offline).isTrue()
        assertThat(vm.uiState.value.pendingCount).isEqualTo(3)
    }
}