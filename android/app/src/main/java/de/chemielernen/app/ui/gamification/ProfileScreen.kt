package de.chemielernen.app.ui.gamification

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun ProfileScreen(
    viewModel: GamificationViewModel,
    userName: String?,
    onLogout: () -> Unit,
    dashboard: (@Composable () -> Unit)? = null,
) {
    val ui by viewModel.uiState.collectAsState()

    LaunchedEffect(Unit) { viewModel.load() }

    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text("Profil", style = MaterialTheme.typography.headlineSmall)
        if (userName != null) {
            Text(userName, style = MaterialTheme.typography.titleMedium)
        }

        if (ui.loading && ui.profile.xp == 0) CircularProgressIndicator()

        Card(Modifier.fillMaxWidth()) {
            Column(Modifier.padding(16.dp)) {
                Text("Level ${ui.profile.level}", style = MaterialTheme.typography.titleMedium)
                Text("Erfahrungspunkte: ${ui.profile.xp}", style = MaterialTheme.typography.bodyLarge)
                Text("Serie (Streak): ${ui.profile.streak} Tage", style = MaterialTheme.typography.bodyLarge)
                Spacer(Modifier.height(8.dp))
                if (ui.profile.xpToNextLevel > 0) {
                    LinearProgressIndicator(
                        progress = {
                            val total = ui.profile.xp + ui.profile.xpToNextLevel
                            if (total > 0) (ui.profile.xp.toFloat() / total).coerceIn(0f, 1f) else 0f
                        },
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
            }
        }

        ui.checkIn?.let { check ->
            Card(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp)) {
                    Text(
                        if (check.streak > 0) "Tägliches Check-in: ${check.streak} Tage aktiv"
                        else "Noch nicht eingecheckt",
                        style = MaterialTheme.typography.bodyLarge,
                    )
                    Spacer(Modifier.height(8.dp))
                    Button(onClick = { viewModel.checkIn() }, modifier = Modifier.fillMaxWidth()) {
                        Text("Heute einchecken")
                    }
                }
            }
        }

        if (ui.achievements.isNotEmpty()) {
            Text("Erfolge", style = MaterialTheme.typography.titleMedium)
            ui.achievements.forEach { ach ->
                Card(Modifier.fillMaxWidth()) {
                    Text(
                        "${if (ach.earned) "🏆" else "🔒"} ${ach.title ?: ach.id ?: ""}",
                        modifier = Modifier.padding(12.dp),
                    )
                }
            }
        }

        if (ui.badges.isNotEmpty()) {
            Text("Abzeichen", style = MaterialTheme.typography.titleMedium)
            ui.badges.forEach { badge ->
                Card(Modifier.fillMaxWidth()) {
                    Text(
                        "🎖 ${badge.name ?: badge.id ?: ""}",
                        modifier = Modifier.padding(12.dp),
                    )
                }
            }
        }

        dashboard?.invoke()

        Spacer(Modifier.height(16.dp))
        Button(onClick = onLogout, modifier = Modifier.fillMaxWidth()) {
            Text("Abmelden")
        }
    }
}