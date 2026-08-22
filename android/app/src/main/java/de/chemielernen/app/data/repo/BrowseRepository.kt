package de.chemielernen.app.data.repo

import de.chemielernen.app.data.api.ChemieApi
import de.chemielernen.app.data.api.CurriculumState
import de.chemielernen.app.data.api.ObjectiveInfo
import de.chemielernen.app.data.api.TopicInfo
import de.chemielernen.app.data.api.asEntity
import de.chemielernen.app.data.api.toEntity
import kotlinx.coroutines.flow.first

/**
 * Browse curricula states → topics → objectives with an offline cache.
 * Network-first: fetches, upserts the cache, returns fresh data.
 * On failure falls back to cached rows.
 */
class BrowseRepository(
    private val api: ChemieApi,
    private val dao: de.chemielernen.app.data.db.BrowseDao,
) {
    suspend fun loadStates(): Result<List<CurriculumState>> {
        return runCatching {
            val states = api.states().states
            dao.upsertStates(states.map { it.asEntity() })
            states
        }.recoverCatching {
            // offline fallback
            dao.observeStates().first()
                .map { CurriculumState(state = it.stateAbbr, stateName = it.stateName) }
        }
    }

    suspend fun loadTopics(state: String?, grade: String?): Result<List<TopicInfo>> {
        return runCatching {
            val topics = api.topics(state = state, grade = grade, limit = 500).topics
            dao.upsertTopics(topics.map { it.toEntity() })
            topics
        }.recoverCatching {
            dao.observeTopicsByState(state.orEmpty()).first()
                .map {
                    TopicInfo(
                        slug = it.slug,
                        title = it.title,
                        grade = it.grade,
                        state = it.state,
                        objectiveCount = it.objectiveCount,
                    )
                }
        }
    }

    suspend fun loadObjectives(topicSlug: String): Result<List<ObjectiveInfo>> {
        return runCatching {
            val objectives = api.objectives(topic = topicSlug, limit = 200).objectives
            dao.upsertObjectives(objectives.map { it.toEntity() })
            objectives
        }.recoverCatching {
            dao.observeObjectives(topicSlug).first()
                .map {
                    ObjectiveInfo(
                        slug = it.slug,
                        text = it.text,
                        topicSlug = it.topicSlug,
                        topicTitle = it.topicTitle,
                    )
                }
        }
    }
}