package de.chemielernen.app.ui.quiz

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun QuizScreen(
    viewModel: QuizViewModel,
    topicSlug: String,
    topicTitle: String,
) {
    val ui by viewModel.uiState.collectAsState()

    LaunchedEffect(topicSlug) {
        viewModel.loadTopic(topicSlug)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            "Übung: $topicTitle",
            style = MaterialTheme.typography.headlineSmall,
            modifier = Modifier.align(Alignment.Start),
        )
        Spacer(Modifier.height(8.dp))

        if (ui.offline) {
            AssistChip(
                onClick = {},
                label = { Text("Offline — ${ui.pendingCount} ausstehend") },
            )
            Spacer(Modifier.height(8.dp))
        }

        when {
            ui.loading -> CircularProgressIndicator()
            ui.error != null -> Text(ui.error.orEmpty(), color = MaterialTheme.colorScheme.error)
            ui.exercise != null -> ExerciseCard(
                question = ui.exercise!!.question,
                options = ui.exercise!!.options.map { it.text },
                selectedIndex = ui.selectedIndex,
                result = ui.gradeResult,
                onSelect = { index -> viewModel.submitAnswer(index) },
            )
        }
    }
}

@Composable
private fun ExerciseCard(
    question: String,
    options: List<String>,
    selectedIndex: Int?,
    result: de.chemielernen.app.data.api.GradeResponse?,
    onSelect: (Int) -> Unit,
) {
    Column {
        Card(Modifier.fillMaxWidth()) {
            Text(
                question,
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.padding(16.dp),
            )
        }
        Spacer(Modifier.height(16.dp))
        options.forEachIndexed { index, option ->
            val chosen = selectedIndex == index
            val correct = result != null && chosen && result.correct
            val wrong = result != null && chosen && !result.correct
            OutlinedCard(
                onClick = { onSelect(index) },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
            ) {
                Text(
                    "${'A' + index}) $option",
                    modifier = Modifier.padding(16.dp),
                    style = MaterialTheme.typography.bodyLarge,
                    color = when {
                        correct -> MaterialTheme.colorScheme.primary
                        wrong -> MaterialTheme.colorScheme.error
                        else -> MaterialTheme.colorScheme.onSurface
                    },
                )
            }
            Spacer(Modifier.height(4.dp))
        }
        Spacer(Modifier.height(16.dp))
        result?.let { res ->
            Spacer(Modifier.height(12.dp))
            Text(
                text = if (res.correct) "✓ Richtig! (100 Punkte)" else "✗ Falsch — ${res.explanation ?: ""}",
                style = MaterialTheme.typography.titleMedium,
                color = if (res.correct) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error,
            )
        }
    }
}