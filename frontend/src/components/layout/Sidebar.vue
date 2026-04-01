<template>
  <aside
    class="flex flex-col w-60 shrink-0 bg-[var(--color-surface)] border-r border-[var(--color-border)] transition-all duration-200"
    :class="{ '-ml-60': !open }"
  >
    <div class="px-4 py-5 border-b border-[var(--color-border)]">
      <span class="text-sm font-bold text-[var(--color-text)]">Study Planner</span>
      <span class="block text-xs text-[var(--color-text-muted)]">UNED</span>
    </div>

    <nav class="flex-1 px-2 py-4 space-y-1">
      <RouterLink v-for="item in navItems" :key="item.to" :to="item.to" class="nav-link">
        <component :is="item.icon" :size="16" />
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>

    <div class="px-2 py-4 border-t border-[var(--color-border)]">
      <button @click="auth.logout(); router.push('/login')" class="nav-link w-full text-[var(--color-text-muted)]">
        <LogOut :size="16" />
        <span>Cerrar sesión</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  LayoutDashboard, BookOpen, CalendarDays, BarChart2,
  History, Bell, LogOut, TrendingUp, GraduationCap,
} from 'lucide-vue-next'

defineProps<{ open: boolean }>()

const router = useRouter()
const auth = useAuthStore()

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/subjects', label: 'Asignaturas', icon: BookOpen },
  { to: '/planner', label: 'Planificador', icon: CalendarDays },
  { to: '/plan-vs-reality', label: 'Plan vs Real', icon: BarChart2 },
  { to: '/history', label: 'Historial', icon: History },
  { to: '/stats', label: 'Estadísticas', icon: TrendingUp },
  { to: '/notifications', label: 'Notificaciones', icon: Bell },
  { to: '/expediente', label: 'Expediente', icon: GraduationCap },
]
</script>

<style scoped>
.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  transition: background-color 0.15s, color 0.15s;
  text-decoration: none;
}
.nav-link:hover,
.router-link-active.nav-link {
  background-color: var(--color-surface-2);
  color: var(--color-text);
}
</style>
