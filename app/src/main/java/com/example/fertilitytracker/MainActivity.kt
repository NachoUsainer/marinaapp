package com.example.fertilitytracker

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.example.fertilitytracker.ui.AppScaffold
import com.example.fertilitytracker.ui.theme.FertilityTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            FertilityTheme {
                AppScaffold()
            }
        }
    }
}
