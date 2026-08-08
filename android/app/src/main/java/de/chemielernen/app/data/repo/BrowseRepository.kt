package de.chemielernen.app.data.repo

import de.chemielernen.app.data.api.ChemieApi
import de.chemielernen.app.data.api.CurriculumState
import de.chemielernen.app.data.api.ObjectiveInfo
import de.chemielernen.app.data.api.TopicInfo
import de.chemielernen.app.data.api.asEntity
import de.chemielernen.app.data.api.toEntity
import de.chemielernen.app.data.db.BrowseDao
import kotlinx.coroutines.flow.first

/**
 * Browse curricula states → topics → objectives with an offline cache.
 * Network-first: fetches, upserts the cache, returns fresh data.
 * On failure falls back to cached rows.
 */
class BrowseRepository(
    private val api: ChemieApi,
    private val dao: BrowseDao,
) {
    suspend fun loadStates(): Result<List<CurriculumState>> {
        return runCatching {
            val states = api.states()
            dao.upsertStates(states.map { it.asEntity() })
            states
        }.recoverCatching {
            // offline fallback
            dao.observeStates().first()
                .map { CurriculumState(stateAbbr = it.stateAbbr, stateName = it.stateName, schoolType = it.schoolType) }
        }
    }

    suspend fun loadTopics(state: String?, grade: String?): Result<List<TopicInfo>> {
        return runCatching {
            val topics = api.topics(state = state, grade = grade, limit = 500)
            dao.upsertTopics(topics.map { it.toEntity() })
            topics
        }.recoverCatching {
            dao.observeTopicsByState(state.orEmpty()).first()
                .map { TopicInfo(it.slug, it.title, it.grade, it.state, it.objectiveCount) }
        }
    }

    suspend fun loadObjectives(topicSlug: String): Result<List<ObjectiveInfo>> {
        return runCatching {
            val objectives = api.objectives(topic = topicSlug, limit = 200)
            dao.upsertObjectives(objectives.map { it.toEntity() })
            objectives
        }.recoverCatching {
            dao.observeObjectives(topicSlug).first()
                .map { ObjectiveInfo(it.slug, it.text, it.topicSlug, it.topicTitle) }
        }
    }
}