<template>
    <div ref="root" class="mention-input">
        <component
            :is="multiline ? 'ion-textarea' : 'ion-input'"
            ref="input"
            v-model="value"
            :placeholder="placeholder"
            class="post-input"
            :disabled="disabled"
            :rows="multiline ? rows : undefined"
            :auto-grow="multiline && autoGrow"
            :class="inputClass"
            @ionInput="handleInput"
            @keydown="handleKeydown"
            @ionBlur="handleBlur"
        />

        <Teleport to="body">
            <div
                v-if="isOpen"
                ref="dropdown"
                class="mention-dropdown"
                :style="dropdownStyle"
                role="listbox"
                aria-label="Amigos para mencionar"
            >
                <div v-if="isLoading" class="mention-status">
                    <ion-spinner name="crescent" />
                    <span>Buscando amigos...</span>
                </div>
                <div v-else-if="errorMessage" class="mention-status mention-error">{{ errorMessage }}</div>
                <div v-else-if="friends.length === 0" class="mention-status">No se encontraron amigos</div>
                <button
                    v-for="(friend, index) in friends"
                    v-else
                    :key="friend.id"
                    type="button"
                    class="mention-option"
                    :class="{ 'is-active': index === activeIndex }"
                    role="option"
                    :aria-selected="index === activeIndex"
                    @mousedown.prevent="selectFriend(friend)"
                >
                    <ion-avatar>
                        <img v-if="friend.imagen_url" :src="friend.imagen_url" :alt="friend.name || friend.username" />
                        <ion-icon v-else :icon="personCircle" />
                    </ion-avatar>
                    <span class="mention-user-copy">
                        <strong>@{{ friend.username }}</strong>
                        <small>{{ friend.name }}</small>
                    </span>
                </button>
            </div>
        </Teleport>
    </div>
</template>

<script>
import { IonAvatar, IonIcon, IonInput, IonSpinner, IonTextarea } from '@ionic/vue'
import { personCircle } from 'ionicons/icons'
import mentionsService from '@/services/mentionsService'

export default {
    name: 'MentionInput',
    components: { IonAvatar, IonIcon, IonInput, IonSpinner, IonTextarea },
    props: {
        modelValue: { type: String, default: '' },
        placeholder: { type: String, default: '' },
        disabled: { type: Boolean, default: false },
        multiline: { type: Boolean, default: false },
        rows: { type: Number, default: 3 },
        autoGrow: { type: Boolean, default: false },
        inputClass: { type: [String, Array, Object], default: 'post-input' }
    },
    emits: ['update:modelValue', 'enter'],
    data() {
        return {
            personCircle,
            value: this.modelValue,
            friends: [],
            activeIndex: 0,
            isLoading: false,
            isOpen: false,
            errorMessage: '',
            debounceTimer: null,
            requestId: 0,
            dropdownStyle: {}
        }
    },
    watch: {
        modelValue(nextValue) {
            if (nextValue !== this.value) this.value = nextValue
        },
        value(nextValue) {
            this.$emit('update:modelValue', nextValue)
        }
    },
    mounted() {
        document.addEventListener('mousedown', this.handleOutsideClick)
        window.addEventListener('resize', this.updateDropdownPosition)
        window.addEventListener('scroll', this.updateDropdownPosition, true)
    },
    beforeUnmount() {
        document.removeEventListener('mousedown', this.handleOutsideClick)
        window.removeEventListener('resize', this.updateDropdownPosition)
        window.removeEventListener('scroll', this.updateDropdownPosition, true)
        clearTimeout(this.debounceTimer)
    },
    methods: {
        async handleInput() {
            const input = await this.inputElement()
            const cursorPosition = input?.selectionStart ?? this.value.length
            const textBeforeCursor = this.value.slice(0, cursorPosition)
            const match = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z0-9_]*)$/)

            clearTimeout(this.debounceTimer)
            this.errorMessage = ''
            this.activeIndex = 0

            if (!match) {
                this.closeDropdown()
                return
            }

            const query = match[1]
            this.isOpen = true
            this.isLoading = true
            this.$nextTick(this.updateDropdownPosition)
            const currentRequestId = ++this.requestId
            this.debounceTimer = setTimeout(() => this.searchFriends(query, currentRequestId), 300)
        },
        async searchFriends(query, currentRequestId) {
            try {
                const friends = await mentionsService.searchFriends(query)
                if (currentRequestId !== this.requestId) return
                this.friends = friends
            } catch (error) {
                if (currentRequestId !== this.requestId) return
                this.friends = []
                this.errorMessage = 'No se pudo buscar amigos'
            } finally {
                if (currentRequestId === this.requestId) this.isLoading = false
            }
        },
        async inputElement() {
            return this.$refs.input?.getInputElement?.() || this.$refs.input?.$el?.querySelector('input')
        },
        updateDropdownPosition() {
            if (!this.isOpen || !this.$refs.root) return

            const rect = this.$refs.root.getBoundingClientRect()
            const margin = 8
            const spaceBelow = window.innerHeight - rect.bottom - margin
            const spaceAbove = rect.top - margin
            const openAbove = spaceBelow < 180 && spaceAbove > spaceBelow
            const maxHeight = Math.max(96, Math.min(240, openAbove ? spaceAbove : spaceBelow))

            this.dropdownStyle = {
                top: `${openAbove ? Math.max(margin, rect.top - maxHeight - 6) : rect.bottom + 6}px`,
                left: `${Math.max(margin, rect.left)}px`,
                width: `${Math.min(rect.width, window.innerWidth - (Math.max(margin, rect.left) + margin))}px`,
                maxHeight: `${maxHeight}px`
            }
        },
        async selectFriend(friend) {
            const input = await this.inputElement()
            const cursorPosition = input?.selectionStart ?? this.value.length
            const textBeforeCursor = this.value.slice(0, cursorPosition)
            const mentionStart = textBeforeCursor.search(/@[a-zA-Z0-9_]*$/)
            if (mentionStart < 0) return

            const beforeMention = this.value.slice(0, mentionStart)
            const afterCursor = this.value.slice(cursorPosition)
            this.value = `${beforeMention}@${friend.username} ${afterCursor}`
            this.closeDropdown()
            this.$nextTick(async () => {
                const updatedInput = await this.inputElement()
                const nextCursor = beforeMention.length + friend.username.length + 2
                updatedInput?.setSelectionRange(nextCursor, nextCursor)
                updatedInput?.focus()
            })
        },
        handleKeydown(event) {
            if (event.key === 'Enter' && !this.isOpen) {
                event.preventDefault()
                this.$emit('enter')
                return
            }
            if (!this.isOpen) return
            if (event.key === 'Escape') {
                event.preventDefault()
                this.closeDropdown()
            } else if (event.key === 'ArrowDown') {
                event.preventDefault()
                this.activeIndex = Math.min(this.activeIndex + 1, this.friends.length - 1)
            } else if (event.key === 'ArrowUp') {
                event.preventDefault()
                this.activeIndex = Math.max(this.activeIndex - 1, 0)
            } else if (event.key === 'Enter' && this.friends[this.activeIndex]) {
                event.preventDefault()
                this.selectFriend(this.friends[this.activeIndex])
            }
        },
        handleBlur() {
            window.setTimeout(() => {
                if (!this.$refs.root?.contains(document.activeElement)) this.closeDropdown()
            }, 0)
        },
        handleOutsideClick(event) {
            if (!this.$refs.root?.contains(event.target) && !this.$refs.dropdown?.contains(event.target)) {
                this.closeDropdown()
            }
        },
        closeDropdown() {
            this.isOpen = false
            this.isLoading = false
            this.friends = []
            this.requestId++
        }
    }
}
</script>

<style scoped>
.mention-input {
    position: relative;
    flex: 1;
}

.mention-dropdown {
    position: fixed;
    z-index: 10000;
    overflow-y: auto;
    padding: 6px;
    border: 1px solid var(--ion-color-light-shade);
    border-radius: 12px;
    background: var(--ion-background-color);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
}

.mention-option {
    display: flex;
    align-items: center;
    width: 100%;
    gap: 10px;
    padding: 8px;
    border: 0;
    border-radius: 8px;
    color: var(--ion-text-color);
    background: transparent;
    text-align: left;
}

.mention-option.is-active,
.mention-option:hover {
    background: var(--ion-color-light);
}

.mention-option ion-avatar {
    width: 34px;
    height: 34px;
    flex: 0 0 34px;
}

.mention-user-copy {
    display: flex;
    min-width: 0;
    flex-direction: column;
}

.mention-user-copy strong {
    color: var(--ion-color-primary);
}

.mention-user-copy small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.mention-status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 44px;
    color: var(--ion-color-medium);
    font-size: 0.9rem;
}

.mention-error {
    color: var(--ion-color-danger);
}
</style>