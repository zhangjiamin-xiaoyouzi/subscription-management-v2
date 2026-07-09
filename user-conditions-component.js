const SIMPLE_OPERATORS = {
  contains: '包含',
  notContains: '不包含',
  between: '区间',
  eq: '等于',
};

const SIMPLE_NUMERIC_OPERATORS = {
  gte: '大于等于',
  gt: '大于',
  lte: '小于等于',
  lt: '小于',
  eq: '等于',
  between: '介于',
};

const SIMPLE_SCORE_TYPES = {
  cycleV5PeriodHealthScore: { label: '本周期V5版经期健康度得分', min: 0, max: 100 },
  prevCycleV5PeriodHealthScore: { label: '上周期V5版经期健康度得分', min: 0, max: 100 },
  cycleV5PeriodHealthAbnormalMetricCount: { label: '本周期V5版经期健康度异常指标数', min: 0, max: 7 },
  prevCycleV5PeriodHealthAbnormalMetricCount: { label: '上周期V5版经期健康度异常指标数', min: 0, max: 7 },
};

const UserConditionsTemplate = `
<div class="user-conditions-wrapper">
  <template v-for="(group, gi) in modelValue" :key="getGroupKey(group, gi)">
    <div class="group-logic-divider" v-if="gi > 0">
      <div class="logic-switcher">
        <button type="button" class="logic-btn" :class="{ active: group.groupLogic === 'and' }" @click="setGroupLogic(gi, 'and')">且</button>
        <button type="button" class="logic-btn" :class="{ active: group.groupLogic === 'or' }" @click="setGroupLogic(gi, 'or')">或</button>
      </div>
    </div>
    <div class="condition-group">
      <div class="condition-group-header" :class="{ 'condition-group-header-between': showGroupRemoveButton }">
        <span class="condition-group-title">条件组 {{ gi + 1 }}</span>
        <button
          v-if="showGroupRemoveButton && canShowGroupRemove()"
          :class="groupRemoveButtonClass"
          type="button"
          @click="removeGroup(gi)"
          :disabled="isGroupRemoveDisabled()"
        >{{ groupRemoveLabel }}</button>
      </div>
      <template v-for="(cond, ci) in group.conditions" :key="getConditionKey(cond, ci)">
        <div class="group-logic-divider" v-if="ci > 0">
          <div class="logic-switcher">
            <button type="button" class="logic-btn" :class="{ active: cond.condLogic === 'and' }" @click="setCondLogic(gi, ci, 'and')">且</button>
            <button type="button" class="logic-btn" :class="{ active: cond.condLogic === 'or' }" @click="setCondLogic(gi, ci, 'or')">或</button>
          </div>
        </div>
        <div class="condition-row">
          <template v-if="!isAdvanced">
            <select class="select-field" v-model="cond.type" @change="handleSimpleTypeChange(cond)">
              <option value="">请选择条件类型</option>
              <option value="memberStatus">会员状态</option>
              <option value="identityMode">身份模式</option>
              <option value="pregnancyWeek">怀孕周数</option>
              <option value="babyMonth">宝宝月数</option>
              <option value="memberDays">首开会员距今天数</option>
              <option value="cycleV5PeriodHealthScore">本周期V5版经期健康度得分</option>
              <option value="prevCycleV5PeriodHealthScore">上周期V5版经期健康度得分</option>
              <option value="cycleV5PeriodHealthAbnormalMetricCount">本周期V5版经期健康度异常指标数</option>
              <option value="prevCycleV5PeriodHealthAbnormalMetricCount">上周期V5版经期健康度异常指标数</option>
              <option value="couponStatus">待领取券</option>
              <option value="dingting">谛听人群包</option>
            </select>
            <select class="select-field" v-model="cond.operator" v-if="cond.type">
              <option v-for="op in getSimpleOperatorsForType(cond.type)" :key="op" :value="op">
                {{ getSimpleOperatorLabel(op) }}
              </option>
            </select>
            <input
              v-if="cond.type && isSimpleScoreType(cond.type) && cond.operator !== 'between'"
              class="input-field"
              type="number"
              :min="getSimpleScoreRange(cond.type).min"
              :max="getSimpleScoreRange(cond.type).max"
              v-model.number="cond.value"
              placeholder="请输入数值"
              style="width:100px;"
            />
            <input class="input-field" type="text" v-model="cond.value" v-if="cond.type && !isSimpleScoreType(cond.type) && cond.operator !== 'between'" :placeholder="valuePlaceholder" />
            <template v-if="cond.type && cond.operator === 'between'">
              <input
                class="input-field"
                type="number"
                :min="getSimpleScoreRange(cond.type).min"
                :max="getSimpleScoreRange(cond.type).max"
                v-model.number="cond.min"
                placeholder="数值1"
                style="width:80px;"
              />
              <span class="version-sep">，</span>
              <input
                class="input-field"
                type="number"
                :min="getSimpleScoreRange(cond.type).min"
                :max="getSimpleScoreRange(cond.type).max"
                v-model.number="cond.max"
                placeholder="数值2"
                style="width:80px;"
              />
            </template>
            <button class="cond-remove" type="button" @click="removeCond(gi, ci)" :disabled="group.conditions.length <= 1" title="删除">×</button>
          </template>
          <template v-else>
            <div class="select-wrap field" :class="{ open: cond.fieldOpen }" v-click-outside="() => cond.fieldOpen = false">
              <div class="select-trigger" :class="{ open: cond.fieldOpen }" @click="cond.fieldOpen = !cond.fieldOpen">
                <span v-if="!cond.field" class="placeholder">请选择</span>
                <span v-else>{{ callGetter(getFieldLabel, cond.field) }}</span>
              </div>
              <span class="select-arrow">▾</span>
              <div class="select-dropdown" v-show="cond.fieldOpen">
                <div class="select-option"
                     v-for="opt in fieldOptions" :key="opt.value"
                     :class="{ selected: cond.field === opt.value }"
                     @click.stop="handleFieldChange(cond, opt.value)">
                  {{ opt.label }}
                </div>
              </div>
            </div>
            <div class="select-wrap operator" :class="{ open: cond.opOpen }" v-click-outside="() => cond.opOpen = false">
              <div class="select-trigger" :class="{ open: cond.opOpen }" @click="cond.opOpen = !cond.opOpen">
                <span v-if="!cond.operator" class="placeholder">请选择</span>
                <span v-else>{{ callGetter(getOperatorLabel, cond.operator) }}</span>
              </div>
              <span class="select-arrow">▾</span>
              <div class="select-dropdown" v-show="cond.opOpen">
                <div class="select-option"
                     v-for="op in callGetter(getOperatorsForField, cond.field, [])" :key="op"
                     :class="{ selected: cond.operator === op }"
                     @click.stop="cond.operator = op; cond.opOpen = false">
                  {{ callGetter(getOperatorLabel, op) }}
                </div>
              </div>
            </div>
            <div class="value-area">
              <div v-if="cond.field && callGetter(isMultiValueField, cond.field, false)" class="multi-select-tags" :class="{ open: cond.valueOpen }" @click="cond.valueOpen = !cond.valueOpen">
                <span v-for="(v, vi) in cond.valueArr" :key="vi" class="tag-item">
                  {{ v }}
                  <span class="tag-close" @click.stop="handleRemoveMultiValue(cond, vi)">✕</span>
                </span>
                <input class="search-input" :placeholder="cond.valueArr.length === 0 ? '请选择' : ''"
                       v-model="cond.searchText" @keydown.enter.prevent="handleAddMultiValue(cond)" />
                <div class="select-dropdown" v-show="cond.valueOpen" v-click-outside="() => cond.valueOpen = false">
                  <div class="select-option"
                       v-for="vo in callGetter(getValueOptionsForField, cond.field, [])" :key="vo"
                       :class="{ selected: cond.valueArr.includes(vo) }"
                       @click.stop="handleToggleMultiValue(cond, vo)">
                    {{ vo }}
                  </div>
                </div>
              </div>
              <input v-else-if="cond.field && callGetter(isTextValueField, cond.field, false)" class="input-field" type="text" v-model="cond.textValue" :placeholder="valuePlaceholder" />
              <div v-else-if="cond.field && callGetter(isNumberValueField, cond.field, false)" class="spinbutton-wrap">
                <span class="spin-btn" @click="cond.numValue = Math.max(0, (cond.numValue || 0) - 1)">−</span>
                <input class="spin-input" type="text" v-model.number="cond.numValue" @input="cond.numValue = parseInt(cond.numValue, 10) || 0" />
                <span class="spin-btn" @click="cond.numValue = (cond.numValue || 0) + 1">＋</span>
              </div>
              <div v-else-if="cond.field && callGetter(isDateRangeField, cond.field, false)" class="date-range-wrap">
                <input class="date-input" type="text" v-model="cond.dateStart" placeholder="开始时间" />
                <span class="date-sep">至</span>
                <input class="date-input" type="text" v-model="cond.dateEnd" placeholder="结束时间" />
                <span class="date-range-clear" @click="cond.dateStart=''; cond.dateEnd=''" v-if="cond.dateStart || cond.dateEnd">✕</span>
              </div>
            </div>
            <button v-if="showConditionToggleButton" class="cond-icon-btn" type="button" title="切换条件" @click="handleToggleCondition(cond)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
            </button>
            <button class="cond-icon-btn" type="button" title="添加条件" @click="addCond(gi)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            </button>
            <button v-if="canShowConditionRemove(group)" class="cond-icon-btn" type="button" title="删除条件" @click="removeCond(gi, ci)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            </button>
          </template>
        </div>
      </template>
      <button v-if="showGroupFooterAdd" :class="addConditionButtonClass" type="button" @click="addCond(gi)">{{ addConditionText }}</button>
    </div>
  </template>
  <button :class="addGroupButtonClass" type="button" @click="addGroup" style="margin-top:8px;">{{ addGroupText }}</button>
</div>
`;

const UserConditions = {
  name: 'UserConditions',
  template: UserConditionsTemplate,
  directives: {
    clickOutside: {
      mounted(el, binding) {
        el.__clickOutsideHandler = (event) => {
          if (!el.contains(event.target) && el !== event.target) {
            binding.value(event);
          }
        };
        document.addEventListener('click', el.__clickOutsideHandler);
      },
      unmounted(el) {
        document.removeEventListener('click', el.__clickOutsideHandler);
      },
    },
  },
  props: {
    modelValue: { type: Array, default: () => [] },
    mode: { type: String, default: 'simple' },
    createGroup: { type: Function, default: null },
    createCondition: { type: Function, default: null },
    groupKeyField: { type: String, default: '' },
    conditionKeyField: { type: String, default: '' },
    showGroupRemoveButton: { type: Boolean, default: true },
    groupRemoveMode: { type: String, default: 'disable' },
    groupRemoveButtonClass: { type: String, default: 'cond-remove' },
    groupRemoveLabel: { type: String, default: '×' },
    addConditionButtonClass: { type: String, default: 'add-cond-btn' },
    addConditionText: { type: String, default: '＋ 添加条件' },
    showGroupFooterAdd: { type: Boolean, default: true },
    addGroupButtonClass: { type: String, default: 'btn-dashed' },
    addGroupText: { type: String, default: '＋ 添加条件组' },
    valuePlaceholder: { type: String, default: '请输入值' },
    showConditionToggleButton: { type: Boolean, default: false },
    fieldOptions: { type: Array, default: () => [] },
    getFieldLabel: { type: Function, default: null },
    getOperatorLabel: { type: Function, default: null },
    getOperatorsForField: { type: Function, default: null },
    getValueOptionsForField: { type: Function, default: null },
    isMultiValueField: { type: Function, default: null },
    isTextValueField: { type: Function, default: null },
    isNumberValueField: { type: Function, default: null },
    isDateRangeField: { type: Function, default: null },
    onFieldChange: { type: Function, default: null },
    onAddMultiValue: { type: Function, default: null },
    onRemoveMultiValue: { type: Function, default: null },
    onToggleMultiValue: { type: Function, default: null },
    onToggleCondition: { type: Function, default: null },
  },
  emits: ['update:modelValue'],
  computed: {
    isAdvanced() {
      return this.mode === 'advanced';
    },
  },
  methods: {
    isSimpleScoreType(type) {
      return Object.prototype.hasOwnProperty.call(SIMPLE_SCORE_TYPES, type);
    },
    getSimpleScoreRange(type) {
      return this.isSimpleScoreType(type) ? SIMPLE_SCORE_TYPES[type] : { min: 0, max: 100 };
    },
    getSimpleOperatorsForType(type) {
      if (this.isSimpleScoreType(type)) {
        return ['gte', 'gt', 'lte', 'lt', 'eq', 'between'];
      }
      return ['contains', 'notContains', 'between', 'eq'];
    },
    getSimpleOperatorLabel(operator) {
      return SIMPLE_NUMERIC_OPERATORS[operator] || SIMPLE_OPERATORS[operator] || operator;
    },
    clampSimpleScoreValue(value, type) {
      if (value === '' || value === null || value === undefined || Number.isNaN(Number(value))) {
        return '';
      }
      const { min, max } = this.getSimpleScoreRange(type);
      return Math.min(max, Math.max(min, Number(value)));
    },
    handleSimpleTypeChange(cond) {
      if (this.isSimpleScoreType(cond.type)) {
        cond.operator = cond.operator && this.getSimpleOperatorsForType(cond.type).includes(cond.operator) ? cond.operator : 'gte';
        cond.value = this.clampSimpleScoreValue(cond.value, cond.type);
        cond.min = this.clampSimpleScoreValue(cond.min, cond.type);
        cond.max = this.clampSimpleScoreValue(cond.max, cond.type);
        return;
      }
      cond.operator = cond.operator && this.getSimpleOperatorsForType(cond.type).includes(cond.operator) ? cond.operator : 'contains';
      cond.value = cond.value ?? '';
      cond.min = cond.min ?? null;
      cond.max = cond.max ?? null;
    },
    defaultCreateCondition() {
      return { type: '', operator: 'contains', value: '', min: null, max: null, condLogic: 'and' };
    },
    defaultCreateGroup() {
      return { groupLogic: 'and', conditions: [this.defaultCreateCondition()] };
    },
    emitGroups(groups) {
      this.$emit('update:modelValue', groups);
    },
    nextGroup() {
      return this.createGroup ? this.createGroup() : this.defaultCreateGroup();
    },
    nextCondition() {
      return this.createCondition ? this.createCondition() : this.defaultCreateCondition();
    },
    addGroup() {
      this.emitGroups([...this.modelValue, this.nextGroup()]);
    },
    removeGroup(gi) {
      if (this.modelValue.length <= 1) return;
      const groups = [...this.modelValue];
      groups.splice(gi, 1);
      this.emitGroups(groups);
    },
    addCond(gi) {
      const groups = [...this.modelValue];
      groups[gi].conditions.push(this.nextCondition());
      this.emitGroups(groups);
    },
    removeCond(gi, ci) {
      const groups = [...this.modelValue];
      if (groups[gi].conditions.length <= 1) return;
      groups[gi].conditions.splice(ci, 1);
      this.emitGroups(groups);
    },
    setGroupLogic(gi, logic) {
      const groups = [...this.modelValue];
      groups[gi].groupLogic = logic;
      this.emitGroups(groups);
    },
    setCondLogic(gi, ci, logic) {
      const groups = [...this.modelValue];
      groups[gi].conditions[ci].condLogic = logic;
      this.emitGroups(groups);
    },
    getGroupKey(group, gi) {
      return this.groupKeyField && group[this.groupKeyField] != null ? group[this.groupKeyField] : gi;
    },
    getConditionKey(cond, ci) {
      return this.conditionKeyField && cond[this.conditionKeyField] != null ? cond[this.conditionKeyField] : ci;
    },
    canShowGroupRemove() {
      return this.groupRemoveMode === 'disable' || this.modelValue.length > 1;
    },
    isGroupRemoveDisabled() {
      return this.groupRemoveMode === 'disable' && this.modelValue.length <= 1;
    },
    canShowConditionRemove(group) {
      return group.conditions.length > 1;
    },
    callGetter(getter, value, fallback) {
      if (!getter) return fallback;
      return getter(value);
    },
    handleFieldChange(cond, value) {
      if (this.onFieldChange) {
        this.onFieldChange(cond, value);
        return;
      }
      cond.type = value;
    },
    handleAddMultiValue(cond) {
      if (this.onAddMultiValue) {
        this.onAddMultiValue(cond);
      }
    },
    handleRemoveMultiValue(cond, vi) {
      if (this.onRemoveMultiValue) {
        this.onRemoveMultiValue(cond, vi);
      }
    },
    handleToggleMultiValue(cond, value) {
      if (this.onToggleMultiValue) {
        this.onToggleMultiValue(cond, value);
      }
    },
    handleToggleCondition(cond) {
      if (this.onToggleCondition) {
        this.onToggleCondition(cond);
      }
    },
  },
};

const UserConditionsCSS = `
.user-conditions-wrapper { width: 100%; }
.condition-group { background: #fafafa; border: 1px solid #f0f0f0; border-radius: 4px; padding: 16px; margin-bottom: 12px; }
.condition-group-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.condition-group-header-between { justify-content: space-between; }
.condition-group-title { font-size: 13px; color: #333; font-weight: 500; }
.logic-switcher { display: inline-flex; align-items: center; gap: 0; border-radius: 4px; overflow: hidden; border: 1px solid #ffb3cc; }
.logic-btn { padding: 4px 12px; font-size: 12px; font-weight: 500; border: none; background: #fff; color: #666; cursor: pointer; transition: all .15s; }
.logic-btn.active { background: #ff4d88; color: #fff; }
.logic-btn:hover:not(.active) { background: #fff0f6; color: #ff4d88; }
.condition-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.condition-row .select-field { width: 220px; }
.condition-row .input-field { width: 100px; }
.cond-remove { width: 28px; height: 28px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff; cursor: pointer; font-size: 16px; color: #999; display: flex; align-items: center; justify-content: center; }
.cond-remove:hover { border-color: #ff4d4f; color: #ff4d4f; }
.cond-remove:disabled { opacity: .35; cursor: not-allowed; }
.add-cond-btn { height: 28px; padding: 0 12px; font-size: 12px; color: #ff4d88; background: #fff; border: 1px dashed #ff4d88; border-radius: 4px; cursor: pointer; }
.add-cond-btn:hover { background: #fff0f6; }
.group-logic-divider { display: flex; align-items: center; justify-content: center; margin: -4px 0; position: relative; z-index: 1; }
`;

if (typeof document !== 'undefined' && !document.getElementById('user-conditions-style')) {
  const style = document.createElement('style');
  style.id = 'user-conditions-style';
  style.textContent = UserConditionsCSS;
  document.head.appendChild(style);
}

if (typeof window !== 'undefined') {
  window.UserConditions = UserConditions;
  if (window.Vue && window.Vue.createApp && !window.__userConditionsCreateAppPatched__) {
    const rawCreateApp = window.Vue.createApp.bind(window.Vue);
    window.Vue.createApp = function (...args) {
      const app = rawCreateApp(...args);
      app.component('UserConditions', UserConditions);
      return app;
    };
    window.__userConditionsCreateAppPatched__ = true;
  }
}
