# Add project specific ProGuard rules here.
# Retrofit + kotlinx.serialization:
-keepattributes Signature, InnerClasses, EnclosingMethod
-keepattributes RuntimeVisibleAnnotations, RuntimeVisibleParameterAnnotations
-keepclassmembers,allowshrinking,allowobfuscation interface * {
    @retrofit2.http.* <methods>;
}
-keepclassmembers class io.ktor.** { *; }
-dontwarn okhttp3.internal.platform.**
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**

# kotlinx.serialization
-keep,includedescriptorclasses class de.chemielernen.app.**$$serializer { *; }
-keepclassmembers class de.chemielernen.app.** {
    *** Companion;
}
-keepclasseswithmembers class de.chemielernen.app.** {
    kotlinx.serialization.KSerializer serializer(...);
}