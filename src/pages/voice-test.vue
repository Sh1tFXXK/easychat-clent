<template>
  <div class="voice-test">
    <h2>语音功能测试页面</h2>
    
    <div class="test-section">
      <h3>录音测试</h3>
      <button 
        @mousedown="startRecording"
        @mouseup="stopRecording"
        @mouseleave="stopRecording"
        :class="{ recording: isRecording }"
        class="record-btn"
      >
        {{ isRecording ? '录音中...' : '按住录音' }}
      </button>
      <p v-if="recordingDuration > 0">录音时长: {{ recordingDuration }}秒</p>
    </div>

    <div class="test-section">
      <h3>语音消息列表</h3>
      <div v-for="voice in voiceMessages" :key="voice.id" class="voice-item">
        <div class="voice-message" @click="playVoice(voice)">
          <div class="voice-icon">
            <span v-if="!voice.isPlaying">🎤</span>
            <span v-else>⏸️</span>
          </div>
          <div class="voice-duration">{{ voice.duration }}"</div>
          <div class="voice-waveform">
            <div class="wave-bar" v-for="i in 5" :key="i" :class="{ active: voice.isPlaying }"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';

// 录音相关变量
const isRecording = ref(false);
const mediaRecorder = ref(null);
const audioChunks = ref([]);
const recordingStartTime = ref(0);
const recordingTimer = ref(null);
const recordingDuration = ref(0);
const voiceMessages = ref([]);

// 开始录音
const startRecording = async () => {
  if (isRecording.value) return;
  
  try {
    console.log('[Voice Test] 开始录音...');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    mediaRecorder.value = new MediaRecorder(stream);
    audioChunks.value = [];
    
    mediaRecorder.value.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.value.push(event.data);
      }
    };
    
    mediaRecorder.value.onstop = () => {
      console.log('[Voice Test] 录音结束，处理音频数据...');
      const audioBlob = new Blob(audioChunks.value, { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // 添加到语音消息列表
      voiceMessages.value.push({
        id: Date.now(),
        duration: recordingDuration.value,
        url: audioUrl,
        isPlaying: false
      });
      
      // 停止所有音频轨道
      stream.getTracks().forEach(track => track.stop());
    };
    
    mediaRecorder.value.start();
    isRecording.value = true;
    recordingStartTime.value = Date.now();
    
    // 开始计时
    recordingTimer.value = setInterval(() => {
      recordingDuration.value = Math.floor((Date.now() - recordingStartTime.value) / 1000);
      
      // 最大录制60秒
      if (recordingDuration.value >= 60) {
        stopRecording();
      }
    }, 100);
    
    ElMessage.info('开始录音，松开发送');
    
  } catch (error) {
    console.error('[Voice Test] 录音失败:', error);
    ElMessage.error('无法访问麦克风，请检查权限设置');
  }
};

// 停止录音
const stopRecording = () => {
  if (!isRecording.value || !mediaRecorder.value) return;
  
  console.log('[Voice Test] 停止录音...');
  
  // 检查录音时长
  const duration = Math.floor((Date.now() - recordingStartTime.value) / 1000);
  if (duration < 1) {
    ElMessage.warning('录音时间太短，请重新录制');
    cancelRecording();
    return;
  }
  
  isRecording.value = false;
  recordingDuration.value = duration;
  
  if (recordingTimer.value) {
    clearInterval(recordingTimer.value);
    recordingTimer.value = null;
  }
  
  if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
    mediaRecorder.value.stop();
  }
};

// 取消录音
const cancelRecording = () => {
  if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
    mediaRecorder.value.stop();
  }
  
  isRecording.value = false;
  recordingDuration.value = 0;
  
  if (recordingTimer.value) {
    clearInterval(recordingTimer.value);
    recordingTimer.value = null;
  }
  
  // 停止所有音频轨道
  if (mediaRecorder.value && mediaRecorder.value.stream) {
    mediaRecorder.value.stream.getTracks().forEach(track => track.stop());
  }
};

// 播放语音
const playVoice = (voice) => {
  if (voice.isPlaying) {
    // 如果正在播放，则停止
    voice.isPlaying = false;
    return;
  }
  
  console.log('[Voice Test] 播放语音:', voice.url);
  
  const audio = new Audio(voice.url);
  voice.isPlaying = true;
  
  audio.onended = () => {
    voice.isPlaying = false;
  };
  
  audio.onerror = () => {
    voice.isPlaying = false;
    ElMessage.error('语音播放失败');
  };
  
  audio.play().catch(error => {
    console.error('[Voice Test] 播放失败:', error);
    voice.isPlaying = false;
    ElMessage.error('语音播放失败');
  });
};
</script>

<style scoped>
.voice-test {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.test-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.record-btn {
  padding: 15px 30px;
  font-size: 16px;
  border: none;
  border-radius: 8px;
  background-color: #409eff;
  color: white;
  cursor: pointer;
  transition: all 0.3s;
}

.record-btn:hover {
  background-color: #66b1ff;
}

.record-btn.recording {
  background-color: #f56c6c;
  animation: recording-pulse 1s infinite;
}

@keyframes recording-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.voice-item {
  margin-bottom: 10px;
}

.voice-message {
  display: flex;
  align-items: center;
  background-color: #f5f7fa;
  border-radius: 20px;
  padding: 10px 15px;
  cursor: pointer;
  transition: background-color 0.3s;
  max-width: 200px;
}

.voice-message:hover {
  background-color: #e4e7ed;
}

.voice-icon {
  display: flex;
  align-items: center;
  font-size: 18px;
  margin-right: 8px;
}

.voice-duration {
  font-size: 14px;
  color: #606266;
  margin-right: 10px;
  min-width: 20px;
}

.voice-waveform {
  display: flex;
  align-items: center;
  gap: 2px;
}

.wave-bar {
  width: 3px;
  height: 12px;
  background-color: #c0c4cc;
  border-radius: 1px;
  transition: all 0.3s;
}

.wave-bar.active {
  background-color: #409eff;
  animation: wave-animation 1s infinite;
}

.wave-bar:nth-child(1) { animation-delay: 0s; }
.wave-bar:nth-child(2) { animation-delay: 0.1s; }
.wave-bar:nth-child(3) { animation-delay: 0.2s; }
.wave-bar:nth-child(4) { animation-delay: 0.3s; }
.wave-bar:nth-child(5) { animation-delay: 0.4s; }

@keyframes wave-animation {
  0%, 100% { height: 12px; }
  50% { height: 20px; }
}
</style>