package com.example.fertilitytracker.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.EditCalendar
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material.icons.outlined.ShowChart
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.example.fertilitytracker.ui.screens.CalendarScreen
import com.example.fertilitytracker.ui.screens.DailyLogScreen
import com.example.fertilitytracker.ui.screens.SettingsScreen
import com.example.fertilitytracker.ui.screens.TrendsScreen

private sealed class Tab(val route: String, val label: String, val icon: ImageVector) {
    data object Calendar : Tab("calendar", "Calendario", Icons.Outlined.CalendarMonth)
    data object Log : Tab("log", "Registro", Icons.Outlined.EditCalendar)
    data object Trends : Tab("trends", "Tendencias", Icons.Outlined.ShowChart)
    data object Settings : Tab("settings", "Ajustes", Icons.Outlined.Settings)
}

private val tabs = listOf(Tab.Calendar, Tab.Log, Tab.Trends, Tab.Settings)

@Composable
fun AppScaffold(
    viewModel: FertilityViewModel = viewModel(factory = FertilityViewModel.Factory)
) {
    val navController = rememberNavController()
    val backStack by navController.currentBackStackEntryAsState()
    val currentRoute = backStack?.destination?.route

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        bottomBar = {
            NavigationBar(
                containerColor = MaterialTheme.colorScheme.surface,
                tonalElevation = 0.dp
            ) {
                tabs.forEach { tab ->
                    val selected = currentRoute == tab.route
                    NavigationBarItem(
                        selected = selected,
                        onClick = {
                            navController.navigate(tab.route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = { Icon(tab.icon, contentDescription = tab.label) },
                        label = { Text(tab.label) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = MaterialTheme.colorScheme.primary,
                            selectedTextColor = MaterialTheme.colorScheme.primary,
                            indicatorColor = MaterialTheme.colorScheme.surface,
                            unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                            unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    )
                }
            }
        }
    ) { innerPadding ->
        val uiState by viewModel.uiState.collectAsState()
        val selectedEntry by viewModel.selectedEntry.collectAsState()
        val recent by viewModel.recentEntries.collectAsState()
        val settings by viewModel.settings.collectAsState()
        val activeAnalysis by viewModel.activeAnalysis.collectAsState()

        NavHost(
            navController = navController,
            startDestination = Tab.Calendar.route,
            modifier = Modifier
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
        ) {
            composable(Tab.Calendar.route) {
                CalendarScreen(
                    state = uiState,
                    onSelectDate = viewModel::selectDate,
                    onShowMonth = viewModel::showMonth
                )
            }
            composable(Tab.Log.route) {
                DailyLogScreen(
                    selectedDate = uiState.selectedDate,
                    entry = selectedEntry,
                    onSave = { temp, mucus, flow, isStart, notes ->
                        viewModel.saveEntry(uiState.selectedDate, temp, mucus, flow, isStart, notes)
                    },
                    onClear = { viewModel.clearEntry(uiState.selectedDate) }
                )
            }
            composable(Tab.Trends.route) {
                TrendsScreen(entries = recent, activeAnalysis = activeAnalysis)
            }
            composable(Tab.Settings.route) {
                SettingsScreen(
                    settings = settings,
                    onCycleLengthChange = viewModel::updateCycleLength,
                    onPeriodLengthChange = viewModel::updatePeriodLength,
                    onLutealLengthChange = viewModel::updateLutealLength
                )
            }
        }
    }
}

