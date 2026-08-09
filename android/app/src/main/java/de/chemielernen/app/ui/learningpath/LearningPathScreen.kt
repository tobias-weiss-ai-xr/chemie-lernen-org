package de.chemielernen.app.ui.learningpath

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun LearningPathScreen(viewModel: LearningPathViewModel) {
    val ui by viewModel.uiState.collectAsState()

    LaunchedEffect(Unit) { viewModel.load() }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("Lernpfade", style = MaterialTheme.typography.headlineSmall)
        Spacer(Modifier.height(8.dp))
        if (ui.loading) CircularProgressIndicator()

        ui.selected?.let { path ->
            Card(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp)) {
                    Text(path.title, style = MaterialTheme.typography.titleLarge)
                    Text(path.description ?: "", style = MaterialTheme.typography.bodyMedium)
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "${path.totalObjectives} Lernziele · ${path.completedObjectives} abgeschlossen",
                        style = MaterialTheme.typography.bodySmall,
                    )
                    Spacer(Modifier.height(8.dp))
                    path.topics.forEach { topic ->
                        Text(topic.title, style = MaterialTheme.typography.titleSmall)
                        topic.subtopics.forEach { st ->
                            st.objectives.forEach { obj ->
                                Text(
                                    "${if (obj.completed) "✅" else "•"} ${obj.text.ifBlank { obj.id }}",
                                    style = MaterialTheme.typography.bodyMedium,
                                    modifier = Modifier.padding(start = 12.dp),
                                )
                            }
                        }
                    }
                    Spacer(Modifier.height(8.dp))
                    Button(onClick = { viewModel.enroll(path.slug) }, modifier = Modifier.fillMaxWidth()) {
                        Text("Einschreiben")
                    }
                }
            }
        } ?: LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(ui.paths) { path ->
                Card(Modifier.fillMaxWidth()) {
                    Text(
                        path.title,
                        style = MaterialTheme.typography.titleMedium,
                        modifier = Modifier.padding(16.dp),
                    )
                }
            }
        }
    }
}