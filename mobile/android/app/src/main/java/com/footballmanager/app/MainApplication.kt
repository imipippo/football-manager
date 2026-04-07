package com.footballmanager.app

import android.app.Application
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader

class MainApplication : Application(), ReactApplication {

    override val reactNativeHost: ReactNativeHost =
        object : DefaultReactNativeHost(this) {
            override fun getUseDeveloperSupport(): Boolean = true

            override fun getPackages(): List<ReactPackage> = listOf()

            override fun getJSMainModuleName(): String = "index"

            override val isHermesEnabled: Boolean? = true
        }

    override fun onCreate() {
        super.onCreate()
        SoLoader.init(this, false)
    }
}
