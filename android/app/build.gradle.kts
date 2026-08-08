import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.ksp)
}

android {
    namespace = "de.chemielernen.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "de.chemielernen.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        // API base URL: override with -PapiBaseUrl=https://... on the command line.
        val apiBaseUrl = (project.findProperty("apiBaseUrl") as String?) ?: "https://chemie-lernen.org"
        buildConfigField("String", "API_BASE_URL", "\"$apiBaseUrl\"")
    }

    signingConfigs {
        // Read keystore settings from -P props or environment (CI secrets/local shell).
        // Only when ALL four are present AND the keystore file exists is a signing
        // config created; otherwise release stays unsigned (app-release-unsigned.apk).
        val storeFile = providers.gradleProperty("CHEMIE_RELEASE_STORE_FILE")
            .orElse(providers.environmentVariable("CHEMIE_RELEASE_STORE_FILE"))
            .orNull
        val storePassword = providers.gradleProperty("CHEMIE_RELEASE_STORE_PASSWORD")
            .orElse(providers.environmentVariable("CHEMIE_RELEASE_STORE_PASSWORD"))
            .orNull
        val keyAlias = providers.gradleProperty("CHEMIE_RELEASE_KEY_ALIAS")
            .orElse(providers.environmentVariable("CHEMIE_RELEASE_KEY_ALIAS"))
            .orNull
        val keyPassword = providers.gradleProperty("CHEMIE_RELEASE_KEY_PASSWORD")
            .orElse(providers.environmentVariable("CHEMIE_RELEASE_KEY_PASSWORD"))
            .orNull
        if (
            !storeFile.isNullOrBlank() &&
            file(storeFile).exists() &&
            !storePassword.isNullOrBlank() &&
            !keyAlias.isNullOrBlank() &&
            !keyPassword.isNullOrBlank()
        ) {
            create("release") {
                this.storeFile = file(storeFile)
                this.storePassword = storePassword
                this.keyAlias = keyAlias
                this.keyPassword = keyPassword
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            signingConfig = signingConfigs.findByName("release") // null → unsigned
        }
        debug {
            buildConfigField("String", "API_BASE_URL", "\"${project.findProperty("apiBaseUrlDev") ?: "http://10.0.2.2:3001"}\"")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
    testOptions {
        unitTests.isReturnDefaultValues = true
        unitTests.isIncludeAndroidResources = false
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17)
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.material.icons)
    implementation(libs.androidx.navigation.compose)

    // Networking
    implementation(libs.retrofit)
    implementation(libs.okhttp)
    implementation(libs.okhttp.logging)
    implementation(libs.retrofit.kotlinx.serialization)
    implementation(libs.kotlinx.serialization.json)
    implementation(libs.kotlinx.coroutines.android)

    // Persistence
    implementation(libs.room.runtime)
    implementation(libs.room.ktx)
    ksp(libs.room.compiler)
    implementation(libs.datastore.preferences)
    implementation(libs.security.crypto)

    debugImplementation(libs.androidx.ui.tooling)

    // Tests
    testImplementation(libs.junit)
    testImplementation(libs.truth)
    testImplementation(libs.mockk)
    testImplementation(libs.kotlinx.coroutines.test)
    testImplementation(libs.androidx.core.testing)
}