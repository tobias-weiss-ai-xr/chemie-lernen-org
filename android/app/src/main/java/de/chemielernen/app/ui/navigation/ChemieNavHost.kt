package de.chemielernen.app.ui.navigation

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import de.chemielernen.app.data.api.NetworkModule
import de.chemielernen.app.data.repo.AuthRepository
import de.chemielernen.app.data.repo.AuthState
import de.chemielernen.app.data.repo.BrowseRepository
import de.chemielernen.app.data.repo.GradeQueueRepository
import de.chemielernen.app.data.repo.QuizRepository
import de.chemielernen.app.ui.auth.AuthScreen
import de.chemielernen.app.ui.auth.AuthViewModel
import de.chemielernen.app.ui.browse.BrowseViewModel
import de.chemielernen.app.ui.browse.HomeScreen
import de.chemielernen.app.ui.dashboard.DashboardScreen
import de.chemielernen.app.ui.dashboard.DashboardViewModel
import de.chemielernen.app.ui.gamification.GamificationViewModel
import de.chemielernen.app.ui.gamification.ProfileScreen
import de.chemielernen.app.ui.learningpath.LearningPathScreen
import de.chemielernen.app.ui.learningpath.LearningPathViewModel
import de.chemielernen.app.ui.quiz.QuizScreen
import de.chemielernen.app.ui.quiz.QuizViewModel
import de.chemielernen.app.util.SimpleFactory

/**
 * Top-level navigation. Restores the session, shows Auth until
 * logged in, then the main bottom-nav scaffold.
 */
@Composable
fun ChemieNavHost(
    authRepository: AuthRepository,
    browseRepository: BrowseRepository,
    gradeQueueRepository: GradeQueueRepository,
    quizRepository: QuizRepository,
) {
    val authViewModel: AuthViewModel = viewModel(
        factory = SimpleFactory { AuthViewModel(authRepository) },
    )
    val authState by authViewModel.authState.collectAsState()
    val context = LocalContext.current

    LaunchedEffect(Unit) { authViewModel.restore() }

    // Connectivity observer — surface reconnect to the quiz VM.
    DisposableEffect(context) {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val callback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) = Unit
        }
        cm.registerDefaultNetworkCallback(callback)
        onDispose { cm.unregisterNetworkCallback(callback) }
    }

    when (authState) {
        is AuthState.LoggedIn -> MainScaffold(
            user = (authState as AuthState.LoggedIn).user,
            authViewModel = authViewModel,
            browseRepository = browseRepository,
            gradeQueueRepository = gradeQueueRepository,
            quizRepository = quizRepository,
        )
        is AuthState.LoggedOut, AuthState.Unknown, is AuthState.Error -> AuthScreen(authViewModel) {}
    }
}

private data class Tab(val label: String, val icon: ImageVector)

@Composable
private fun MainScaffold(
    user: de.chemielernen.app.data.api.UserProfile,
    authViewModel: AuthViewModel,
    browseRepository: BrowseRepository,
    gradeQueueRepository: GradeQueueRepository,
    quizRepository: QuizRepository,
) {
    val api = NetworkModule.api
    val browseViewModel: BrowseViewModel = viewModel(
        factory = SimpleFactory { BrowseViewModel(browseRepository) },
    )
    val dashboardViewModel: DashboardViewModel = viewModel(
        factory = SimpleFactory { DashboardViewModel(api) },
    )
    val gamificationViewModel: GamificationViewModel = viewModel(
        factory = SimpleFactory { GamificationViewModel(api) },
    )
    val learningPathViewModel: LearningPathViewModel = viewModel(
        factory = SimpleFactory { LearningPathViewModel(api) },
    )
    val quizViewModel: QuizViewModel = viewModel(
        factory = SimpleFactory {
            QuizViewModel(quizRepository, gradeQueueRepository, api)
        },
    )

    var selectedTab by rememberSaveable { mutableIntStateOf(0) }
    val tabs = listOf(
        Tab("Start", Icons.Filled.Home),
        Tab("Lernpfade", Icons.Filled.School),
        Tab("Üben", Icons.Filled.Star),
        Tab("Profil", Icons.Filled.Person),
    )

    Scaffold(
        bottomBar = {
            NavigationBar {
                tabs.forEachIndexed { index, tab ->
                    NavigationBarItem(
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        icon = { Icon(tab.icon, contentDescription = tab.label) },
                        label = { Text(tab.label) },
                    )
                }
            }
        },
    ) { innerPadding ->
        when (selectedTab) {
            0 -> HomeScreen(
                viewModel = browseViewModel,
                onTopicClick = { slug, title ->
                    quizViewModel.loadTopic(topicSlug = slug)
                    selectedTab = 2
                },
            )
            1 -> LearningPathScreen(learningPathViewModel)
            2 -> {
                val quizState = quizViewModel.uiState.collectAsState().value
                QuizScreen(
                    viewModel = quizViewModel,
                    topicSlug = quizState.topic,
                    topicTitle = quizState.topic,
                )
            }
            else -> ProfileScreen(
                viewModel = gamificationViewModel,
                userName = user.name ?: user.email,
                onLogout = { authViewModel.logout() },
            )
        }
    }
}