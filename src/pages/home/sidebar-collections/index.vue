<template>
  <div>
    <div class="collections">
      <header>
        <div>
          <span>Collections</span>
          <ul>
            <li>
              <el-tooltip
                effect="light"
                content="隐藏窗口"
                placement="bottom"
                :offset="6"
                :show-arrow="false"
                :hide-after="100"
                :enterable="false"
              >
                <el-button
                  type="primary"
                  link
                  @click="this.$emit('hideSidebar', -1)"
                >
                  <icon-mdi-minus style="font-size: 30px" />
                </el-button>
              </el-tooltip>
            </li>
          </ul>
        </div>
        <p>收藏，是为了更好地回顾。</p>
      </header>
      <form @submit.prevent>
        <el-autocomplete
          v-model="searchValue"
          :fetch-suggestions="search"
          :trigger-on-focus="false"
          :maxlength="11"
          size="large"
          placeholder="搜索"
          spellcheck="false"
          clearable
        >
          <template #prefix><icon-ep-search /></template>
        </el-autocomplete>
      </form>
      <el-empty
          class="collections-empty"
          description="还没有收藏哦..."
        >
          <template #image><icon-mdi-forum-remove-outline /></template>
        </el-empty>
    </div>
  </div>
</template>

<script>
import { ref } from "vue";
export default {
  name: "SidebarCollections",
  setup() {
    const searchValue = ref("");
    const search = (queryString, callback) => {
      let results = [];
      callback(results);
    };
    return {
      searchValue,
      search,
    };
  },
};
</script>

<style scoped>
.collections {
  display: flex;
  width: 400px;
  flex-flow: column nowrap;
  flex: 1;
}
.collections header {
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-end;
  height: 100px;
  padding: 0 30px 0 35px;
}
.collections header div {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}
.collections header span {
  font-size: 32px;
  font-weight: 600;
  color: var(--theme-color-light-1);
}
.collections header p {
  color: var(--theme-color-light-2);
  margin: 0;
  padding-left: 2px;
}
.collections header ul {
  list-style: none;
  margin-bottom: 0;
}
.collections header ul li {
  display: inline-block;
}
.collections form {
  display: flex;
  flex-flow: column nowrap;
  padding: 24px 30px;
}
.collections-empty {
  height: 730px;
  justify-content: flex-start;
  padding-top: 150px;
}
</style>
