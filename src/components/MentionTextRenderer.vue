<template>
    <span class="mention-text">
        <template v-for="(part, index) in parts" :key="index">
            <router-link
                v-if="part.type === 'mention'"
                class="post-mention"
                :to="`/tabs/perfil/${part.username}`"
                @click.stop
            >@{{ part.username }}</router-link>
            <a v-else-if="part.type === 'url'" class="post-link" :href="part.value" @click.stop.prevent="openUrl(part.value)">{{ part.value }}</a>
            <span v-else>{{ part.value }}</span>
        </template>
    </span>
</template>

<script>
import { Browser } from '@capacitor/browser'

export default {
    name: 'MentionTextRenderer',
    props: {
        text: { type: String, default: '' }
    },
    computed: {
        parts() {
            const tokenRegex = /(@([a-zA-Z0-9_]+)|https?:\/\/[^\s]+)/g
            const result = []
            let lastIndex = 0
            let match

            while ((match = tokenRegex.exec(this.text)) !== null) {
                if (match.index > lastIndex) result.push({ type: 'text', value: this.text.slice(lastIndex, match.index) })
                result.push(match[0].startsWith('@')
                    ? { type: 'mention', username: match[2] }
                    : { type: 'url', value: match[0] })
                lastIndex = tokenRegex.lastIndex
            }

            if (lastIndex < this.text.length) result.push({ type: 'text', value: this.text.slice(lastIndex) })
            return result
        }
    },
    methods: {
        async openUrl(url) {
            await Browser.open({ url })
        }
    }
}
</script>

<style scoped>
.post-mention {
    color: var(--ion-color-primary);
    font-weight: 700;
    text-decoration: none;
}

.post-link {
    color: var(--ion-color-primary);
    overflow-wrap: anywhere;
}
</style>