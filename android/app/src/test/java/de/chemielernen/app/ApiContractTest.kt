package de.chemielernen.app

import com.google.common.truth.Truth.assertThat
import de.chemielernen.app.data.api.AchievementsResponse
import de.chemielernen.app.data.api.AssessmentResults
import de.chemielernen.app.data.api.AuthResponse
import de.chemielernen.app.data.api.BadgesResponse
import de.chemielernen.app.data.api.ByStateResponse
import de.chemielernen.app.data.api.CheckInResponse
import de.chemielernen.app.data.api.CheckInStatus
import de.chemielernen.app.data.api.ClassResults
import de.chemielernen.app.data.api.EnrollResponse
import de.chemielernen.app.data.api.ExerciseHistoryResponse
import de.chemielernen.app.data.api.FsrsCardsResponse
import de.chemielernen.app.data.api.FsrsReviewResponse
import de.chemielernen.app.data.api.LearningPathDetail
import de.chemielernen.app.data.api.LearningPathProgressResponse
import de.chemielernen.app.data.api.LearningPathsResponse
import de.chemielernen.app.data.api.MeResponse
import de.chemielernen.app.data.api.ObjectivesResponse
import de.chemielernen.app.data.api.QuizResponse
import de.chemielernen.app.data.api.StatesResponse
import de.chemielernen.app.data.api.SyncRequest
import de.chemielernen.app.data.api.SyncResponse
import de.chemielernen.app.data.api.TopicsResponse
import de.chemielernen.app.data.api.XpProfile
import kotlinx.serialization.json.Json
import org.junit.Test

// Contract snapshot regression tests.
// * Contract snapshot regression tests: these JSON fixtures mirror the REAL
// * api/routes/* responses (checked against source 2026-08). If the backend
// * changes a field name/type, one of these tests fails instead of the app
// * silently showing empty/zero data.
// */
class ApiContractTest {

    private val json = Json { ignoreUnknownKeys = true; coerceInputValues = true }

    private inline fun <reified T> parse(body: String): T = json.decodeFromString(body)

    @Test
    fun `auth login wraps user and token`() {
        val r = parse<AuthResponse>(
            """{"user":{"id":"1","email":"a@b.de","name":"Anna","role":"user","tier":null,"isPremium":false,"premiumUntil":null,"learningProfile":null,"createdAt":"2026-01-01"},"token":"jwt-xyz"}"""
        )
        assertThat(r.token).isEqualTo("jwt-xyz")
        assertThat(r.user.id).isEqualTo("1")
        assertThat(r.user.isPremium).isFalse()
    }

    @Test
    fun `auth login accepts numeric user id`() {
        val r = parse<AuthResponse>(
            """{"user":{"id":1,"email":"a@b.de","name":"Anna","role":"user","isPremium":false},"token":"jwt-xyz"}"""
        )
        assertThat(r.user.id).isEqualTo("1")
        assertThat(r.user.email).isEqualTo("a@b.de")
    }

    @Test
    fun `me may return null user`() {
        val r = parse<MeResponse>("""{"user":null}""")
        assertThat(r.user).isNull()
    }

    @Test
    fun `states uses state and stateName keys`() {
        val r = parse<StatesResponse>(
            """{"source":"neo4j","states":[{"state":"BW","stateName":"Baden-Württemberg","curriculumCount":3}],"count":1}"""
        )
        assertThat(r.states.first().state).isEqualTo("BW")
        assertThat(r.states.first().stateName).isEqualTo("Baden-Württemberg")
        assertThat(r.states.first().curriculumCount).isEqualTo(3)
    }

    @Test
    fun `topics wrapper with objectiveCount camelCase`() {
        val r = parse<TopicsResponse>(
            """{"source":"neo4j","topics":[{"slug":"t1","title":"Säuren","grade":"10","state":"BW","schoolType":"Gymnasium","objectiveCount":4}],"total":1,"limit":200,"offset":0}"""
        )
        val t = r.topics.first()
        assertThat(t.slug).isEqualTo("t1")
        assertThat(t.objectiveCount).isEqualTo(4)
    }

    @Test
    fun `objectives wrapper fields`() {
        val r = parse<ObjectivesResponse>(
            """{"source":"neo4j","objectives":[{"slug":"lo-1","text":"pH berechnen","topicSlug":"saeure","topicTitle":"Säuren","state":"BW","grade":"10"}],"total":1}"""
        )
        val o = r.objectives.first()
        assertThat(o.topicSlug).isEqualTo("saeure")
        assertThat(o.text).isEqualTo("pH berechnen")
    }

    @Test
    fun `by-state topics wrapper`() {
        val r = parse<ByStateResponse>(
            """{"source":"neo4j","state":"BW","topicCount":1,"totalObjectives":4,"topics":[{"slug":"s","title":"T","objectiveCount":4}]}"""
        )
        assertThat(r.topics.first().title).isEqualTo("T")
    }

    @Test
    fun `quiz response matches`() {
        val r = parse<QuizResponse>(
            """{"topic":"Allgemeine Chemie","total":1,"questions":[{"id":"q1","topic":"Allgemeine Chemie","type":"multiple-choice","question":"Frage?","options":["A","B"]}]}"""
        )
        assertThat(r.questions.first().options).containsExactly("A", "B")
    }

    @Test
    fun `fsrs cards use cardId and dueDate`() {
        val r = parse<FsrsCardsResponse>(
            """{"cards":[{"cardId":"c-1","topicId":"t","question":"Q","answer":"A","type":"flashcard","interval":3,"ease":2.5,"dueDate":"2026-08-10","lapses":0,"lastReview":null,"createdAt":"2026-08-01"}],"total":1,"nextDue":"2026-08-10"}"""
        )
        val c = r.cards.first()
        assertThat(c.cardId).isEqualTo("c-1")
        assertThat(c.question).isEqualTo("Q")
        assertThat(c.answer).isEqualTo("A")
        assertThat(c.dueDate).isEqualTo("2026-08-10")
    }

    @Test
    fun `fsrs review response reuses interval and dueDate`() {
        val r = parse<FsrsReviewResponse>(
            """{"cardId":"abc-1","interval":5,"ease":2.3,"dueDate":"2026-08-13","lapses":0,"lastReview":"2026-08-08","nextInterval":5,"nextDueDate":"2026-08-13"}"""
        )
        assertThat(r.interval).isEqualTo(5)
        assertThat(r.dueDate).isEqualTo("2026-08-13")
    }

    @Test
    fun `check-in post shape uses checkedIn and xpEarned`() {
        val r = parse<CheckInResponse>(
            """{"checkedIn":true,"streak":4,"xpEarned":20,"streakBonus":30,"xpTotal":120,"message":null}"""
        )
        assertThat(r.checkedIn).isTrue()
        assertThat(r.xpEarned).isEqualTo(20)
        assertThat(r.streakBonus).isEqualTo(30)
    }

    @Test
    fun `check-in status shape uses checkedInToday`() {
        val r = parse<CheckInStatus>("""{"checkedInToday":false,"streak":3}""")
        assertThat(r.checkedInToday).isFalse()
        assertThat(r.streak).isEqualTo(3)
    }

    @Test
    fun `profile uses xpToNextLevel and lastCheckin`() {
        val r = parse<XpProfile>(
            """{"xp":100,"level":2,"xpToNextLevel":50,"streak":1,"lastCheckin":"2026-08-08","badges":[]}"""
        )
        assertThat(r.xpToNextLevel).isEqualTo(50)
        assertThat(r.lastCheckin).isEqualTo("2026-08-08")
    }

    @Test
    fun `badges wrapper with earned and earnedDate`() {
        val r = parse<BadgesResponse>(
            """{"badges":[{"id":"b1","name":"Erster Toast","description":"","icon":"","condition":"","earned":true,"earnedDate":"2026-08-01"}]}"""
        )
        val b = r.badges.first()
        assertThat(b.id).isEqualTo("b1")
        assertThat(b.earned).isTrue()
        assertThat(b.earnedDate).isEqualTo("2026-08-01")
    }

    @Test
    fun `achievements use title and earned inside badges array`() {
        val r = parse<AchievementsResponse>(
            """{"badges":[{"id":"a1","title":"Praktiker","description":"","icon":"","earned":false}],"totalXp":10,"streak":1,"xpHistory":[]}"""
        )
        val a = r.badges.first()
        assertThat(a.title).isEqualTo("Praktiker")
        assertThat(a.earned).isFalse()
    }

    @Test
    fun `learning paths wrapper`() {
        val r = parse<LearningPathsResponse>(
            """{"paths":[{"slug":"BW-gym","title":"Gymnasium BW","description":"","topicCount":8,"completedTopics":0,"progressPercent":0}],"states":[{"state":"BW","name":"B-W","grade":"10","topicCount":8}]}"""
        )
        val p = r.paths.first()
        assertThat(p.slug).isEqualTo("BW-gym")
        assertThat(p.progressPercent).isEqualTo(0)
    }

    @Test
    fun `learning path detail tree`() {
        val r = parse<LearningPathDetail>(
            """{"slug":"BW-gym","title":"Gymnasium BW","description":"","topics":[{"slug":"t","title":"Säuren","subtopics":[{"slug":"st","title":"St","objectives":[{"id":"lo-1","text":"pH","prerequisites":[],"completed":false}]}]}],"totalObjectives":1,"completedObjectives":0}"""
        )
        assertThat(r.topics.first().subtopics.first().objectives.first().id).isEqualTo("lo-1")
    }

    @Test
    fun `learning path progress wrapper`() {
        val r = parse<LearningPathProgressResponse>(
            """{"totalXp":5,"streakDays":1,"paths":[{"slug":"BW","progressPercent":20,"completedObjectives":1,"totalObjectives":5,"completedAt":null}]}"""
        )
        assertThat(r.paths.first().progressPercent).isEqualTo(20)
    }

    @Test
    fun `enroll response`() {
        val r = parse<EnrollResponse>("""{"enrolled":true,"enrolledAt":"2026-08-08T10:00:00.000Z"}""")
        assertThat(r.enrolled).isTrue()
        assertThat(r.enrolledAt).isNotNull()
    }

    @Test
    fun `assessment results match backend`() {
        val r = parse<AssessmentResults>(
            """{"results":[{"assessmentId":"a-1","topic":"Säuren","difficulty":"medium","date":"2026-08-08","weakConcepts":[],"score":100,"correctCount":1,"totalCount":1}],"total":1}"""
        )
        assertThat(r.results.first().assessmentId).isEqualTo("a-1")
        assertThat(r.results.first().score).isEqualTo(100)
    }

    @Test
    fun `class results use students with assessmentsCompleted`() {
        val r = parse<ClassResults>(
            """{"classAverage":70,"topicBreakdown":[{"topic":"Säuren","averageScore":70.0,"studentCount":2,"assessmentCount":2}],"students":[{"userId":"1","averageScore":70.0,"assessmentsCompleted":2}]}"""
        )
        assertThat(r.students.first().assessmentsCompleted).isEqualTo(2)
        assertThat(r.classAverage).isEqualTo(70)
    }

    @Test
    fun `history response wrapper`() {
        val r = parse<ExerciseHistoryResponse>(
            """{"exercises":[{"id":"e-1","type":"mcq","question":"Q?","options":[],"correctAnswer":"A","userAnswer":"A","answeredAt":"2026-08-08"}],"total":1}"""
        )
        assertThat(r.exercises.first().id).isEqualTo("e-1")
    }

    @Test
    fun `sync request must be batch with userId`() {
        val r = parse<SyncRequest>(
            """{"batch":[{"userId":"1","assessmentId":"sa-1","createdAt":"2026-08-08","topic":"Säuren","difficulty":"medium","type":"auto-generated","gradedAnswers":[{"exerciseId":"e-1","answer":"A","correct":true}]}],"synced":0}"""
        )
        assertThat(r.batch.first().userId).isEqualTo("1")
        assertThat(r.batch.first().gradedAnswers.first().exerciseId).isEqualTo("e-1")
    }

    @Test
    fun `sync response is synced count`() {
        val r = parse<SyncResponse>("""{"synced":3}""")
        assertThat(r.synced).isEqualTo(3)
    }
}