package de.chemielernen.app

import android.app.Application
import de.chemielernen.app.data.api.NetworkModule
import de.chemielernen.app.data.db.AppDatabase
import de.chemielernen.app.data.repo.AuthRepository
import de.chemielernen.app.data.repo.BrowseRepository
import de.chemielernen.app.data.repo.GradeQueueRepository
import de.chemielernen.app.data.repo.QuizRepository
import de.chemielernen.app.data.repo.TokenStore

/**
 * Minimal service locator — wires the singleton dependencies together.
 */
class ChemieApp : Application() {

    lateinit var tokenStore: TokenStore
        private set
    lateinit var authRepository: AuthRepository
        private set
    lateinit var browseRepository: BrowseRepository
        private set
    lateinit var gradeQueueRepository: GradeQueueRepository
        private set
    lateinit var quizRepository: QuizRepository
        private set

    override fun onCreate() {
        super.onCreate()
        tokenStore = TokenStore(this)
        NetworkModule.init(tokenStore)
        val api = NetworkModule.api
        val db = AppDatabase.get(this)
        authRepository = AuthRepository(api, tokenStore)
        browseRepository = BrowseRepository(api, db.browseDao())
        gradeQueueRepository = GradeQueueRepository(api, db.gradeQueueDao())
        quizRepository = QuizRepository(api, db.exerciseCacheDao())
    }
}