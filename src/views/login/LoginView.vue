<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NCard, NInput, NButton, NSpace, NAlert, useMessage } from 'naive-ui'
import TurnstileWidget from '@/components/auth/TurnstileWidget.vue'
import { requestOtp, verifyOtp } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const auth = useAuthStore()

const email = ref('admin@varo.cloud')
const otp = ref('')
const step = ref<'email' | 'otp'>('email')
const loading = ref(false)
const turnstileToken = ref('')
const turnstileRef = ref<InstanceType<typeof TurnstileWidget> | null>(null)

const forbidden = route.query.error === 'forbidden'

function onTurnstileVerified(token: string) {
  turnstileToken.value = token
}

async function sendOtp() {
  if (!email.value.trim()) return message.warning('请输入邮箱')
  if (!turnstileToken.value) return message.warning('请完成人机验证')
  loading.value = true
  try {
    await requestOtp(email.value.trim(), turnstileToken.value)
    step.value = 'otp'
    message.success('验证码已发送（Mock：任意 6 位数字）')
  } catch (e) {
    message.error(e instanceof Error ? e.message : '发送失败')
  } finally {
    loading.value = false
    turnstileRef.value?.reset?.()
    turnstileToken.value = ''
  }
}

async function submitOtp() {
  if (!/^\d{6}$/.test(otp.value)) return message.warning('请输入 6 位验证码')
  if (!turnstileToken.value) return message.warning('请完成人机验证')
  loading.value = true
  try {
    await verifyOtp(email.value.trim(), otp.value, turnstileToken.value)
    const profile = await auth.loadProfile()
    if (profile.role !== 'admin') {
      await auth.signOut()
      message.error('非管理员账号，无权访问')
      return
    }
    const redirect = (route.query.redirect as string) || '/dashboard'
    router.replace(redirect)
  } catch (e) {
    message.error(e instanceof Error ? e.message : '验证失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (auth.hasToken()) router.replace('/dashboard')
})
</script>

<template>
  <div class="login-page">
    <NCard class="login-card" title="Varo Admin">
      <NAlert v-if="forbidden" type="error" style="margin-bottom: 16px">
        非管理员账号，无法登录管理后台
      </NAlert>
      <p class="subtitle">内部运营控制台</p>

      <template v-if="step === 'email'">
        <NInput v-model:value="email" placeholder="邮箱" style="margin-bottom: 12px" />
        <TurnstileWidget ref="turnstileRef" @verified="onTurnstileVerified" />
        <NButton type="primary" block :loading="loading" style="margin-top: 12px" @click="sendOtp">
          发送验证码
        </NButton>
      </template>

      <template v-else>
        <p class="hint">验证码已发送至 {{ email }}</p>
        <NInput v-model:value="otp" placeholder="6 位验证码" maxlength="6" style="margin-bottom: 12px" />
        <TurnstileWidget ref="turnstileRef" @verified="onTurnstileVerified" />
        <NSpace vertical style="margin-top: 12px; width: 100%">
          <NButton type="primary" block :loading="loading" @click="submitOtp">登录</NButton>
          <NButton block quaternary @click="step = 'email'">返回</NButton>
        </NSpace>
      </template>

      <p class="mock-hint">Mock 模式：使用 admin@varo.cloud 登录</p>
    </NCard>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a, #1e293b);
}
.login-card {
  width: 400px;
}
.subtitle {
  margin: 0 0 20px;
  color: #64748b;
  font-size: 14px;
}
.hint {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 12px;
}
.mock-hint {
  margin-top: 16px;
  font-size: 12px;
  color: #94a3b8;
  text-align: center;
}
</style>
