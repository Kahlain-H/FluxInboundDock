<template>
  <div id="app" class="fade-in">
    <!-- En-tête avec logo -->
    <header class="main-header">
      <div class="header-content">
        <div class="logo-section">
          <img src="/src/assets/logo1.png" alt="Logo" class="logo" />
          <h1>Flux Inbound Dock</h1>
        </div>
        <div class="header-info">
          <span class="system-status">🟢 Système en ligne</span>
          <span class="current-time">{{ currentTime }}</span>
        </div>
      </div>
    </header>

    <!-- Navigation par onglets -->
    <nav class="tab-navigation">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        :class="['tab-button', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        {{ tab.name }}
      </button>
    </nav>

    <!-- Contenu des onglets -->
    <main class="main-content">
      <!-- Flux Dock Inbound -->
      <div v-if="activeTab === 'flux-dock'" class="tab-content">
        <AdvancedFluxDock />
      </div>

      <!-- Flux Sections Organisées -->
      <div v-if="activeTab === 'flux-sections'" class="tab-content">
        <FluxDockSections />
      </div>

      <!-- Dashboard -->
      <div v-if="activeTab === 'dashboard'" class="tab-content">
        <Dashboard />
      </div>

      <!-- AFT Import -->
      <div v-if="activeTab === 'aft'" class="tab-content">
        <AFTImport />
      </div>

      <!-- FMC Import -->
      <div v-if="activeTab === 'fmc'" class="tab-content">
        <FMCImport />
      </div>

      <!-- Skynet Live Data -->
      <div v-if="activeTab === 'skynet'" class="tab-content">
        <SkynetData />
      </div>
    </main>
  </div>
</template>

<script>
import FluxDockInbound from './components/FluxDockInbound.vue'
import AdvancedFluxDock from './components/AdvancedFluxDock.vue'
import FluxDockSections from './components/FluxDockSections.vue'
import Dashboard from './components/Dashboard.vue'
import AFTImport from './components/AFTImport.vue'
import FMCImport from './components/FMCImport.vue'
import SkynetData from './components/SkynetData.vue'

export default {
  name: 'App',
  components: {
    FluxDockInbound,
    AdvancedFluxDock,
    FluxDockSections,
    Dashboard,
    AFTImport,
    FMCImport,
    SkynetData
  },
  data() {
    return {
      activeTab: 'flux-dock',
      currentTime: '',
      tabs: [
        {
          id: 'flux-dock',
          name: 'Flux_Dock_Inbound',
          icon: '🚛'
        },
        {
          id: 'flux-sections',
          name: 'Flux_Sections',
          icon: '📋'
        },
        {
          id: 'dashboard',
          name: 'Dashboard',
          icon: '📊'
        },
        {
          id: 'aft',
          name: 'AFT',
          icon: '📥'
        },
        {
          id: 'fmc',
          name: 'FMC',
          icon: '📄'
        },
        {
          id: 'skynet',
          name: 'Skynet',
          icon: '🌐'
        }
      ]
    }
  },
  methods: {
    updateTime() {
      const now = new Date();
      this.currentTime = now.toLocaleString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }
  },
  mounted() {
    this.updateTime();
    setInterval(this.updateTime, 1000);
  }
}
</script>