package de.chemielernen.app.data.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
    entities = [
        CachedState::class,
        CachedTopic::class,
        CachedObjective::class,
        PendingGrade::class,
        CachedExercise::class,
    ],
    version = 1,
    exportSchema = false,
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun browseDao(): BrowseDao
    abstract fun gradeQueueDao(): GradeQueueDao
    abstract fun exerciseCacheDao(): ExerciseCacheDao

    companion object {
        @Volatile
        private var instance: AppDatabase? = null

        fun get(context: Context): AppDatabase =
            instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "chemie-lernen.db",
                ).build().also { instance = it }
            }
    }
}