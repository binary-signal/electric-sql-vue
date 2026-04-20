<script setup lang="ts">
import { ref } from 'vue'
import { useShape } from '@electric-sql/vue'

const table = ref('items')
const whereClause = ref('')

const { data, isLoading, isError, error, lastSyncedAt } = useShape(() => ({
  url: 'http://localhost:3000/v1/shape',
  params: {
    table: table.value,
    ...(whereClause.value ? { where: whereClause.value } : {}),
  },
}))
</script>

<template>
  <div style="font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem;">
    <h1>Electric SQL Vue Playground</h1>

    <div style="margin-bottom: 1rem;">
      <label>
        Table:
        <input v-model="table" placeholder="table name" />
      </label>
    </div>

    <div style="margin-bottom: 1rem;">
      <label>
        Where:
        <input v-model="whereClause" placeholder="e.g. id > 5" />
      </label>
    </div>

    <div v-if="isLoading" style="color: #666;">Loading...</div>
    <div v-else-if="isError" style="color: red;">Error: {{ error }}</div>
    <div v-else>
      <p style="color: #666; font-size: 0.875rem;">
        {{ data.length }} rows | Last synced: {{ lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString() : 'never' }}
      </p>
      <pre style="background: #f5f5f5; padding: 1rem; overflow: auto; max-height: 400px;">{{ JSON.stringify(data, null, 2) }}</pre>
    </div>
  </div>
</template>
