plugins { id("com.android.library") version "8.9.1" }
android {
    namespace = "ch.red.ecosystem.identity"
    compileSdk = 35
    defaultConfig { minSdk = 26 }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
}
dependencies { testImplementation("junit:junit:4.13.2"); testImplementation("org.json:json:20240303") }
