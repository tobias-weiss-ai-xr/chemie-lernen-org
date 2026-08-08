package de.chemielernen.app.ui.fsrs

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.OutlinedButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun FsrsScreen(viewModel: FsrsViewModel) {
    val ui by viewModel.uiState.collectAsState()

    LaunchedEffect(Unit) { viewModel.load() }

    Column(
        Modifier.fillMaxSize().padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text("Wiederholen (FSRS)", style = MaterialTheme.typography.headlineSmall)
        Spacer(Modifier.height(16.dp))

        when {
            ui.loading -> CircularProgressIndicator()
            ui.error != null -> Text(ui.error.orEmpty(), color = MaterialTheme.colorScheme.error)
            ui.current == null -> Text("Keine Karten zur Wiederholung fällig.")
            else -> {
                val card = ui.current!!
                Text("Karte ${ui.currentIndex + 1}/${ui.cards.size}")
                Spacer(Modifier.height(12.dp))
                Card(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(16.dp)) {
                        if (!ui.revealAnswer) {
                            Text("Frage:", style = MaterialTheme.typography.bodySmall)
                            Text(card.question ?: card.questionId?.toString() ?: "", style = MaterialTheme.typography.titleMedium)
                        } else {
                            Text("Antwort:", style = MaterialTheme.typography.bodySmall)
                            Text(card.answer ?: "", style = MaterialTheme.typography.titleLarge)
                        }
                    }
                }
                Spacer(Modifier.height(16.dp))
                if (!ui.revealAnswer) {
                    Button(onClick = { viewModel.reveal() }, modifier = Modifier.fillMaxWidth()) {
                        Text("Antwort anzeigen")
                    }
                } else {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf(1 to "Schwer", 2 to "Gut", 3 to "Leicht", 4 to "Sehr leicht").forEach { (rating, label) ->
                            OutlinedButton(
                                onClick = { viewModel.review(rating) },
                                modifier = Modifier.weight(1f),
                            ) { Text(label) }
                        }
                    }
                }
            }
        }
    }
}