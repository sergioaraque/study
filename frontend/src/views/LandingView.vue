<template>
  <div class="min-h-screen bg-[var(--color-surface-2)] text-[var(--color-text)]">

    <!-- Nav -->
    <header class="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]/80 backdrop-blur-sm sticky top-0 z-10">
      <div class="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
            <BookOpen :size="15" class="text-white" />
          </div>
          <span class="text-sm font-bold text-[var(--color-text)]">Study Planner</span>
          <span class="hidden sm:block text-xs text-[var(--color-text-muted)] border border-[var(--color-border)] rounded-full px-2 py-0.5">UNED</span>
        </div>
        <RouterLink to="/login" class="btn-primary text-sm">
          Iniciar sesión
        </RouterLink>
      </div>
    </header>

    <!-- Hero -->
    <section class="max-w-5xl mx-auto px-5 pt-20 pb-16 text-center">
      <div class="inline-flex items-center gap-2 text-xs font-medium text-[var(--color-primary)] bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 rounded-full px-3 py-1 mb-6">
        <Sparkles :size="12" />
        Diseñado para estudiantes de la UNED
      </div>
      <h1 class="text-4xl sm:text-5xl font-bold text-[var(--color-text)] leading-tight tracking-tight mb-5">
        Organiza tu semestre.<br>
        <span class="text-[var(--color-primary)]">Supera tus asignaturas.</span>
      </h1>
      <p class="text-base sm:text-lg text-[var(--color-text-muted)] max-w-2xl mx-auto mb-8 leading-relaxed">
        Gestiona asignaturas, temas y tareas. Planifica tu semana. Controla tus notas y el progreso del grado.
        Todo en un solo lugar, pensado para la forma de estudiar en la UNED.
      </p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
        <RouterLink to="/login" class="btn-primary px-6 py-2.5 text-base font-semibold">
          Empezar ahora — es gratis
        </RouterLink>
        <a href="#features" class="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors flex items-center gap-1">
          Ver funcionalidades <ChevronDown :size="14" />
        </a>
      </div>
    </section>

    <!-- App preview (mockup) -->
    <section class="max-w-5xl mx-auto px-5 pb-20">
      <div class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-2xl">
        <!-- Fake browser chrome -->
        <div class="flex items-center gap-1.5 px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <div class="w-3 h-3 rounded-full bg-[var(--color-border)]" />
          <div class="w-3 h-3 rounded-full bg-[var(--color-border)]" />
          <div class="w-3 h-3 rounded-full bg-[var(--color-border)]" />
          <div class="ml-3 flex-1 h-5 rounded bg-[var(--color-border)]/50 max-w-60 text-xs text-[var(--color-text-muted)] flex items-center px-2">
            study.sergioaraque.com.es
          </div>
        </div>
        <!-- Fake app layout -->
        <div class="flex h-64 sm:h-80">
          <!-- Sidebar mockup -->
          <div class="w-40 shrink-0 border-r border-[var(--color-border)] p-3 space-y-1 hidden sm:block">
            <div v-for="item in mockNav" :key="item.label"
              class="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs"
              :class="item.active ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'">
              <component :is="item.icon" :size="12" />
              {{ item.label }}
            </div>
          </div>
          <!-- Main content mockup -->
          <div class="flex-1 p-4 space-y-3 overflow-hidden">
            <div class="text-xs font-semibold text-[var(--color-text)]">Mis asignaturas — 2024-25 S1</div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div v-for="card in mockCards" :key="card.name"
                class="rounded-lg border border-[var(--color-border)] p-2.5 space-y-1.5">
                <div class="text-xs font-medium text-[var(--color-text)] truncate">{{ card.name }}</div>
                <div class="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
                  <div class="h-full rounded-full bg-[var(--color-primary)]" :style="{ width: card.pct + '%' }" />
                </div>
                <div class="text-[10px] text-[var(--color-text-muted)]">{{ card.pct }}% completado · {{ card.ects }} ECTS</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section id="features" class="max-w-5xl mx-auto px-5 pb-20">
      <h2 class="text-2xl font-bold text-[var(--color-text)] text-center mb-2">Todo lo que necesitas</h2>
      <p class="text-sm text-[var(--color-text-muted)] text-center mb-10">Herramientas diseñadas para el modelo de estudio a distancia de la UNED.</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="feat in features" :key="feat.title"
          class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div class="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
            :style="{ backgroundColor: feat.color + '18' }">
            <component :is="feat.icon" :size="18" :style="{ color: feat.color }" />
          </div>
          <h3 class="text-sm font-semibold text-[var(--color-text)] mb-1">{{ feat.title }}</h3>
          <p class="text-xs text-[var(--color-text-muted)] leading-relaxed">{{ feat.desc }}</p>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="max-w-5xl mx-auto px-5 pb-20">
      <h2 class="text-2xl font-bold text-[var(--color-text)] text-center mb-10">Cómo funciona</h2>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div v-for="(step, i) in steps" :key="i" class="text-center">
          <div class="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 flex items-center justify-center mx-auto mb-4 text-sm font-bold text-[var(--color-primary)]">
            {{ i + 1 }}
          </div>
          <h3 class="text-sm font-semibold text-[var(--color-text)] mb-1">{{ step.title }}</h3>
          <p class="text-xs text-[var(--color-text-muted)] leading-relaxed">{{ step.desc }}</p>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="max-w-5xl mx-auto px-5 pb-20">
      <div class="rounded-2xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 p-10 text-center">
        <h2 class="text-2xl font-bold text-[var(--color-text)] mb-2">¿Listo para organizarte?</h2>
        <p class="text-sm text-[var(--color-text-muted)] mb-6">Crea tu cuenta y empieza a gestionar el semestre en minutos.</p>
        <RouterLink to="/login" class="btn-primary px-8 py-2.5 text-base font-semibold">
          Acceder
        </RouterLink>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-[var(--color-border)] max-w-5xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <div class="w-5 h-5 rounded bg-[var(--color-primary)] flex items-center justify-center">
          <BookOpen :size="10" class="text-white" />
        </div>
        <span class="text-xs text-[var(--color-text-muted)]">Study Planner · UNED</span>
      </div>
      <p class="text-xs text-[var(--color-text-muted)]">Construido con Vue 3 · Appwrite · Tailwind CSS</p>
    </footer>

  </div>
</template>

<script setup lang="ts">
import {
  BookOpen, CalendarDays, BarChart2, GraduationCap,
  ChevronDown, Sparkles, LayoutDashboard,
  ListChecks, ClipboardList, TrendingUp,
} from 'lucide-vue-next'

const mockNav = [
  { label: 'Dashboard', icon: LayoutDashboard, active: false },
  { label: 'Asignaturas', icon: BookOpen, active: true },
  { label: 'Planificador', icon: CalendarDays, active: false },
  { label: 'Estadísticas', icon: TrendingUp, active: false },
  { label: 'Expediente', icon: GraduationCap, active: false },
]

const mockCards = [
  { name: 'Bases de Datos I', pct: 75, ects: 6 },
  { name: 'Redes y Sistemas', pct: 40, ects: 6 },
  { name: 'Cálculo', pct: 90, ects: 6 },
  { name: 'Programación II', pct: 55, ects: 6 },
  { name: 'Estadística', pct: 20, ects: 6 },
  { name: 'Inglés Técnico', pct: 100, ects: 3 },
]

const features = [
  {
    title: 'Gestión de asignaturas',
    desc: 'Crea y organiza tus asignaturas por semestre. Biblioteca de asignaturas para las pendientes de matricular.',
    icon: BookOpen,
    color: '#6366f1',
  },
  {
    title: 'Planificador semanal y mensual',
    desc: 'Arrastra temas a los días de la semana o del mes. Controla las horas disponibles y detecta sobrecargas.',
    icon: CalendarDays,
    color: '#22c55e',
  },
  {
    title: 'Seguimiento de temas',
    desc: 'Divide cada asignatura en temas, marca su progreso y registra las horas de estudio reales.',
    icon: ListChecks,
    color: '#f59e0b',
  },
  {
    title: 'PECs y exámenes',
    desc: 'Gestiona entregas de PECs con fechas límite y notificaciones. Registra convocatorias y notas.',
    icon: ClipboardList,
    color: '#ec4899',
  },
  {
    title: 'Estadísticas detalladas',
    desc: 'Visualiza el progreso por asignatura, horas estudiadas, nota media de PECs y comparativa de semestres.',
    icon: BarChart2,
    color: '#06b6d4',
  },
  {
    title: 'Expediente académico',
    desc: 'Vista global con todos los créditos, notas finales, media ponderada y porcentaje del grado superado.',
    icon: GraduationCap,
    color: '#8b5cf6',
  },
]

const steps = [
  {
    title: 'Crea tu semestre',
    desc: 'Define el semestre activo, tus asignaturas y el horario semanal disponible para estudiar.',
  },
  {
    title: 'Organiza los temas',
    desc: 'Importa el índice de cada asignatura y planifica qué temas estudiar cada día arrastrándolos al planificador.',
  },
  {
    title: 'Sigue tu progreso',
    desc: 'Marca temas completados, registra notas de PECs y exámenes, y observa cómo avanza tu expediente.',
  },
]
</script>
