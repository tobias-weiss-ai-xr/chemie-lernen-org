package de.chemielernen.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import de.chemielernen.app.ui.navigation.ChemieNavHost
import de.chemielernen.app.ui.theme.ChemieLernenTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val app = application as ChemieApp
        setContent {
            ChemieLernenTheme {
                ChemieNavHost(
                    authRepository = app.authRepository,
                    browseRepository = app.browseRepository,
                    gradeQueueRepository = app.gradeQueueRepository,
                    quizRepository = app.quizRepository,
                )
            }
        }
    }
}