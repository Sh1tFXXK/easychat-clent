<template>
  <transition
    :name="transitionName"
    :mode="mode"
    @before-enter="beforeEnter"
    @enter="enter"
    @after-enter="afterEnter"
    @before-leave="beforeLeave"
    @leave="leave"
    @after-leave="afterLeave"
  >
    <slot />
  </transition>
</template>

<script>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

export default {
  name: 'PageTransition',
  props: {
    name: {
      type: String,
      default: 'fade'
    },
    mode: {
      type: String,
      default: 'out-in'
    },
    duration: {
      type: Number,
      default: 300
    }
  },
  emits: [
    'before-enter',
    'enter', 
    'after-enter',
    'before-leave',
    'leave',
    'after-leave'
  ],
  setup(props, { emit }) {
    const route = useRoute()
    const transitionName = ref(props.name)

    // 根据路由变化动态设置过渡效果
    watch(route, (to, from) => {
      // 定义页面层级
      const pageLevel = {
        '/login': 1,
        '/register': 1,
        '/findPassword': 1,
        '/home': 2,
        '/about': 1
      }

      const toLevel = pageLevel[to.path] || 2
      const fromLevel = pageLevel[from.path] || 2

      // 根据页面层级决定过渡方向
      if (toLevel > fromLevel) {
        transitionName.value = 'slide-left'
      } else if (toLevel < fromLevel) {
        transitionName.value = 'slide-right'
      } else {
        transitionName.value = 'fade'
      }
    })

    const beforeEnter = (el) => {
      emit('before-enter', el)
    }

    const enter = (el, done) => {
      emit('enter', el, done)
      setTimeout(done, props.duration)
    }

    const afterEnter = (el) => {
      emit('after-enter', el)
    }

    const beforeLeave = (el) => {
      emit('before-leave', el)
    }

    const leave = (el, done) => {
      emit('leave', el, done)
      setTimeout(done, props.duration)
    }

    const afterLeave = (el) => {
      emit('after-leave', el)
    }

    return {
      transitionName,
      beforeEnter,
      enter,
      afterEnter,
      beforeLeave,
      leave,
      afterLeave
    }
  }
}
</script>

<style scoped>
/* 淡入淡出效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 左滑效果 */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s ease;
}

.slide-left-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

/* 右滑效果 */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}

.slide-right-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* 缩放效果 */
.scale-enter-active,
.scale-leave-active {
  transition: all 0.3s ease;
}

.scale-enter-from,
.scale-leave-to {
  transform: scale(0.9);
  opacity: 0;
}

/* 向上滑动效果 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  transform: translateY(100%);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>