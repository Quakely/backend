import com.github.jengelman.gradle.plugins.shadow.tasks.ShadowJar
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    java
    application
    kotlin("jvm") version "2.0.0-RC3"
    kotlin("plugin.serialization") version "2.0.0-RC3"
    id("com.github.johnrengelman.shadow") version "7.1.2"
}

group = "dev.internalizable.quakely"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
}

dependencies {
    compileOnly("org.apache.flink:flink-streaming-java:1.19.0")

    implementation("org.apache.flink:flink-clients:1.19.0")
    implementation("org.apache.flink:flink-connector-base:1.19.0")
    implementation("org.apache.flink:flink-connector-kafka:3.1.0-1.18")

    implementation("io.github.elki-project:elki:0.8.0")
    implementation("org.apache.kafka:kafka-clients:3.4.0")

    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.0-RC")
    testImplementation(kotlin("test"))
}

tasks.test {
    useJUnitPlatform()
}

kotlin {
    jvmToolchain(jdkVersion = 11)
}

tasks.withType<JavaCompile> {
    options.compilerArgs.add("-parameters")
    options.fork()
    options.encoding = "UTF-8"
}

tasks.withType<ShadowJar> {
    archiveClassifier.set("")
    archiveFileName.set(
        "job.jar"
    )
}

application {
    mainClass.set("dev.internalizable.quakely.JobKt")
}

tasks.withType<KotlinCompile> {
    kotlinOptions.javaParameters = true
    kotlinOptions.jvmTarget = "11"
}
