package de.chemielernen.app.ui.browse

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
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
fun HomeScreen(
    viewModel: BrowseViewModel,
    onTopicClick: (String, String) -> Unit,
) {
    val ui by viewModel.uiState.collectAsState()

    LaunchedEffect(Unit) {
        if (ui.states.isEmpty() && ui.topics.isEmpty()) viewModel.loadStates()
    }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("Lehrpläne", style = MaterialTheme.typography.titleLarge)
        Spacer(Modifier.height(8.dp))
        if (ui.loading && ui.states.isEmpty()) {
            CircularProgressIndicator(Modifier.align(Alignment.CenterHorizontally))
        }
        if (ui.error != null) {
            Text(ui.error.orEmpty(), color = MaterialTheme.colorScheme.error)
        }

        if (ui.states.isNotEmpty() && ui.selectedState == null) {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(ui.states) { state ->
                    Card(Modifier.fillMaxWidth().clickable { viewModel.selectState(state.stateAbbr) }) {
                        Text(
                            text = state.stateName ?: state.stateAbbr,
                            modifier = Modifier.padding(16.dp),
                            style = MaterialTheme.typography.titleMedium,
                        )
                    }
                }
            }
        } else if (ui.selectedState != null) {
            Row(
                Modifier.fillMaxWidth().padding(bottom = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text("Bundesland: ${ui.selectedState}", style = MaterialTheme.typography.bodyMedium)
                Spacer(Modifier.weight(1f))
                Text(
                    "zurück",
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.clickable { viewModel.clearSelection() },  // clears selection
                )
            }
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(ui.topics) { topic ->
                    Card(
                        Modifier.fillMaxWidth().clickable {
                            onTopicClick(topic.slug, topic.title)
                        },
                    ) {
                        Column(Modifier.padding(16.dp)) {
                            Text(topic.title, style = MaterialTheme.typography.titleMedium)
                            if (topic.grade != null) {
                                Text("Klasse ${topic.grade}", style = MaterialTheme.typography.bodySmall)
                            }
                            Text(
                                "${topic.objectiveCount} Lernziele",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.secondary,
                            )
                        }
                    }
                }
            }
        }
    }
}