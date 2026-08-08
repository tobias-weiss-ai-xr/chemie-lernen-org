package de.chemielernen.app.ui.dashboard

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel,
    isTeacher: Boolean,
    curriculumSlug: String? = null,
) {
    val ui by viewModel.uiState.collectAsState()

    LaunchedEffect(isTeacher, curriculumSlug) {
        viewModel.load(isTeacher, curriculumSlug)
    }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("Meine Ergebnisse", style = MaterialTheme.typography.headlineSmall)
        Spacer(Modifier.height(8.dp))
        if (ui.loading) CircularProgressIndicator()
        if (ui.error != null) {
            Text(ui.error.orEmpty(), color = MaterialTheme.colorScheme.error)
        }

        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(ui.learnerResults.results) { result ->
                Card(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(12.dp)) {
                        Row {
                            Text(result.topic ?: "Quiz", style = MaterialTheme.typography.titleMedium)
                            Spacer(Modifier.weight(1f))
                            Text(
                                "${result.score}%",
                                color = if (result.score >= 60) MaterialTheme.colorScheme.primary
                                else MaterialTheme.colorScheme.error,
                            )
                        }
                        Text(
                            "${result.correctCount}/${result.totalCount} richtig",
                            style = MaterialTheme.typography.bodySmall,
                        )
                        if (result.weakConcepts.isNotEmpty()) {
                            Text(
                                "Schwache Themen: ${result.weakConcepts.joinToString(", ") { it.takeLast(24) }}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.secondary,
                            )
                        }
                    }
                }
            }
        }

        ui.classResults?.let { classRes ->
            Spacer(Modifier.height(16.dp))
            Text("Klassenübersicht", style = MaterialTheme.typography.headlineSmall)
            Text("Durchschnitt: ${classRes.classAverage}%")
            classRes.topicBreakdown.forEach { t ->
                Text(
                    "${t.topic}: ${t.averageScore}% (${t.studentCount} Schüler)",
                    style = MaterialTheme.typography.bodySmall,
                )
            }
        }
    }
}