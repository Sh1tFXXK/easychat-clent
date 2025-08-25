<template>
  <div>
    <div class="groups">
      <header>
        <div>
          <span>Groups</span>
          <ul>
            <li>
              <el-tooltip
                effect="light"
                content="新建群聊"
                placement="bottom"
                :offset="6"
                :show-arrow="false"
                :hide-after="100"
                :enterable="false"
              >
                <el-button type="primary" link>
                  <icon-mdi-comment-plus-outline style="font-size: 30px" />
                </el-button>
              </el-tooltip>
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
        <p>有群聊，不孤单。</p>
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
          class="groups-empty"
          description="还没有群聊哦..."
        >
          <template #image><icon-mdi-forum-remove-outline /></template>
        </el-empty>
    </div>
  </div>
</template>

<script>
import { ref } from "vue";
export default {
  name: "SidebarGroups",
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
.groups {
  display: flex;
  width: 400px;
  flex-flow: column nowrap;
  flex: 1;
}
.groups header {
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-end;
  height: 100px;
  padding: 0 30px 0 35px;
}
.groups header div {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}
.groups header span {
  font-size: 32px;
  font-weight: 600;
  color: var(--theme-color-light-1);
}
.groups header p {
  color: var(--theme-color-light-2);
  margin: 0;
  padding-left: 2px;
}
.groups header ul {
  list-style: none;
  margin-bottom: 0;
}
.groups header ul li {
  display: inline-block;
}
.groups form {
  display: flex;
  flex-flow: column nowrap;
  padding: 24px 30px;
}
.groups-empty {
  height: 730px;
  justify-content: flex-start;
  padding-top: 150px;
}
</style>
