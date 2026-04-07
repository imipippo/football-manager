package com.footballmanager.app

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate

class MainActivity : ReactActivity() {

    override fun getMainComponentName(): String = "FootballManager"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        ReactActivityDelegate(this, getMainComponentName())
}
